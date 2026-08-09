#!/usr/bin/env python
import rospy
from geometry_msgs.msg import PointStamped, PoseStamped

def callback(point_msg):
    goal = PoseStamped()
    goal.header = point_msg.header
    goal.pose.position = point_msg.point
    
    # Provide a default orientation (yaw=0) since Publish Point doesn't specify one
    goal.pose.orientation.x = 0.0
    goal.pose.orientation.y = 0.0
    goal.pose.orientation.z = 0.0
    goal.pose.orientation.w = 1.0
    
    pub.publish(goal)
    rospy.loginfo("Forwarded /clicked_point to /move_base_simple/goal")

if __name__ == '__main__':
    rospy.init_node('publish_point_to_goal')
    pub = rospy.Publisher('/move_base_simple/goal', PoseStamped, queue_size=1)
    rospy.Subscriber('/clicked_point', PointStamped, callback)
    rospy.loginfo("Listening to /clicked_point and forwarding to /move_base_simple/goal")
    rospy.spin()
