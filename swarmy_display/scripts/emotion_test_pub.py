#!/usr/bin/env python
import rospy
from std_msgs.msg import String

if __name__ == '__main__':
    rospy.init_node('emotion_test_pub')
    pub = rospy.Publisher('/robot_emotion', String, queue_size=10, latch=True)
    emotion = rospy.get_param('~emotion', 'HAPPY')
    rate = rospy.Rate(1)
    while not rospy.is_shutdown():
        pub.publish(String(data=emotion))
        rate.sleep()
