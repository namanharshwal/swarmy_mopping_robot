#!/usr/bin/env python
# -*- coding: utf-8 -*-

import rospy
import time
import math
import random
from geometry_msgs.msg import Twist
from sensor_msgs.msg import JointState, Imu, LaserScan
from nav_msgs.msg import Odometry
from std_msgs.msg import String

try:
    from actionlib_msgs.msg import GoalStatusArray
    from move_base_msgs.msg import MoveBaseActionResult
except ImportError:
    rospy.logwarn("Could not import actionlib_msgs or move_base_msgs. Fallback is active.")
    GoalStatusArray = None
    MoveBaseActionResult = None

class EmotionStateNode:
    def __init__(self):
        rospy.init_node('emotion_state_node', anonymous=True)
        
        self.emotion_pub = rospy.Publisher('/robot_emotion', String, queue_size=10)
        
        self.cmd_vel = Twist()
        self.joint_states = JointState()
        self.odom = Odometry()
        self.imu = Imu()
        self.laser_scan = LaserScan()
        
        self.has_cmd_vel = False
        self.has_joint_states = False
        self.has_odom = False
        self.has_imu = False
        self.has_laser_scan = False
        
        self.active_goal = False
        self.goal_status = 0
        self.last_goal_result_time = 0
        self.goal_success = False
        self.goal_aborted = False
        
        self.min_obstacle_dist = float('inf')
        
        self.current_emotion = 'BOOT'
        self.last_emotion_change = rospy.Time.now()
        self.idle_start_time = rospy.Time.now()
        self.goal_celebration_start = None
        self.stuck_start_time = None
        
        # Subscriptions
        rospy.Subscriber('/cmd_vel', Twist, self.cmd_vel_callback)
        rospy.Subscriber('/joint_states', JointState, self.joint_states_callback)
        rospy.Subscriber('/wheel/odom', Odometry, self.odom_callback)
        rospy.Subscriber('/imu/data_raw', Imu, self.imu_callback)
        rospy.Subscriber('/scan', LaserScan, self.scan_callback)
        
        if GoalStatusArray is not None:
            rospy.Subscriber('/move_base/status', GoalStatusArray, self.status_callback)
        if MoveBaseActionResult is not None:
            rospy.Subscriber('/move_base/result', MoveBaseActionResult, self.result_callback)

    def cmd_vel_callback(self, msg):
        self.cmd_vel = msg
        self.has_cmd_vel = True
        
    def joint_states_callback(self, msg):
        self.joint_states = msg
        self.has_joint_states = True
        
    def odom_callback(self, msg):
        self.odom = msg
        self.has_odom = True
        
    def imu_callback(self, msg):
        self.imu = msg
        self.has_imu = True
        
    def scan_callback(self, msg):
        self.laser_scan = msg
        self.has_laser_scan = True
        # calculate min distance in front 60 degrees
        num_ranges = len(msg.ranges)
        if num_ranges == 0:
            return
        angle_inc = msg.angle_increment
        angle_min = msg.angle_min
        
        min_dist = float('inf')
        # find indices for -30 to +30 degrees (-0.52 to 0.52 rad)
        start_angle = -0.523599
        end_angle = 0.523599
        
        start_idx = max(0, int((start_angle - angle_min) / angle_inc))
        end_idx = min(num_ranges, int((end_angle - angle_min) / angle_inc))
        
        if start_idx < end_idx:
            for i in range(start_idx, end_idx):
                dist = msg.ranges[i]
                if msg.range_min < dist < msg.range_max:
                    if dist < min_dist:
                        min_dist = dist
        self.min_obstacle_dist = min_dist

    def status_callback(self, msg):
        if not msg.status_list:
            self.active_goal = False
            return
        
        # 1 = ACTIVE, 3 = SUCCEEDED, 4 = ABORTED
        latest_status = msg.status_list[-1].status
        if latest_status == 1:
            self.active_goal = True
        else:
            self.active_goal = False

    def result_callback(self, msg):
        status = msg.status.status
        self.last_goal_result_time = rospy.Time.now().to_sec()
        if status == 3: # SUCCEEDED
            self.goal_success = True
            self.goal_aborted = False
            self.goal_celebration_start = rospy.Time.now()
        elif status in [4, 5]: # ABORTED or REJECTED
            self.goal_aborted = True
            self.goal_success = False
            self.goal_celebration_start = rospy.Time.now()

    def set_emotion(self, emotion):
        now = rospy.Time.now()
        if self.current_emotion != emotion:
            if (now - self.last_emotion_change).to_sec() > 0.5:
                self.current_emotion = emotion
                self.last_emotion_change = now
                self.publish_emotion()

    def publish_emotion(self):
        msg = String()
        msg.data = self.current_emotion
        self.emotion_pub.publish(msg)
        try:
            with open('/tmp/robot_emotion.txt', 'w') as f:
                f.write(self.current_emotion)
        except Exception as e:
            rospy.logwarn("Could not write to /tmp/robot_emotion.txt: %s" % str(e))

    def evaluate_state(self):
        now = rospy.Time.now()
        
        # System Level
        if not self.has_imu and not self.has_odom and not self.has_joint_states and not self.has_laser_scan:
            self.set_emotion('BOOT')
            return
            
        if self.has_imu and (not self.has_odom or not self.has_joint_states):
            self.set_emotion('WARN')
            return
            
        # Goal Result Events (~5 seconds)
        if self.goal_celebration_start is not None:
            elapsed = (now - self.goal_celebration_start).to_sec()
            if elapsed < 5.0:
                if self.goal_success:
                    if elapsed < 1.0:
                        self.set_emotion('GOAL_REACHED')
                    elif elapsed < 2.0:
                        self.set_emotion('CELEBRATING')
                    elif elapsed < 3.0:
                        self.set_emotion('LAUGHING')
                    elif elapsed < 4.0:
                        self.set_emotion('VICTORIOUS')
                    else:
                        self.set_emotion('PROUD')
                elif self.goal_aborted:
                    if elapsed < 3.0:
                        self.set_emotion('DISAPPOINTED')
                    else:
                        self.set_emotion('DETERMINED')
                return
            else:
                self.goal_celebration_start = None
                self.goal_success = False
                self.goal_aborted = False

        # Obstacle Reactions
        if self.min_obstacle_dist < 0.15:
            self.set_emotion('SCARED')
            return
        elif self.min_obstacle_dist < 0.25:
            self.set_emotion('SHOCKED')
            return
        elif self.min_obstacle_dist < 0.35:
            self.set_emotion('ANGRY')
            return
        elif self.min_obstacle_dist < 0.45:
            self.set_emotion('ANNOYED')
            return
        elif self.min_obstacle_dist < 0.6:
            self.set_emotion('CAUTIOUS')
            return
        elif self.min_obstacle_dist < 0.8:
            self.set_emotion('WORRIED')
            return
            
        # Navigation State
        is_moving_forward = self.has_cmd_vel and self.cmd_vel.linear.x > 0.05
        is_rotating_fast = self.has_cmd_vel and abs(self.cmd_vel.angular.z) > 0.3
        is_rotating_slow = self.has_cmd_vel and abs(self.cmd_vel.angular.z) > 0.1
        is_backing_up = self.has_cmd_vel and self.cmd_vel.linear.x < -0.02
        odom_moving = self.has_odom and (abs(self.odom.twist.twist.linear.x) > 0.01 or abs(self.odom.twist.twist.angular.z) > 0.05)
        cmd_active = self.has_cmd_vel and (abs(self.cmd_vel.linear.x) > 0.01 or abs(self.cmd_vel.angular.z) > 0.05)
        
        if self.active_goal:
            if is_moving_forward:
                if (now - self.last_emotion_change).to_sec() > random.uniform(3, 5):
                    choices = ['NAVIGATING', 'CRUISING', 'HAPPY', 'CHEERFUL', 'EXCITED']
                    self.set_emotion(random.choice(choices))
                return
            elif is_rotating_fast:
                if self.cmd_vel.angular.z > 0:
                    self.set_emotion('TURNING_LEFT')
                else:
                    self.set_emotion('TURNING_RIGHT')
                return
            elif is_rotating_slow:
                self.set_emotion('SEARCHING')
                return
            elif not cmd_active and not odom_moving:
                if self.stuck_start_time is None:
                    self.stuck_start_time = now
                else:
                    stuck_elapsed = (now - self.stuck_start_time).to_sec()
                    if stuck_elapsed > 3.0:
                        if stuck_elapsed < 5.0:
                            self.set_emotion('STUCK')
                        elif stuck_elapsed < 7.0:
                            self.set_emotion('FRUSTRATED')
                        else:
                            self.set_emotion('DETERMINED')
                        return
            else:
                self.stuck_start_time = None
        else:
            self.stuck_start_time = None

        if cmd_active and not odom_moving:
            self.set_emotion('CONFUSED')
            return
        if not cmd_active and odom_moving:
            self.set_emotion('ALERT')
            return
        if is_backing_up:
            self.set_emotion('BACKING_UP')
            return

        # Idle personality
        if not cmd_active and not odom_moving:
            idle_elapsed = (now - self.idle_start_time).to_sec()
            
            # occasional random emotion (~5% chance per second at 5Hz => ~1% per check)
            if random.random() < 0.01: 
                random_emotion = random.choice(['WINK', 'PLAYFUL', 'SILLY', 'YAWNING', 'SHY', 'SINGING'])
                self.set_emotion(random_emotion)
                return

            if idle_elapsed < 10.0:
                self.set_emotion('IDLE')
            elif idle_elapsed < 20.0:
                if (now - self.last_emotion_change).to_sec() > 3.0:
                    self.set_emotion(random.choice(['CURIOUS', 'THINKING', 'DAYDREAMING']))
            elif idle_elapsed < 40.0:
                self.set_emotion('BORED')
            elif idle_elapsed < 60.0:
                self.set_emotion('DROWSY')
            else:
                self.set_emotion('SLEEP')
        else:
            self.idle_start_time = now

    def run(self):
        rate = rospy.Rate(5) # 5 Hz
        while not rospy.is_shutdown():
            self.evaluate_state()
            # regularly publish current emotion
            self.publish_emotion()
            rate.sleep()

if __name__ == '__main__':
    try:
        node = EmotionStateNode()
        node.run()
    except rospy.ROSInterruptException:
        pass
