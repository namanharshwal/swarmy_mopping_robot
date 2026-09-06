#!/usr/bin/env python
import rospy
import threading
import time
from opcua import Server, ua
from geometry_msgs.msg import PoseStamped, PoseWithCovarianceStamped
from std_msgs.msg import String, Bool

class OpcUaBridge:
    def __init__(self):
        rospy.init_node('opcua_ros_bridge', anonymous=True)
        
        # ROS Publishers
        self.nav_pub = rospy.Publisher('/move_base_simple/goal', PoseStamped, queue_size=10)
        self.task_pub = rospy.Publisher('/swarmy/task_trigger', String, queue_size=10)
        self.io_pub = rospy.Publisher('/swarmy/io_control', String, queue_size=10)
        
        # State variables
        self.current_x = 0.0
        self.current_y = 0.0
        self.current_status = "IDLE"
        self.task_progress = 0.0
        
        # OPC UA Server Setup
        self.server = Server()
        self.server.set_endpoint("opc.tcp://0.0.0.0:4840/freeopcua/server/")
        self.server.set_server_name("Swarmy AMR Siemens PLCSIM Advanced Interface")
        
        # Setup Namespace
        uri = "http://swarmy.amr.opcua"
        idx = self.server.register_namespace(uri)
        
        # Create Objects
        objects = self.server.get_objects_node()
        amr_node = objects.add_object(idx, "SwarmyAMR")
        
        # Variables (Read-only for PLC)
        self.var_x = amr_node.add_variable(idx, "PositionX", 0.0)
        self.var_y = amr_node.add_variable(idx, "PositionY", 0.0)
        self.var_status = amr_node.add_variable(idx, "Status", "IDLE")
        self.var_progress = amr_node.add_variable(idx, "TaskProgress", 0.0)
        
        # Set Read-only
        self.var_x.set_writable(False)
        self.var_y.set_writable(False)
        self.var_status.set_writable(False)
        self.var_progress.set_writable(False)
        
        # Writable Variables (PLC commands)
        self.var_cmd_x = amr_node.add_variable(idx, "CommandX", 0.0)
        self.var_cmd_y = amr_node.add_variable(idx, "CommandY", 0.0)
        self.var_cmd_trigger = amr_node.add_variable(idx, "TriggerMove", False)
        
        self.var_task_cmd = amr_node.add_variable(idx, "TaskCommand", "")
        self.var_task_trigger = amr_node.add_variable(idx, "TriggerTask", False)
        
        self.var_io_pin = amr_node.add_variable(idx, "IOPin", 0)
        self.var_io_state = amr_node.add_variable(idx, "IOState", False)
        self.var_io_trigger = amr_node.add_variable(idx, "TriggerIO", False)
        
        self.var_cmd_x.set_writable(True)
        self.var_cmd_y.set_writable(True)
        self.var_cmd_trigger.set_writable(True)
        self.var_task_cmd.set_writable(True)
        self.var_task_trigger.set_writable(True)
        self.var_io_pin.set_writable(True)
        self.var_io_state.set_writable(True)
        self.var_io_trigger.set_writable(True)

        # ROS Subscribers
        rospy.Subscriber('/amcl_pose', PoseWithCovarianceStamped, self.pose_cb)
        rospy.Subscriber('/swarmy/status', String, self.status_cb)
        rospy.Subscriber('/swarmy/task_progress', String, self.progress_cb)

    def pose_cb(self, msg):
        self.current_x = msg.pose.pose.position.x
        self.current_y = msg.pose.pose.position.y
        self.var_x.set_value(self.current_x)
        self.var_y.set_value(self.current_y)
        
    def status_cb(self, msg):
        self.current_status = msg.data
        self.var_status.set_value(self.current_status)
        
    def progress_cb(self, msg):
        try:
            self.task_progress = float(msg.data)
            self.var_progress.set_value(self.task_progress)
        except ValueError:
            pass

    def check_commands(self):
        # Move Command
        if self.var_cmd_trigger.get_value():
            target_x = self.var_cmd_x.get_value()
            target_y = self.var_cmd_y.get_value()
            rospy.loginfo("OPC UA Command: Move to ({}, {})".format(target_x, target_y))
            goal = PoseStamped()
            goal.header.frame_id = "map"
            goal.header.stamp = rospy.Time.now()
            goal.pose.position.x = target_x
            goal.pose.position.y = target_y
            goal.pose.orientation.w = 1.0
            self.nav_pub.publish(goal)
            self.var_cmd_trigger.set_value(False)
            
        # Task Command
        if self.var_task_trigger.get_value():
            task = self.var_task_cmd.get_value()
            rospy.loginfo("OPC UA Command: Execute Task '{}'".format(task))
            self.task_pub.publish(task)
            self.var_task_trigger.set_value(False)
            
        # IO Command
        if self.var_io_trigger.get_value():
            pin = self.var_io_pin.get_value()
            state = self.var_io_state.get_value()
            
            # Conflict prevention: only allow free pins (e.g., 20-30)
            if 20 <= pin <= 30:
                rospy.loginfo("OPC UA Command: Set Free IO Pin {} to {}".format(pin, state))
                self.io_pub.publish("{}:{}".format(pin, int(state)))
            else:
                rospy.logwarn("OPC UA Command Rejected: IO Pin {} is reserved/conflicting!".format(pin))
                
            self.var_io_trigger.set_value(False)

    def run(self):
        self.server.start()
        rospy.loginfo("OPC UA Server started at opc.tcp://0.0.0.0:4840/freeopcua/server/")
        try:
            rate = rospy.Rate(10) # 10hz
            while not rospy.is_shutdown():
                self.check_commands()
                rate.sleep()
        finally:
            self.server.stop()
            rospy.loginfo("OPC UA Server stopped.")

if __name__ == '__main__':
    bridge = OpcUaBridge()
    bridge.run()
