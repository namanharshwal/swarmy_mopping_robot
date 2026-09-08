#!/usr/bin/env python3
import time
import argparse
from opcua import Client

def main():
    parser = argparse.ArgumentParser(description="Swarmy OPC UA Client (Simulates Siemens PLC)")
    parser.add_argument("--move", nargs=2, type=float, metavar=('X', 'Y'), help="Send a move command to X Y")
    parser.add_argument("--task", type=str, help="Send a task command string")
    parser.add_argument("--monitor", action="store_true", help="Monitor the robot status continuously")
    args = parser.parse_args()

    client = Client("opc.tcp://localhost:4840/freeopcua/server/")
    
    try:
        print("Connecting to OPC UA Server at opc.tcp://localhost:4840/freeopcua/server/ ...")
        client.connect()
        print("Connected successfully!")
        
        # Get Namespace
        idx = client.get_namespace_index("http://swarmy.amr.opcua")
        
        # Get Object Node (SwarmyAMR)
        objects = client.get_objects_node()
        amr_node = objects.get_child([f"{idx}:SwarmyAMR"])
        
        # Get Variables
        var_x = amr_node.get_child([f"{idx}:PositionX"])
        var_y = amr_node.get_child([f"{idx}:PositionY"])
        var_status = amr_node.get_child([f"{idx}:Status"])
        
        var_cmd_x = amr_node.get_child([f"{idx}:CommandX"])
        var_cmd_y = amr_node.get_child([f"{idx}:CommandY"])
        var_cmd_trigger = amr_node.get_child([f"{idx}:TriggerMove"])
        
        var_task_cmd = amr_node.get_child([f"{idx}:TaskCommand"])
        var_task_trigger = amr_node.get_child([f"{idx}:TriggerTask"])

        print("\n--- Current Robot State ---")
        print(f"Position: ({var_x.get_value():.2f}, {var_y.get_value():.2f})")
        print(f"Status:   {var_status.get_value()}")
        print("---------------------------\n")

        if args.move:
            print(f"Sending Move Command to ({args.move[0]}, {args.move[1]})...")
            var_cmd_x.set_value(args.move[0])
            var_cmd_y.set_value(args.move[1])
            var_cmd_trigger.set_value(True)
            print("Move Command Sent (TriggerMove set to True)!")

        if args.task:
            print(f"Sending Task Command: '{args.task}'...")
            var_task_cmd.set_value(args.task)
            var_task_trigger.set_value(True)
            print("Task Command Sent (TriggerTask set to True)!")

        if args.monitor:
            print("Monitoring Robot State (Press Ctrl+C to stop)...")
            try:
                while True:
                    print(f"[Monitor] Pos: ({var_x.get_value():.2f}, {var_y.get_value():.2f}) | Status: {var_status.get_value()}")
                    time.sleep(1)
            except KeyboardInterrupt:
                print("Monitoring stopped.")

    except Exception as e:
        print(f"OPC UA Client Error: {e}")
        print("Make sure the OPC UA Server is running in the Swarmy web panel!")
    finally:
        client.disconnect()
        print("Disconnected.")

if __name__ == "__main__":
    main()
