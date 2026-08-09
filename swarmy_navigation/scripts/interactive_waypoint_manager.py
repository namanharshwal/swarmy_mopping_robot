#!/usr/bin/env python
import rospy
import actionlib
import tf
import math
from geometry_msgs.msg import PointStamped, Pose, Point, Quaternion
from move_base_msgs.msg import MoveBaseAction, MoveBaseGoal
from interactive_markers.interactive_marker_server import InteractiveMarkerServer
from interactive_markers.menu_handler import MenuHandler
from visualization_msgs.msg import InteractiveMarker, InteractiveMarkerControl, Marker

class WaypointManager:
    def __init__(self):
        rospy.init_node("waypoint_manager")
        
        self.server = InteractiveMarkerServer("waypoints")
        self.menu_handler = MenuHandler()
        
        self.menu_handler.insert("Start Patrol", callback=self.start_patrol_cb)
        self.menu_handler.insert("Stop Patrol", callback=self.stop_patrol_cb)
        self.menu_handler.insert("Delete Waypoint", callback=self.delete_wp_cb)
        self.menu_handler.insert("Clear All", callback=self.clear_all_cb)
        
        self.waypoints = [] # list of (id, x, y)
        self.wp_count = 0
        
        self.patrolling = False
        self.current_wp_index = 0
        
        rospy.Subscriber("/clicked_point", PointStamped, self.clicked_point_cb)
        
        self.move_base = actionlib.SimpleActionClient("move_base", MoveBaseAction)
        rospy.loginfo("Waiting for move_base action server...")
        self.move_base.wait_for_server()
        rospy.loginfo("Connected to move_base!")
        
        rospy.loginfo("Interactive Waypoint Manager Ready! Use 'Publish Point' in RViz to add waypoints.")
        
    def clicked_point_cb(self, msg):
        wp_id = "wp_" + str(self.wp_count)
        self.wp_count += 1
        
        x = msg.point.x
        y = msg.point.y
        self.waypoints.append({"id": wp_id, "x": x, "y": y})
        
        self.create_marker(wp_id, x, y)
        self.update_orientations()
        
    def create_marker(self, wp_id, x, y, theta=0.0):
        int_marker = InteractiveMarker()
        int_marker.header.frame_id = "map"
        int_marker.name = wp_id
        int_marker.description = wp_id
        
        int_marker.pose.position.x = x
        int_marker.pose.position.y = y
        int_marker.pose.position.z = 0.0
        
        q = tf.transformations.quaternion_from_euler(0, 0, theta)
        int_marker.pose.orientation = Quaternion(*q)
        
        # Add a visual marker (an arrow)
        marker = Marker()
        marker.type = Marker.ARROW
        marker.scale.x = 0.5
        marker.scale.y = 0.1
        marker.scale.z = 0.1
        marker.color.r = 0.0
        marker.color.g = 1.0
        marker.color.b = 0.0
        marker.color.a = 1.0
        
        # Add a text marker above it
        text_marker = Marker()
        text_marker.type = Marker.TEXT_VIEW_FACING
        text_marker.text = wp_id
        text_marker.pose.position.z = 0.5
        text_marker.scale.z = 0.2
        text_marker.color.r = 1.0
        text_marker.color.g = 1.0
        text_marker.color.b = 1.0
        text_marker.color.a = 1.0
        
        control = InteractiveMarkerControl()
        control.always_visible = True
        control.markers.append(marker)
        control.markers.append(text_marker)
        control.interaction_mode = InteractiveMarkerControl.MOVE_PLANE # allow dragging
        int_marker.controls.append(control)
        
        self.server.insert(int_marker, self.marker_moved_cb)
        self.menu_handler.apply(self.server, wp_id)
        self.server.applyChanges()
        
    def marker_moved_cb(self, feedback):
        # Update internal waypoint location if dragged
        for wp in self.waypoints:
            if wp["id"] == feedback.marker_name:
                wp["x"] = feedback.pose.position.x
                wp["y"] = feedback.pose.position.y
                break
        self.update_orientations()
        
    def update_orientations(self):
        # Make each arrow point to the next waypoint
        for i in range(len(self.waypoints)):
            curr = self.waypoints[i]
            nxt = self.waypoints[(i + 1) % len(self.waypoints)]
            
            dx = nxt["x"] - curr["x"]
            dy = nxt["y"] - curr["y"]
            theta = math.atan2(dy, dx)
            
            self.create_marker(curr["id"], curr["x"], curr["y"], theta)

    def start_patrol_cb(self, feedback):
        if len(self.waypoints) < 2:
            rospy.logwarn("Need at least 2 waypoints to patrol!")
            return
        rospy.loginfo("Starting Patrol!")
        self.patrolling = True
        self.current_wp_index = 0
        self.send_goal()
        
    def stop_patrol_cb(self, feedback):
        rospy.loginfo("Stopping Patrol!")
        self.patrolling = False
        self.move_base.cancel_all_goals()
        
    def delete_wp_cb(self, feedback):
        wp_id = feedback.marker_name
        self.waypoints = [wp for wp in self.waypoints if wp["id"] != wp_id]
        self.server.erase(wp_id)
        self.server.applyChanges()
        self.update_orientations()
        
    def clear_all_cb(self, feedback):
        self.stop_patrol_cb(None)
        self.waypoints = []
        self.server.clear()
        self.server.applyChanges()
        self.wp_count = 0
        
    def send_goal(self):
        if not self.patrolling or not self.waypoints:
            return
            
        wp = self.waypoints[self.current_wp_index]
        # Calculate theta to next waypoint
        nxt = self.waypoints[(self.current_wp_index + 1) % len(self.waypoints)]
        dx = nxt["x"] - wp["x"]
        dy = nxt["y"] - wp["y"]
        theta = math.atan2(dy, dx)
        q = tf.transformations.quaternion_from_euler(0, 0, theta)
        
        goal = MoveBaseGoal()
        goal.target_pose.header.frame_id = "map"
        goal.target_pose.header.stamp = rospy.Time.now()
        goal.target_pose.pose.position.x = wp["x"]
        goal.target_pose.pose.position.y = wp["y"]
        goal.target_pose.pose.orientation = Quaternion(*q)
        
        rospy.loginfo("Going to %s", wp["id"])
        self.move_base.send_goal(goal, done_cb=self.goal_done_cb)
        
    def goal_done_cb(self, status, result):
        if not self.patrolling:
            return
        if status == actionlib.GoalStatus.SUCCEEDED:
            rospy.loginfo("Reached Waypoint! Moving to next...")
            self.current_wp_index = (self.current_wp_index + 1) % len(self.waypoints)
            self.send_goal()
        else:
            rospy.logwarn("Failed to reach waypoint. Retrying next in 5s...")
            self.current_wp_index = (self.current_wp_index + 1) % len(self.waypoints)
            rospy.sleep(5.0)
            self.send_goal()

if __name__ == "__main__":
    WaypointManager()
    rospy.spin()
