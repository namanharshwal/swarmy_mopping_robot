#!/usr/bin/env python
import rospy
from std_msgs.msg import String
from geometry_msgs.msg import Twist
from sensor_msgs.msg import JointState, Imu
from nav_msgs.msg import Odometry

class EmotionStateNode(object):
    def __init__(self):
        rospy.init_node('emotion_state_node')
        self.timeout = rospy.get_param('~timeout', 1.5)
        self.move_cmd_threshold = rospy.get_param('~move_cmd_threshold', 0.02)
        self.move_odom_threshold = rospy.get_param('~move_odom_threshold', 0.01)
        self.move_joint_threshold = rospy.get_param('~move_joint_threshold', 0.001)

        self.pub = rospy.Publisher('/robot_emotion', String, queue_size=10, latch=True)

        self.last_cmd = None
        self.last_joint = None
        self.last_joint_positions = None
        self.last_odom = None
        self.last_imu = None
        self.state = 'BOOT'

        rospy.Subscriber('/cmd_vel', Twist, self.cmd_cb, queue_size=10)
        rospy.Subscriber('/joint_states', JointState, self.joint_cb, queue_size=20)
        rospy.Subscriber('/wheel/odom', Odometry, self.odom_cb, queue_size=20)
        rospy.Subscriber('/imu/data_raw', Imu, self.imu_cb, queue_size=50)

    def cmd_cb(self, msg):
        self.last_cmd = msg

    def joint_cb(self, msg):
        self.last_joint = msg

    def odom_cb(self, msg):
        self.last_odom = msg

    def imu_cb(self, msg):
        self.last_imu = msg

    def fresh(self, msg):
        if msg is None:
            return False
        age = (rospy.Time.now() - msg.header.stamp).to_sec()
        return age >= 0.0 and age < self.timeout

    def cmd_active(self):
        if self.last_cmd is None:
            return False
        return abs(self.last_cmd.linear.x) > self.move_cmd_threshold or abs(self.last_cmd.angular.z) > self.move_cmd_threshold

    def odom_active(self):
        if self.last_odom is None:
            return False
        t = self.last_odom.twist.twist
        return abs(t.linear.x) > self.move_odom_threshold or abs(t.angular.z) > self.move_odom_threshold

    def joints_active(self):
        if self.last_joint is None or not self.last_joint.position:
            return False
        if self.last_joint_positions is None:
            self.last_joint_positions = list(self.last_joint.position)
            return False
        changed = False
        for a, b in zip(self.last_joint.position, self.last_joint_positions):
            if abs(a - b) > self.move_joint_threshold:
                changed = True
                break
        self.last_joint_positions = list(self.last_joint.position)
        return changed

    def classify(self):
        imu_ok = self.fresh(self.last_imu)
        odom_ok = self.fresh(self.last_odom)
        joint_ok = self.fresh(self.last_joint)

        cmd = self.cmd_active()
        odom_move = self.odom_active()
        joint_move = self.joints_active()

        if not imu_ok and not odom_ok and not joint_ok:
            return 'BOOT'
        if cmd and not odom_move and not joint_move:
            return 'CONFUSED'
        if not cmd and (odom_move or joint_move):
            return 'ALERT'
        if imu_ok and odom_ok and joint_ok and (cmd or odom_move or joint_move):
            return 'HAPPY'
        if imu_ok and (not odom_ok or not joint_ok):
            return 'WARN'
        return 'IDLE'

    def run(self):
        rate = rospy.Rate(5)
        while not rospy.is_shutdown():
            s = self.classify()
            if s != self.state:
                self.state = s
                self.pub.publish(String(data=s))
            rate.sleep()

if __name__ == '__main__':
    EmotionStateNode().run()
