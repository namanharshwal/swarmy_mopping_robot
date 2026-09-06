#!/usr/bin/env python
import rospy
import actionlib
import threading
from nav_msgs.msg import Path
from std_msgs.msg import String
from geometry_msgs.msg import PoseStamped
from move_base_msgs.msg import MoveBaseAction, MoveBaseGoal

class RouteExecutor:
    def __init__(self):
        rospy.init_node('swarmy_route_executor', anonymous=True)
        
        self.status_pub = rospy.Publisher('/swarmy_route_status', String, queue_size=10)
        rospy.Subscriber('/swarmy_route', Path, self.route_callback)
        rospy.Subscriber('/swarmy_route_meta', String, self.meta_callback)
        rospy.Subscriber('/swarmy_custom_path', Path, self.custom_path_callback)
        
        self.client = actionlib.SimpleActionClient('move_base', MoveBaseAction)
        rospy.loginfo("RouteExecutor: Waiting for move_base action server...")
        self.client.wait_for_server()
        rospy.loginfo("RouteExecutor: move_base connected.")
        
        self.current_path = None
        self.executing = False
        self.cancel_requested = False
        self.dwell_times = []  # seconds to wait at each station
        self.station_names = []

    def meta_callback(self, msg):
        """Receive metadata (dwell times, station names) as comma-separated values."""
        try:
            import json
            meta = json.loads(msg.data)
            self.dwell_times = meta.get('dwellTimes', [])
            self.station_names = meta.get('names', [])
        except Exception as e:
            rospy.logwarn("Failed to parse route metadata: %s" % str(e))

    def route_callback(self, msg):
        rospy.loginfo("Received route with %d waypoints." % len(msg.poses))
        self.current_path = msg.poses
        
        if self.executing:
            rospy.loginfo("Preempting current route.")
            self.cancel_requested = True
            self.client.cancel_all_goals()
            rospy.sleep(1.0)
            self.cancel_requested = False
            
        t = threading.Thread(target=self.execute_path)
        t.daemon = True
        t.start()

    def custom_path_callback(self, msg):
        """Handle custom drawn path - same as route but with tighter tolerance."""
        rospy.loginfo("Received custom path with %d points." % len(msg.poses))
        self.dwell_times = [0] * len(msg.poses)
        self.station_names = ["path_pt_%d" % i for i in range(len(msg.poses))]
        self.current_path = msg.poses
        
        if self.executing:
            self.cancel_requested = True
            self.client.cancel_all_goals()
            rospy.sleep(1.0)
            self.cancel_requested = False
        
        t = threading.Thread(target=self.execute_path)
        t.daemon = True
        t.start()

    def execute_path(self):
        self.executing = True
        poses = self.current_path
        total = len(poses)
        
        for i, pose_stamped in enumerate(poses):
            if rospy.is_shutdown() or self.cancel_requested or self.current_path != poses:
                break
            
            station_name = self.station_names[i] if i < len(self.station_names) else "WP%d" % (i+1)
            dwell = self.dwell_times[i] if i < len(self.dwell_times) else 0
                
            goal = MoveBaseGoal()
            goal.target_pose = pose_stamped
            goal.target_pose.header.stamp = rospy.Time.now()
            goal.target_pose.header.frame_id = "map"
            
            self.status_pub.publish("Navigating to %s (%d/%d)" % (station_name, i+1, total))
            rospy.loginfo("Goal %d/%d [%s]: x=%.2f y=%.2f dwell=%ds" % (
                i+1, total, station_name,
                goal.target_pose.pose.position.x,
                goal.target_pose.pose.position.y,
                dwell))
            
            self.client.send_goal(goal)
            self.client.wait_for_result(rospy.Duration(120.0))
            
            state = self.client.get_state()
            if state == actionlib.GoalStatus.SUCCEEDED:
                rospy.loginfo("Reached %s" % station_name)
                if dwell > 0:
                    self.status_pub.publish("Dwelling at %s for %ds..." % (station_name, dwell))
                    rospy.sleep(float(dwell))
                self.status_pub.publish("Completed %s (%d/%d)" % (station_name, i+1, total))
            elif state == actionlib.GoalStatus.PREEMPTED:
                rospy.loginfo("Goal preempted at %s" % station_name)
                self.status_pub.publish("Cancelled at %s" % station_name)
                break
            else:
                rospy.logwarn("Failed %s (state=%s). Skipping." % (station_name, state))
                self.status_pub.publish("Obstacle at %s, skipping..." % station_name)
                self.client.cancel_goal()
                rospy.sleep(2.0)
                
        if self.current_path == poses and not self.cancel_requested:
            self.status_pub.publish("Route complete!")
            rospy.loginfo("Route execution complete.")
        self.executing = False

if __name__ == '__main__':
    try:
        RouteExecutor()
        rospy.spin()
    except rospy.ROSInterruptException:
        pass
