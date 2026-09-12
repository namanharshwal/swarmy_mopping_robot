#!/usr/bin/env python3
import rospy
import asyncio
from asyncua import Client, ua
import actionlib
from move_base_msgs.msg import MoveBaseAction, MoveBaseGoal

# --- CONFIGURATION ---
# Using the Windows PC's Wi-Fi adapter IP
KEPWARE_URL = "opc.tcp://192.168.137.155:49320"  

# Map the PLC's integer values to physical map coordinates
WAYPOINTS = {
    1: {"x": 2.5, "y": 1.0, "w": 1.0},
    2: {"x": 5.0, "y": -2.0, "w": 0.7},
}
# ---------------------

async def opcua_to_ros_bridge():
    rospy.init_node('kepware_bridge_node', anonymous=True)
    
    # Setup ROS Action Client
    nav_client = actionlib.SimpleActionClient('move_base', MoveBaseAction)
    rospy.loginfo("Waiting for ROS move_base action server...")
    nav_client.wait_for_server()
    rospy.loginfo("move_base connected.")

    # Initialize the OPC UA Client
    opc_client = Client(url=KEPWARE_URL)
    
    # Enable Certificate Encryption
    opc_client.set_security_string("Basic256Sha256,signandencrypt,client_cert.der,client_key.pem")
    
    # Enable Username & Password Authentication
    opc_client.set_user("robot_user")
    opc_client.set_password("securepassword123")

    async with opc_client:
        rospy.loginfo(f"Securely connected to KEPServerEX at {KEPWARE_URL}")
        
        # Replace with your exact Kepware Channel/Device names
        start_nav_node = opc_client.get_node("ns=2;s=VIRTUAL PLC.PLC1.StartNAV")
        start_point_node = opc_client.get_node("ns=2;s=VIRTUAL PLC.PLC1.StartPoint")
        
        last_start_nav = False
        
        while not rospy.is_shutdown():
            start_nav = await start_nav_node.read_value()
            
            # Detect Rising Edge
            if start_nav and not last_start_nav:
                point_int = await start_point_node.read_value()
                rospy.loginfo(f"PLC commanded StartNAV! Target Point INT: {point_int}")
                
                if point_int in WAYPOINTS:
                    target = WAYPOINTS[point_int]
                    goal = MoveBaseGoal()
                    goal.target_pose.header.frame_id = "map"
                    goal.target_pose.header.stamp = rospy.Time.now()
                    goal.target_pose.pose.position.x = target["x"]
                    goal.target_pose.pose.position.y = target["y"]
                    goal.target_pose.pose.orientation.w = target["w"]
                    
                    nav_client.send_goal(goal)
                    rospy.loginfo(f"Robot is navigating to waypoint {point_int}")
                    
            last_start_nav = start_nav
            await asyncio.sleep(0.1)

if __name__ == '__main__':
    try:
        asyncio.run(opcua_to_ros_bridge())
    except rospy.ROSInterruptException:
        pass
