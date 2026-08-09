#!/usr/bin/env python
import rospy
from geometry_msgs.msg import Twist
from sensor_msgs.msg import Imu
import time

current_yaw_rate = 0.0

def imu_cb(msg):
    global current_yaw_rate
    current_yaw_rate = msg.angular_velocity.z

def calibrate():
    rospy.init_node('auto_calibrate_motors', anonymous=True)
    pub = rospy.Publisher('/cmd_vel', Twist, queue_size=1)
    rospy.Subscriber('/imu/data_raw', Imu, imu_cb)
    
    rospy.loginfo("Starting Automatic Motor Calibration...")
    rospy.loginfo("WARNING: The robot will drive forward. Make sure it has 3 meters of clear space!")
    time.sleep(3)
    
    left_mult = 1.0
    right_mult = 1.0
    
    rospy.set_param('/swarmy/left_multiplier', left_mult)
    rospy.set_param('/swarmy/right_multiplier', right_mult)
    
    rate = rospy.Rate(10)
    
    # Run calibration for 5 iterations
    for iteration in range(10):
        rospy.loginfo("--- Iteration {} ---".format(iteration+1))
        rospy.loginfo("Testing L: {:.3f}, R: {:.3f}".format(left_mult, right_mult))
        
        # Drive forward for 2 seconds
        cmd = Twist()
        cmd.linear.x = 0.08
        
        yaw_sum = 0.0
        samples = 0
        
        start_time = time.time()
        while time.time() - start_time < 2.0 and not rospy.is_shutdown():
            pub.publish(cmd)
            yaw_sum += current_yaw_rate
            samples += 1
            rate.sleep()
            
        # Stop
        cmd.linear.x = 0.0
        pub.publish(cmd)
        time.sleep(1.0) # Wait for robot to settle
        
        avg_yaw = yaw_sum / max(1, samples)
        rospy.loginfo("Average drift (yaw rate): {:.4f} rad/s".format(avg_yaw))
        
        if abs(avg_yaw) < 0.02:
            rospy.loginfo("Perfect! Drift is negligible.")
            break
            
        # Adjust multipliers
        # If avg_yaw > 0 (curving left), right motor is too fast -> reduce right mult
        # If avg_yaw < 0 (curving right), left motor is too fast -> reduce left mult
        if avg_yaw > 0.02:
            rospy.loginfo("Curving LEFT. Slowing down RIGHT motor.")
            right_mult -= 0.05
        elif avg_yaw < -0.02:
            rospy.loginfo("Curving RIGHT. Slowing down LEFT motor.")
            left_mult -= 0.05
            
        # Prevent numbers from dropping too low
        if left_mult < 0.5: left_mult = 0.5
        if right_mult < 0.5: right_mult = 0.5
            
        rospy.set_param('/swarmy/left_multiplier', left_mult)
        rospy.set_param('/swarmy/right_multiplier', right_mult)
        
        # Drive backward back to start point
        rospy.loginfo("Returning to start position...")
        cmd.linear.x = -0.08
        start_time = time.time()
        while time.time() - start_time < 2.0 and not rospy.is_shutdown():
            pub.publish(cmd)
            rate.sleep()
            
        # Stop again
        cmd.linear.x = 0.0
        pub.publish(cmd)
        time.sleep(1.0)
        
    rospy.loginfo("=== Calibration Complete ===")
    rospy.loginfo("Optimal LEFT_MOTOR_MULTIPLIER = {:.3f}".format(left_mult))
    rospy.loginfo("Optimal RIGHT_MOTOR_MULTIPLIER = {:.3f}".format(right_mult))
    rospy.loginfo("You can now hardcode these values into swarmy_base_node.py if you want them to be permanent.")

if __name__ == '__main__':
    try:
        calibrate()
    except rospy.ROSInterruptException:
        pass
