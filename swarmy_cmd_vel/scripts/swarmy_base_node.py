#!/usr/bin/env python
# swarmy_base_node.py - Swarmy Bot ROS base node - Fixed for ROS Melodic
# Place at: ~/swarmy_ws/src/swarmy_cmd_vel/scripts/swarmy_base_node.py
# chmod +x swarmy_base_node.py

import rospy
import serial
import time
import math
import json
import tf
from geometry_msgs.msg import Twist, Quaternion
from nav_msgs.msg import Odometry
from sensor_msgs.msg import JointState, Imu

# Hardware
PORT = '/dev/ttyACM0'
BAUD = 115200

# Robot geometry (must match URDF)
WHEEL_RADIUS       = 0.05
WHEEL_SEPARATION   = 0.22172
ENC_COUNTS_PER_REV = 26325.0

# Motor PWM limits
MAX_PWM        = 180
MIN_PWM        = 45
MAX_LINEAR_REF = 0.35

# Runtime state
ser           = None
last_cmd_time = 0.0
last_left     = None
last_right    = None
last_stamp    = None

# Accumulated wheel angles
wheel_angle_left  = 0.0
wheel_angle_right = 0.0

# Accumulated odometry pose
odom_x   = 0.0
odom_y   = 0.0
odom_yaw = 0.0

joint_pub = None
imu_pub   = None
odom_pub  = None
tf_br     = None


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def norm_angle(a):
    while a >  math.pi: a -= 2.0 * math.pi
    while a < -math.pi: a += 2.0 * math.pi
    return a


def open_serial():
    global ser
    ser = serial.Serial(PORT, BAUD, timeout=0.05)
    time.sleep(2.5)
    ser.reset_input_buffer()
    for _ in range(25):
        ser.write(b'HELLO\n')
        time.sleep(0.2)
        line = ser.readline().decode('utf-8', 'ignore').strip()
        if '"ack":"HELLO"' in line or '"ack":"PONG"' in line:
            rospy.loginfo('[base_node] ESP32 handshake OK on %s', PORT)
            return True
    rospy.logwarn('[base_node] Handshake timeout on %s', PORT)
    return False


def twist_to_pwm(msg):
    v  = msg.linear.x
    w  = msg.angular.z
    vl = v - w * WHEEL_SEPARATION / 2.0
    vr = v + w * WHEEL_SEPARATION / 2.0
    sc = MAX_PWM / MAX_LINEAR_REF
    l  = int(vl * sc)
    r  = int(vr * sc)
    l  = clamp(l, -MAX_PWM, MAX_PWM)
    r  = clamp(r, -MAX_PWM, MAX_PWM)
    if l != 0 and abs(l) < MIN_PWM:
        l = int(math.copysign(MIN_PWM, l))
    if r != 0 and abs(r) < MIN_PWM:
        r = int(math.copysign(MIN_PWM, r))
    return l, r


def cmd_cb(msg):
    global last_cmd_time
    if ser is None:
        return
    l, r = twist_to_pwm(msg)
    try:
        ser.write('{},{}\n'.format(l, r).encode())
        last_cmd_time = time.time()
    except Exception as e:
        rospy.logerr_throttle(1.0, '[base_node] Serial write: %s', e)


def watchdog(event):
    if ser is None:
        return
    if time.time() - last_cmd_time > 0.3:
        try:
            ser.write(b'0,0\n')
        except Exception:
            pass


def publish_joint_states(dleft_counts, dright_counts, dt, stamp):
    global wheel_angle_left, wheel_angle_right
    drad_l = (dleft_counts  / ENC_COUNTS_PER_REV) * 2.0 * math.pi
    drad_r = (dright_counts / ENC_COUNTS_PER_REV) * 2.0 * math.pi
    wheel_angle_left  += drad_l
    wheel_angle_right += drad_r
    vel_l = drad_l / dt if dt > 1e-6 else 0.0
    vel_r = drad_r / dt if dt > 1e-6 else 0.0
    js = JointState()
    js.header.stamp    = stamp
    js.header.frame_id = ''
    js.name     = ['lw_joint', 'rw_joint', 'fc_joint', 'fcw_joint', 'rc_joint', 'rcw_joint']
    js.position = [wheel_angle_left, wheel_angle_right, 0.0, 0.0, 0.0, 0.0]
    js.velocity = [vel_l, vel_r, 0.0, 0.0, 0.0, 0.0]
    js.effort   = []
    joint_pub.publish(js)


def publish_imu(data, stamp):
    imu = Imu()
    imu.header.stamp    = stamp
    imu.header.frame_id = 'imu_link'
    imu.linear_acceleration.x = data.get('ax', 0.0) * 9.80665
    imu.linear_acceleration.y = data.get('ay', 0.0) * 9.80665
    imu.linear_acceleration.z = data.get('az', 0.0) * 9.80665
    imu.angular_velocity.x = math.radians(data.get('gx', 0.0))
    imu.angular_velocity.y = math.radians(data.get('gy', 0.0))
    imu.angular_velocity.z = math.radians(data.get('gz', 0.0))
    imu.orientation_covariance = [
        -1.0, 0.0, 0.0,
         0.0, 0.0, 0.0,
         0.0, 0.0, 0.0
    ]
    imu.angular_velocity_covariance = [
        0.001, 0.0,   0.0,
        0.0,   0.001, 0.0,
        0.0,   0.0,   0.001
    ]
    imu.linear_acceleration_covariance = [
        0.5, 0.0, 0.0,
        0.0, 0.5, 0.0,
        0.0, 0.0, 0.5
    ]
    imu_pub.publish(imu)


def publish_wheel_odom(dl, dr, dt, stamp):
    global odom_x, odom_y, odom_yaw
    ds      = (dr + dl) / 2.0
    dyaw    = (dr - dl) / WHEEL_SEPARATION
    mid_yaw = odom_yaw + dyaw / 2.0
    odom_x   += ds * math.cos(mid_yaw)
    odom_y   += ds * math.sin(mid_yaw)
    odom_yaw  = norm_angle(odom_yaw + dyaw)
    qz = math.sin(odom_yaw / 2.0)
    qw = math.cos(odom_yaw / 2.0)
    tf_br.sendTransform(
        (odom_x, odom_y, 0.0),
        (0.0, 0.0, qz, qw),
        stamp,
        'base_footprint',
        'odom'
    )
    pose_cov = [
        0.01, 0.0,  0.0,  0.0,  0.0,  0.0,
        0.0,  0.01, 0.0,  0.0,  0.0,  0.0,
        0.0,  0.0,  1e6,  0.0,  0.0,  0.0,
        0.0,  0.0,  0.0,  1e6,  0.0,  0.0,
        0.0,  0.0,  0.0,  0.0,  1e6,  0.0,
        0.0,  0.0,  0.0,  0.0,  0.0,  0.05
    ]
    twist_cov = [
        0.01, 0.0,  0.0,  0.0,  0.0,  0.0,
        0.0,  0.01, 0.0,  0.0,  0.0,  0.0,
        0.0,  0.0,  1e6,  0.0,  0.0,  0.0,
        0.0,  0.0,  0.0,  1e6,  0.0,  0.0,
        0.0,  0.0,  0.0,  0.0,  1e6,  0.0,
        0.0,  0.0,  0.0,  0.0,  0.0,  0.05
    ]
    odom = Odometry()
    odom.header.stamp          = stamp
    odom.header.frame_id       = 'odom'
    odom.child_frame_id        = 'base_footprint'
    odom.pose.pose.position.x  = odom_x
    odom.pose.pose.position.y  = odom_y
    odom.pose.pose.position.z  = 0.0
    odom.pose.pose.orientation = Quaternion(0.0, 0.0, qz, qw)
    odom.pose.covariance       = pose_cov
    if dt > 1e-6:
        odom.twist.twist.linear.x  = ds   / dt
        odom.twist.twist.angular.z = dyaw / dt
    odom.twist.covariance = twist_cov
    odom_pub.publish(odom)


def process_telemetry(data):
    global last_left, last_right, last_stamp
    stamp = rospy.Time.now()
    lc    = float(data.get('enc_l', 0.0))
    rc    = float(data.get('enc_r', 0.0))
    if last_left is not None and last_stamp is not None:
        dt     = (stamp - last_stamp).to_sec()
        dt     = max(1e-6, min(dt, 0.5))
        dleft  = lc - last_left
        dright = rc - last_right
        publish_joint_states(dleft, dright, dt, stamp)
        dl = (dleft  / ENC_COUNTS_PER_REV) * 2.0 * math.pi * WHEEL_RADIUS
        dr = (dright / ENC_COUNTS_PER_REV) * 2.0 * math.pi * WHEEL_RADIUS
        publish_wheel_odom(dl, dr, dt, stamp)
    else:
        publish_joint_states(0.0, 0.0, 0.02, stamp)
        tf_br.sendTransform(
            (0.0, 0.0, 0.0),
            (0.0, 0.0, 0.0, 1.0),
            stamp,
            'base_footprint',
            'odom'
        )
    publish_imu(data, stamp)
    last_left  = lc
    last_right = rc
    last_stamp = stamp


def shutdown_hook():
    try:
        if ser:
            ser.write(b'STOP\n')
            time.sleep(0.2)
            ser.close()
    except Exception:
        pass


if __name__ == '__main__':
    rospy.init_node('swarmy_base_node')
    joint_pub = rospy.Publisher('/joint_states', JointState, queue_size=50)
    imu_pub   = rospy.Publisher('/imu/data_raw', Imu,        queue_size=50)
    odom_pub  = rospy.Publisher('/wheel/odom',   Odometry,   queue_size=50)
    tf_br     = tf.TransformBroadcaster()
    while not open_serial() and not rospy.is_shutdown():
        rospy.logwarn('[base_node] Retrying ESP32 on %s ...', PORT)
        time.sleep(2.0)
    rospy.Subscriber('/cmd_vel', Twist, cmd_cb, queue_size=10)
    rospy.Timer(rospy.Duration(0.1), watchdog)
    rospy.on_shutdown(shutdown_hook)
    rospy.loginfo('[base_node] Ready -- listening on /cmd_vel')
    rate = rospy.Rate(200)
    while not rospy.is_shutdown():
        try:
            if ser.in_waiting:
                line = ser.readline().decode('utf-8', 'ignore').strip()
                if line.startswith('{') and line.endswith('}'):
                    try:
                        d = json.loads(line)
                        if 'enc_l' in d and 'enc_r' in d:
                            process_telemetry(d)
                    except Exception:
                        pass
        except Exception as e:
            rospy.logerr_throttle(1.0, '[base_node] Serial read: %s', e)
        rate.sleep()
