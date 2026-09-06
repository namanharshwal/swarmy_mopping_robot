#!/usr/bin/env python
import rospy
import tf2_ros
from geometry_msgs.msg import PoseStamped

def main():
    rospy.init_node('robot_pose_bridge', anonymous=True)
    pub = rospy.Publisher('/robot_map_pose', PoseStamped, queue_size=10)
    tfBuffer = tf2_ros.Buffer()
    listener = tf2_ros.TransformListener(tfBuffer)
    rate = rospy.Rate(10.0) # 10hz

    rospy.loginfo("Started robot_pose_bridge for web Route Planner...")
    while not rospy.is_shutdown():
        try:
            trans = tfBuffer.lookup_transform('map', 'base_footprint', rospy.Time())
            
            pose = PoseStamped()
            pose.header.stamp = rospy.Time.now()
            pose.header.frame_id = 'map'
            pose.pose.position.x = trans.transform.translation.x
            pose.pose.position.y = trans.transform.translation.y
            pose.pose.position.z = trans.transform.translation.z
            pose.pose.orientation = trans.transform.rotation
            
            pub.publish(pose)
        except (tf2_ros.LookupException, tf2_ros.ConnectivityException, tf2_ros.ExtrapolationException):
            pass
        rate.sleep()

if __name__ == '__main__':
    main()
