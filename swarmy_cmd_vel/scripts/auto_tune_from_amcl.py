#!/usr/bin/env python
# ============================================================================
# Project Handlers: Naman Sain & Souvik Mallik
# 
# Maintainers:
# - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
# - Souvik Mallik: Embedded Maintainer
# ============================================================================

import rospy
import math
from geometry_msgs.msg import Twist, PoseWithCovarianceStamped
from nav_msgs.msg import Odometry
import tf

last_cmd_v = 0.0
last_cmd_w = 0.0

odom_pose = None
amcl_pose = None

is_tuning = False
start_odom = None
start_amcl = None
tune_start_time = 0

def get_yaw(pose):
    quat = (pose.orientation.x, pose.orientation.y, pose.orientation.z, pose.orientation.w)
    euler = tf.transformations.euler_from_quaternion(quat)
    return euler[2]

def cmd_cb(msg):
    global last_cmd_v, last_cmd_w, is_tuning, start_odom, start_amcl, tune_start_time
    last_cmd_v = msg.linear.x
    last_cmd_w = msg.angular.z
    
    # Only tune when commanding purely forward
    if last_cmd_v > 0.05 and abs(last_cmd_w) < 0.01:
        if not is_tuning and odom_pose is not None and amcl_pose is not None:
            is_tuning = True
            start_odom = odom_pose
            start_amcl = amcl_pose
            tune_start_time = rospy.Time.now().to_sec()
            rospy.loginfo("Started measuring forward movement...")
    else:
        if is_tuning:
            # Stopped tuning (user stopped or started turning)
            is_tuning = False
            duration = rospy.Time.now().to_sec() - tune_start_time
            if duration > 1.0:
                rospy.loginfo("Finished measuring. Calculating calibration...")
                calculate_calibration()
            else:
                rospy.loginfo("Movement too short to calibrate. Hold forward longer.")

def odom_cb(msg):
    global odom_pose
    odom_pose = msg.pose.pose

def amcl_cb(msg):
    global amcl_pose
    amcl_pose = msg.pose.pose

def calculate_calibration():
    global start_odom, start_amcl, odom_pose, amcl_pose
    
    # Calculate Odom distance
    dx_odom = odom_pose.position.x - start_odom.position.x
    dy_odom = odom_pose.position.y - start_odom.position.y
    dist_odom = math.sqrt(dx_odom**2 + dy_odom**2)
    
    # Calculate AMCL distance
    dx_amcl = amcl_pose.position.x - start_amcl.position.x
    dy_amcl = amcl_pose.position.y - start_amcl.position.y
    dist_amcl = math.sqrt(dx_amcl**2 + dy_amcl**2)
    
    # Calculate AMCL yaw drift
    start_yaw_amcl = get_yaw(start_amcl)
    end_yaw_amcl = get_yaw(amcl_pose)
    yaw_drift = end_yaw_amcl - start_yaw_amcl
    # Normalize yaw drift
    while yaw_drift > math.pi: yaw_drift -= 2.0 * math.pi
    while yaw_drift < -math.pi: yaw_drift += 2.0 * math.pi
    
    rospy.loginfo("Odom distance: {:.3f}m, AMCL distance: {:.3f}m".format(dist_odom, dist_amcl))
    rospy.loginfo("AMCL Yaw drift: {:.3f} rad".format(yaw_drift))
    
    left_mult = rospy.get_param('/swarmy/left_multiplier', 1.0)
    right_mult = rospy.get_param('/swarmy/right_multiplier', 1.0)
    odom_lin_mult = rospy.get_param('/swarmy/fake_odom_linear_multiplier', 1.0)
    
    # 1. Calibrate Fake Odom Linear Multiplier
    if dist_odom > 0.1 and dist_amcl > 0.01:
        ratio = dist_amcl / dist_odom
        # Apply a smoothing factor so it doesn't jump too crazily
        new_odom_lin = odom_lin_mult * 0.5 + (odom_lin_mult * ratio) * 0.5
        rospy.set_param('/swarmy/fake_odom_linear_multiplier', new_odom_lin)
        rospy.loginfo("Adjusted FAKE_ODOM_LINEAR_MULTIPLIER to {:.3f}".format(new_odom_lin))
        
    # 2. Calibrate Motor Balance
    if yaw_drift > 0.1: # Curving left -> Right motor is faster
        right_mult *= 0.95
        rospy.set_param('/swarmy/right_multiplier', right_mult)
        rospy.loginfo("Curving LEFT. Adjusted RIGHT_MOTOR_MULTIPLIER to {:.3f}".format(right_mult))
    elif yaw_drift < -0.1: # Curving right -> Left motor is faster
        left_mult *= 0.95
        rospy.set_param('/swarmy/left_multiplier', left_mult)
        rospy.loginfo("Curving RIGHT. Adjusted LEFT_MOTOR_MULTIPLIER to {:.3f}".format(left_mult))

def main():
    rospy.init_node('auto_tune_from_amcl', anonymous=True)
    rospy.Subscriber('/cmd_vel', Twist, cmd_cb)
    rospy.Subscriber('/wheel/odom', Odometry, odom_cb)
    rospy.Subscriber('/amcl_pose', PoseWithCovarianceStamped, amcl_cb)
    
    # Initialize params if not exist
    if not rospy.has_param('/swarmy/fake_odom_linear_multiplier'):
        rospy.set_param('/swarmy/fake_odom_linear_multiplier', 1.0)
        
    rospy.loginfo("Auto-Tuner Ready! Hold the forward button (i) in teleop for a few seconds.")
    rospy.spin()

if __name__ == '__main__':
    main()
