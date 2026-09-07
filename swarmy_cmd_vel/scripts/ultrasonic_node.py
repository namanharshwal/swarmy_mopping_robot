#!/usr/bin/env python3
import rospy
import Jetson.GPIO as GPIO
import time
from sensor_msgs.msg import Range

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

def main():
    rospy.init_node('ultrasonic_node', anonymous=True)
    
    pub_left = rospy.Publisher('/sonar_left', Range, queue_size=10)
    pub_right = rospy.Publisher('/sonar_right', Range, queue_size=10)

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
    rospy.loginfo("Ultrasonic Node started successfully. Filtering distance to 8cm limit...")

    while not rospy.is_shutdown():
        dist_left = get_robust_distance(LEFT_TRIG, LEFT_ECHO)
        
        if dist_left > 0:
            if dist_left > 0.08:
                # Floor detection, cross-talk, or far obstacle -> Clear path!
                dist_left = 4.0
            
            msg_left = Range()
            msg_left.header.stamp = rospy.Time.now()
            msg_left.header.frame_id = "sonar_left_link"
            msg_left.radiation_type = Range.ULTRASOUND
            msg_left.field_of_view = 0.26 # ~15 degrees cone
            msg_left.min_range = 0.02
            msg_left.max_range = 4.0
            msg_left.range = dist_left
            pub_left.publish(msg_left)

        time.sleep(0.02) # Extra delay between left and right burst to prevent cross-echo

        dist_right = get_robust_distance(RIGHT_TRIG, RIGHT_ECHO)
        
        if dist_right > 0:
            if dist_right > 0.08:
                dist_right = 4.0

            msg_right = Range()
            msg_right.header.stamp = rospy.Time.now()
            msg_right.header.frame_id = "sonar_right_link"
            msg_right.radiation_type = Range.ULTRASOUND
            msg_right.field_of_view = 0.26
            msg_right.min_range = 0.02
            msg_right.max_range = 4.0
            msg_right.range = dist_right
            pub_right.publish(msg_right)

        rate.sleep()

if __name__ == '__main__':
    try:
        main()
    except rospy.ROSInterruptException:
        pass
