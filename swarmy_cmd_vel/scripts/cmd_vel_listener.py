#!/usr/bin/env python
import rospy
import serial
import time
import math
from geometry_msgs.msg import Twist

WHEEL_BASE   = 0.17
WHEEL_RADIUS = 0.033
MAX_PWM      = 180
MIN_PWM      = 45
PORT         = '/dev/ttyACM0'
BAUD         = 115200

ser = None
last_send_time = 0.0

def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def open_and_sync():
    global ser
    ser = serial.Serial(PORT, BAUD, timeout=1)
    time.sleep(3.0)
    ser.reset_input_buffer()

    for i in range(20):
        ser.write(b'HELLO\n')
        time.sleep(0.25)
        line = ser.readline().decode(errors='ignore').strip()
        if line:
            rospy.loginfo("ESP RX: %s", line)
        if '"ack":"HELLO"' in line or '"ack":"PONG"' in line:
            rospy.loginfo("ESP32 handshake OK")
            return True

    rospy.logerr("ESP32 handshake failed on %s", PORT)
    return False

def twist_to_pwm(msg):
    v = msg.linear.x
    w = msg.angular.z

    v_left  = v - (w * WHEEL_BASE / 2.0)
    v_right = v + (w * WHEEL_BASE / 2.0)

    scale = MAX_PWM / 0.35
    l = int(v_left * scale)
    r = int(v_right * scale)

    l = clamp(l, -MAX_PWM, MAX_PWM)
    r = clamp(r, -MAX_PWM, MAX_PWM)

    if l != 0 and abs(l) < MIN_PWM:
        l = int(math.copysign(MIN_PWM, l))
    if r != 0 and abs(r) < MIN_PWM:
        r = int(math.copysign(MIN_PWM, r))

    return l, r

def cmd_cb(msg):
    global ser, last_send_time
    if ser is None:
        return
    l, r = twist_to_pwm(msg)
    cmd = "{},{}\n".format(l, r)
    try:
        ser.write(cmd.encode())
        last_send_time = time.time()
        rospy.loginfo("TX %s", cmd.strip())
    except Exception as e:
        rospy.logerr("Serial write failed: %s", e)

def watchdog_timer(event):
    global ser, last_send_time
    if ser is None:
        return
    if time.time() - last_send_time > 0.3:
        try:
            ser.write(b'0,0\n')
        except:
            pass

def shutdown_hook():
    global ser
    try:
        if ser:
            ser.write(b'STOP\n')
            time.sleep(0.2)
            ser.close()
    except:
        pass

if __name__ == '__main__':
    rospy.init_node('cmd_vel_listener')
    if not open_and_sync():
        raise SystemExit(1)

    rospy.Subscriber('/cmd_vel', Twist, cmd_cb, queue_size=10)
    rospy.Timer(rospy.Duration(0.1), watchdog_timer)
    rospy.on_shutdown(shutdown_hook)
    rospy.loginfo('Listening to /cmd_vel and forwarding to ESP32')
    rospy.spin()
