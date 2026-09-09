#!/usr/bin/env python3
import json
import time
import os
import rospy
from geometry_msgs.msg import PoseStamped, Twist
from std_msgs.msg import String

class WorkflowEngine:
    def __init__(self, workflow_file):
        self.workflow_file = workflow_file
        self.nodes = {}
        self.edges = []
        self.adjacency = {}
        
        # Initialize ROS node (using anonymous=True allows multiple executions)
        try:
            rospy.init_node('swarmy_workflow_engine', anonymous=True)
        except Exception:
            pass
            
        # Publishers
        self.cmd_vel_pub = rospy.Publisher('/cmd_vel', Twist, queue_size=10)
        self.goal_pub = rospy.Publisher('/move_base_simple/goal', PoseStamped, queue_size=10)
        
        self.load_workflow()

    def load_workflow(self):
        if not os.path.exists(self.workflow_file):
            print(f"[Engine] Error: Workflow file {self.workflow_file} not found.")
            return

        with open(self.workflow_file, 'r') as f:
            data = json.load(f)
            
        for n in data.get('nodes', []):
            self.nodes[n['id']] = n
            
        self.edges = data.get('edges', [])
        
        # Build adjacency: node_id -> { 'success': target_node_id, 'failure': target_node_id }
        for e in self.edges:
            src = e.get('source')
            tgt = e.get('target')
            handle = e.get('sourceHandle') # e.g. 'success' or 'failure'
            if src not in self.adjacency:
                self.adjacency[src] = {}
            # Fallback for old smooth edges without handle identifiers
            if handle is None:
                handle = 'success'
            self.adjacency[src][handle] = tgt

    def get_start_node(self):
        for nid, node in self.nodes.items():
            if node.get('type') == 'input' and node.get('data', {}).get('label') == 'START_FLOW':
                return node
        return None

    def execute_node(self, node):
        label = node.get('data', {}).get('label', '')
        config = node.get('data', {}).get('config', {})
        print(f"\n[Engine] ---> Executing Node: {label} (ID: {node['id']})")
        print(f"         Config: {config}")

        # Simulate execution based on node type
        if label == 'wait_time':
            duration = float(config.get('duration', 1.0))
            print(f"[Engine] Waiting for {duration} seconds...")
            rospy.sleep(duration)
            return 'success'
            
        elif label == 'go_to_place':
            x = float(config.get('x', 0.0))
            y = float(config.get('y', 0.0))
            print(f"[Engine] Publishing Navigation Goal to (X: {x}, Y: {y})...")
            
            goal = PoseStamped()
            goal.header.frame_id = "map"
            goal.header.stamp = rospy.Time.now()
            goal.pose.position.x = x
            goal.pose.position.y = y
            goal.pose.orientation.w = 1.0
            
            self.goal_pub.publish(goal)
            print("[Engine] Waiting 5 seconds to simulate travel time...")
            rospy.sleep(5)
            return 'success'
            
        elif label == 'announce':
            text = config.get('text', '')
            print(f"[Engine] Announcing: '{text}' (Triggering AI TTS)")
            rospy.sleep(1)
            return 'success'
            
        elif label == 'LocationAck' or label == 'ConveyorUnlock':
            register = config.get('register', 0)
            print(f"[Engine] Sending Modbus/OPC UA signal to PLC Register {register}...")
            rospy.sleep(1)
            return 'success'

        elif label == 'START_FLOW':
            print(f"[Engine] Workflow Started.")
            return 'success'

        else:
            print(f"[Engine] No specific execution logic for {label}. Passing through...")
            rospy.sleep(0.5)
            return 'success'

    def run(self):
        print("========================================")
        print("[Engine] Starting Swarmy State Machine")
        print("========================================")
        
        current_node = self.get_start_node()
        if not current_node:
            print("[Engine] CRITICAL ERROR: Could not find 'START_FLOW' node! Halting.")
            return

        while current_node and not rospy.is_shutdown():
            result = self.execute_node(current_node)
            
            # Find next node based on result
            paths = self.adjacency.get(current_node['id'], {})
            next_node_id = paths.get(result)
            
            if next_node_id:
                current_node = self.nodes.get(next_node_id)
            else:
                print(f"\n[Engine] Reached end of path from node {current_node.get('data', {}).get('label')}.")
                current_node = None

        print("========================================")
        print("[Engine] State Machine Execution Finished")
        print("========================================")

if __name__ == '__main__':
    script_dir = os.path.dirname(os.path.abspath(__file__))
    workflow_path = os.path.join(script_dir, 'swarmy_workflow.json')
    engine = WorkflowEngine(workflow_path)
    engine.run()
