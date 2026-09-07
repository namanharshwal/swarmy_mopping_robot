#!/usr/bin/env python3
import rospy
import Jetson.GPIO as GPIO
import time
from sensor_msgs.msg import LaserScan

# Pin definitions (BOARD mode)
LEFT_TRIG = 37
LEFT_ECHO = 38
RIGHT_ECHO = 35
RIGHT_TRIG = 36

def measure_distance(trig_pin, echo_pin):
    GPIO.output(trig_pin, GPIO.HIGH)
    time.sleep(0.00001)
    GPIO.output(trig_pin, GPIO.LOW)

    start_time = time.time()
    stop_time = time.time()
    timeout = start_time + 0.04 # 40ms timeout (~7 meters max)

    while GPIO.input(echo_pin) == 0:
        start_time = time.time()
        if start_time > timeout:
            return 4.0

    while GPIO.input(echo_pin) == 1:
        stop_time = time.time()
        if stop_time > timeout:
            return 4.0

    elapsed = stop_time - start_time
    distance = (elapsed * 34300) / 2.0 / 100.0 # meters
    return distance

def get_robust_distance(trig_pin, echo_pin):
    # Median filter over 3 readings to reject cross-talk, OS jitter, or false reflections
    readings = []
    for _ in range(3):
        d = measure_distance(trig_pin, echo_pin)
        if d > 0:
            readings.append(d)
        time.sleep(0.015)
    
    if len(readings) == 0:
        return 4.0
    readings.sort()
    return readings[len(readings)//2]

def cleanup():
    GPIO.cleanup()
    rospy.loginfo("Ultrasonic Node: GPIO cleaned up.")

def create_scan_msg(frame_id, dist):
    msg = LaserScan()
    msg.header.stamp = rospy.Time.now()
    msg.header.frame_id = frame_id
    msg.angle_min = -0.13 # -7.5 degrees
    msg.angle_max = 0.13  # +7.5 degrees
    msg.angle_increment = 0.065 # 5 rays
    msg.time_increment = 0.0
    msg.scan_time = 0.1
    msg.range_min = 0.05
    msg.range_max = 4.0
    msg.ranges = [dist] * 5
    return msg

def main():
    rospy.init_node('ultrasonic_node', anonymous=True)
    
    # We publish as LaserScan to bypass crashing range_sensor_layer C++ plugin bugs
    pub_left = rospy.Publisher('/sonar_left', LaserScan, queue_size=10)
    pub_right = rospy.Publisher('/sonar_right', LaserScan, queue_size=10)

    time.sleep(2.0)

    GPIO.setmode(GPIO.BOARD)
    GPIO.setwarnings(False)
    
    GPIO.setup(LEFT_TRIG, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(LEFT_ECHO, GPIO.IN)
    GPIO.setup(RIGHT_TRIG, GPIO.OUT, initial=GPIO.LOW)
    GPIO.setup(RIGHT_ECHO, GPIO.IN)

    rospy.on_shutdown(cleanup)
    rate = rospy.Rate(10) 
    
    time.sleep(0.5)
    rospy.loginfo("Ultrasonic Node started successfully. Publishing as LaserScan for 8cm limit...")

    while not rospy.is_shutdown():
        dist_left = get_robust_distance(LEFT_TRIG, LEFT_ECHO)
        
        if dist_left > 0:
            if dist_left > 0.08:
                # Floor detection, cross-talk, or far obstacle -> Clear path by publishing 3.99!
                dist_left = 3.99
            
            pub_left.publish(create_scan_msg("sonar_left_link", dist_left))

        time.sleep(0.02) # Extra delay between left and right burst to prevent cross-echo

        dist_right = get_robust_distance(RIGHT_TRIG, RIGHT_ECHO)
        
        if dist_right > 0:
            if dist_right > 0.08:
                dist_right = 3.99

            pub_right.publish(create_scan_msg("sonar_right_link", dist_right))

        rate.sleep()

if __name__ == '__main__':
    try:
        main()
    except rospy.ROSInterruptException:
        pass
