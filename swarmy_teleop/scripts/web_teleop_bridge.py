#!/usr/bin/env python
# ============================================================================
# Project Handlers: Naman Sain & Souvik Mallik
# 
# Maintainers:
# - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
# - Souvik Mallik: Embedded Maintainer
# ============================================================================
"""
web_teleop_bridge.py
Lightweight bridge node that subscribes to /cmd_vel and forwards commands
to the Arduino motor controller via serial. This is a stripped-down version
of swarmy_base_node.py designed for independent web joystick control.
"""

import rospy
import serial
import time
import math
from geometry_msgs.msg import Twist

# -- Hardware ---------------------------------------------------------
PORT = '/dev/ttyACM0'
BAUD = 115200

# Robot geometry (must match URDF)
WHEEL_SEPARATION   = 0.22172
MAX_PWM        = 255
MIN_PWM        = 130
MAX_LINEAR_REF = 0.105

# -- Velocity Smoothing -----------------------------------------------
ACCEL_LIMIT_LINEAR  = 0.5
ACCEL_LIMIT_ANGULAR = 1.5

# -- Runtime state -----------------------------------------------------
ser           = None
last_cmd_time = 0.0
target_v = 0.0
target_w = 0.0
smooth_v = 0.0
smooth_w = 0.0


def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def vel_to_pwm(vel, multiplier):
    if abs(vel) < 0.005:
        return 0
    frac = clamp(abs(vel) / MAX_LINEAR_REF, 0.0, 1.0)
    pwm = MIN_PWM + frac * (MAX_PWM - MIN_PWM)
    pwm = int(math.copysign(pwm, vel))
    pwm = int(pwm * multiplier)
    return clamp(pwm, -MAX_PWM, MAX_PWM)

def cmd_vel_cb(msg):
    global target_v, target_w, last_cmd_time
    target_v = msg.linear.x
    target_w = msg.angular.z
    last_cmd_time = time.time()

def connect_serial():
    global ser
    try:
        ser = serial.Serial()
        ser.port = PORT
        ser.baudrate = BAUD
        ser.dtr = False
        ser.rts = False
        ser.timeout = 0.05
        ser.open()
        time.sleep(0.5)
        ser.write(b'HELLO\n')
        rospy.loginfo('[WebTeleop] Serial connected on %s (DTR/RTS False)', PORT)
        return True
    except Exception as e:
        rospy.logwarn('[WebTeleop] Serial connect failed: %s', e)
        ser = None
        return False

def send_motor_command(left_pwm, right_pwm):
    global ser
    if ser is None or not ser.is_open:
        if not connect_serial():
            return
    cmd = '{},{}\n'.format(-int(right_pwm), -int(left_pwm))
    try:
        ser.write(cmd.encode())
    except Exception as e:
        rospy.logwarn('[WebTeleop] Serial write error: %s', e)
        ser = None

def main():
    global smooth_v, smooth_w, target_v, target_w, last_cmd_time

    rospy.init_node('web_teleop_bridge', anonymous=False)
    rospy.loginfo('[WebTeleop] Starting independent web teleop bridge node...')

    rospy.Subscriber('/cmd_vel', Twist, cmd_vel_cb, queue_size=1)
    connect_serial()

    rate = rospy.Rate(20)  # 20 Hz control loop
    dt = 0.05

    while not rospy.is_shutdown():
        # Safety timeout: if no cmd_vel received for 1 second, stop
        if time.time() - last_cmd_time > 1.0:
            target_v = 0.0
            target_w = 0.0

        # Velocity smoothing (acceleration limiter)
        dv = target_v - smooth_v
        dw = target_w - smooth_w
        max_dv = ACCEL_LIMIT_LINEAR * dt
        max_dw = ACCEL_LIMIT_ANGULAR * dt
        smooth_v += clamp(dv, -max_dv, max_dv)
        smooth_w += clamp(dw, -max_dw, max_dw)

        # Differential drive kinematics
        v_left  = smooth_v - (WHEEL_SEPARATION / 2.0) * smooth_w
        v_right = smooth_v + (WHEEL_SEPARATION / 2.0) * smooth_w

        left_pwm  = vel_to_pwm(v_left, 0.85)
        right_pwm = vel_to_pwm(v_right, 1.0)

        if abs(left_pwm) > 0 or abs(right_pwm) > 0:
            rospy.loginfo_throttle(0.5, '[WebTeleop] target(%.2f, %.2f) -> PWM L:%d R:%d', target_v, target_w, left_pwm, right_pwm)

        send_motor_command(left_pwm, right_pwm)
        rate.sleep()

    # Stop motors on shutdown
    try:
        if ser:
            ser.write(b'0,0\n')
            time.sleep(0.1)
            ser.write(b'STOP\n')
            time.sleep(0.2)
            ser.close()
    except:
        pass
    rospy.loginfo('[WebTeleop] Shutdown complete.')

if __name__ == '__main__':
    try:
        main()
    except rospy.ROSInterruptException:
        pass
