#!/usr/bin/env python
# ============================================================================
# Project Handlers: Naman Sain & Souvik Mallik
# 
# Maintainers:
# - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
# - Souvik Mallik: Embedded Maintainer
# ============================================================================

# -*- coding: utf-8 -*-
# swarmy_base_node.py - Swarmy Bot ROS base node
# Industrial-grade rewrite with velocity smoothing & honest fake odometry

import rospy
import serial
import time
import math
import json
import tf
import Jetson.GPIO as GPIO
from geometry_msgs.msg import Twist, Quaternion
from nav_msgs.msg import Odometry
from sensor_msgs.msg import JointState, Imu

# -- Hardware ---------------------------------------------------------
PORT = '/dev/ttyACM0'
BAUD = 115200

# Robot geometry (must match URDF)
WHEEL_RADIUS       = 0.05
WHEEL_SEPARATION   = 0.22172
ENC_COUNTS_PER_REV = 26325.0

# Motor PWM limits
MAX_PWM        = 255
MIN_PWM        = 130          # minimum PWM to overcome static friction
MAX_LINEAR_REF = 0.105        # physical top speed (m/s) at MAX_PWM

# -- Velocity Smoothing -----------------------------------------------
# Software acceleration limiter so motors never get instant speed jumps.
ACCEL_LIMIT_LINEAR  = 0.5     # m/s per second (increased for faster max speed attainment)
ACCEL_LIMIT_ANGULAR = 1.5     # rad/s per second

# -- Runtime state -----------------------------------------------------
ser           = None
last_cmd_time = 0.0

# Accumulated wheel angles (for /joint_states visualization)
wheel_angle_left  = 0.0
wheel_angle_right = 0.0

# Accumulated odometry pose
odom_x   = 0.0
odom_y   = 0.0
odom_yaw = 0.0

# Target velocity (from /cmd_vel callback)
target_v = 0.0
target_w = 0.0

# Smoothed velocity (actually being sent to motors RIGHT NOW)
smooth_v = 0.0
smooth_w = 0.0

joint_pub = None
imu_pub   = None
odom_pub  = None
tf_br     = None


# -- Helpers -----------------------------------------------------------
def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def norm_angle(a):
    while a >  math.pi: a -= 2.0 * math.pi
    while a < -math.pi: a += 2.0 * math.pi
    return a


def open_serial():
    global ser
    
    # Wake up ESP32 via EN pin wired to Jetson Pin 40
    try:
        GPIO.setwarnings(False)
        GPIO.setmode(GPIO.BOARD)
        GPIO.setup(40, GPIO.OUT, initial=GPIO.LOW)
        rospy.loginfo('[base_node] Resetting ESP32 via Jetson Pin 40...')
        time.sleep(0.5) # hold in reset
        GPIO.output(40, GPIO.HIGH)
        rospy.loginfo('[base_node] ESP32 pulled out of reset. Waiting for boot...')
        time.sleep(2.0) # wait for boot
    except Exception as e:
        rospy.logwarn('[base_node] Could not control Jetson.GPIO Pin 40: %s', e)

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


# -- Velocity to PWM (with deadband mapping) ---------------------------
def vel_to_pwm(vel, multiplier):
    """Map a single wheel velocity (m/s) to a PWM value."""
    if abs(vel) < 0.005:
        return 0
    frac = clamp(abs(vel) / MAX_LINEAR_REF, 0.0, 1.0)
    pwm = MIN_PWM + frac * (MAX_PWM - MIN_PWM)
    pwm = int(math.copysign(pwm, vel))
    pwm = int(pwm * multiplier)
    return clamp(pwm, -MAX_PWM, MAX_PWM)


# -- /cmd_vel callback -------------------------------------------------
def cmd_cb(msg):
    global last_cmd_time, target_v, target_w
    target_v = msg.linear.x
    target_w = msg.angular.z
    last_cmd_time = time.time()


# -- Fixed-rate control loop (20 Hz) -----------------------------------
def control_loop(event):
    """
    Runs at a fixed 20 Hz and:
      1. Ramps smooth_v / smooth_w toward target_v / target_w
      2. Converts the smoothed velocity to PWM and sends to ESP32
      3. Publishes fake odometry based on the SMOOTHED velocity
         (what the motors are actually doing), not the raw cmd_vel
    """
    global smooth_v, smooth_w, target_v, target_w
    global odom_x, odom_y, odom_yaw
    global wheel_angle_left, wheel_angle_right

    dt = 0.05  # 1/20 Hz

    # -- Watchdog: zero target if no cmd_vel received recently ---------
    if time.time() - last_cmd_time > 0.5:
        target_v = 0.0
        target_w = 0.0

    # -- Software velocity ramp (acceleration limiter) -----------------
    max_dv = ACCEL_LIMIT_LINEAR  * dt
    max_dw = ACCEL_LIMIT_ANGULAR * dt

    dv = target_v - smooth_v
    if abs(dv) > max_dv:
        dv = math.copysign(max_dv, dv)
    smooth_v += dv

    dw = target_w - smooth_w
    if abs(dw) > max_dw:
        dw = math.copysign(max_dw, dw)
    smooth_w += dw

    # -- Differential drive kinematics ---------------------------------
    vl = smooth_v - smooth_w * WHEEL_SEPARATION / 2.0
    vr = smooth_v + smooth_w * WHEEL_SEPARATION / 2.0

    # -- Convert to PWM and send to ESP32 ------------------------------
    left_mult  = rospy.get_param('/swarmy/left_multiplier',  0.85)
    right_mult = rospy.get_param('/swarmy/right_multiplier', 1.0)

    pwm_l = vel_to_pwm(vl, left_mult)
    pwm_r = vel_to_pwm(vr, right_mult)

    if ser is not None:
        try:
            ser.write('{},{}\n'.format(-pwm_r, -pwm_l).encode())
        except Exception as e:
            rospy.logerr_throttle(1.0, '[base_node] Serial write: %s', e)

    # -- Fake odometry based on smoothed velocity ----------------------
    odom_lin_mult = rospy.get_param('/swarmy/fake_odom_linear_multiplier',  1.0)
    odom_ang_mult = rospy.get_param('/swarmy/fake_odom_angular_multiplier', 1.0)

    odom_v = smooth_v * odom_lin_mult
    odom_w = smooth_w * odom_ang_mult

    ds   = odom_v * dt
    dyaw = odom_w * dt

    mid_yaw   = odom_yaw + dyaw / 2.0
    odom_x   += ds * math.cos(mid_yaw)
    odom_y   += ds * math.sin(mid_yaw)
    odom_yaw  = norm_angle(odom_yaw + dyaw)

    stamp = rospy.Time.now()
    qz = math.sin(odom_yaw / 2.0)
    qw = math.cos(odom_yaw / 2.0)

    # -- Publish /wheel/odom -------------------------------------------
    pose_cov = [
        0.05, 0.0,  0.0,  0.0, 0.0, 0.0,
        0.0,  0.05, 0.0,  0.0, 0.0, 0.0,
        0.0,  0.0,  1e6,  0.0, 0.0, 0.0,
        0.0,  0.0,  0.0,  1e6, 0.0, 0.0,
        0.0,  0.0,  0.0,  0.0, 1e6, 0.0,
        0.0,  0.0,  0.0,  0.0, 0.0, 0.1,
    ]
    twist_cov = [
        0.05, 0.0,  0.0,  0.0, 0.0, 0.0,
        0.0,  0.05, 0.0,  0.0, 0.0, 0.0,
        0.0,  0.0,  1e6,  0.0, 0.0, 0.0,
        0.0,  0.0,  0.0,  1e6, 0.0, 0.0,
        0.0,  0.0,  0.0,  0.0, 1e6, 0.0,
        0.0,  0.0,  0.0,  0.0, 0.0, 0.1,
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
    odom.twist.twist.linear.x  = odom_v
    odom.twist.twist.angular.z = odom_w
    odom.twist.covariance      = twist_cov
    odom_pub.publish(odom)

    # -- Publish /joint_states for URDF visualization ------------------
    dl_m = vl * dt
    dr_m = vr * dt
    drad_l = dl_m / WHEEL_RADIUS
    drad_r = dr_m / WHEEL_RADIUS
    wheel_angle_left  += drad_l
    wheel_angle_right += -drad_r

    js = JointState()
    js.header.stamp = stamp
    js.name     = ['lw_joint', 'rw_joint', 'fc_joint', 'fcw_joint', 'rc_joint', 'rcw_joint']
    js.position = [wheel_angle_left, wheel_angle_right, 0.0, 0.0, 0.0, 0.0]
    js.velocity = [drad_l / dt if dt > 1e-6 else 0.0,
                   drad_r / dt if dt > 1e-6 else 0.0,
                   0.0, 0.0, 0.0, 0.0]
    js.effort   = []
    joint_pub.publish(js)


# -- IMU publisher (called from serial reader) -------------------------
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
    
    # Read Quaternions from BNO055
    imu.orientation.w = data.get('qw', 1.0)
    imu.orientation.x = data.get('qx', 0.0)
    imu.orientation.y = data.get('qy', 0.0)
    imu.orientation.z = data.get('qz', 0.0)

    # Set valid orientation covariance
    imu.orientation_covariance = [
        0.01, 0.0, 0.0,
         0.0, 0.01, 0.0,
         0.0, 0.0, 0.01
    ]
    imu.angular_velocity_covariance = [
        0.01, 0.0,  0.0,
        0.0,  0.01, 0.0,
        0.0,  0.0,  0.01
    ]
    imu.linear_acceleration_covariance = [
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 0.0, 1.0
    ]
    imu_pub.publish(imu)


# -- ESP32 serial reader (just for IMU now) ----------------------------
def read_serial():
    """Non-blocking read of ESP32 JSON lines. Only used for IMU data."""
    try:
        if ser is not None and ser.in_waiting:
            line = ser.readline().decode('utf-8', 'ignore').strip()
            if line.startswith('{') and line.endswith('}'):
                try:
                    d = json.loads(line)
                    if 'enc_l' in d:
                        publish_imu(d, rospy.Time.now())
                except Exception:
                    pass
    except Exception as e:
        rospy.logerr_throttle(1.0, '[base_node] Serial read: %s', e)


# -- Shutdown ----------------------------------------------------------
def shutdown_hook():
    try:
        if ser:
            ser.write(b'0,0\n')
            time.sleep(0.1)
            ser.write(b'STOP\n')
            time.sleep(0.2)
            ser.close()
    except Exception:
        pass


# -- Main --------------------------------------------------------------
if __name__ == '__main__':
    rospy.init_node('swarmy_base_node')

    joint_pub = rospy.Publisher('/joint_states', JointState, queue_size=10)
    imu_pub   = rospy.Publisher('/imu/data_raw', Imu,        queue_size=10)
    odom_pub  = rospy.Publisher('/wheel/odom',   Odometry,   queue_size=10)
    tf_br     = tf.TransformBroadcaster()

    while not open_serial() and not rospy.is_shutdown():
        rospy.logwarn('[base_node] Retrying ESP32 on %s ...', PORT)
        time.sleep(2.0)

    rospy.Subscriber('/cmd_vel', Twist, cmd_cb, queue_size=1)

    # The single fixed-rate control loop: drives motors + publishes odom
    rospy.Timer(rospy.Duration(0.05), control_loop)   # 20 Hz

    rospy.on_shutdown(shutdown_hook)
    rospy.loginfo('[base_node] Ready -- smooth control loop at 20 Hz')

    # Main thread just reads serial for IMU data
    rate = rospy.Rate(200)
    while not rospy.is_shutdown():
        read_serial()
        rate.sleep()
