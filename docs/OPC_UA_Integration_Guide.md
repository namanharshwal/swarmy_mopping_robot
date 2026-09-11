# Swarmy OPC UA Integration Guide

## Introduction
OPC Unified Architecture (OPC UA) is the industry standard for machine-to-machine communication in factory automation. Swarmy Bot comes with a built-in OPC UA Server, allowing it to seamlessly integrate with industrial machinery, SCADA systems, and Programmable Logic Controllers (PLCs) such as Siemens, Allen-Bradley, and Beckhoff.

This guide explains how to connect to Swarmy, read its live telemetry, and command it using OPC UA.

---

## 1. Starting the OPC UA Server
1. Open the **Swarmy Dashboard**.
2. Navigate to the **OPC UA Interface** panel on the left sidebar.
3. Click the **Start Server** button. 
4. The server will initialize on port `4840`.
5. Your connection endpoint is: `opc.tcp://<JETSON_IP_ADDRESS>:4840`

---

## 2. Connecting a Client (e.g., UaExpert)
To test the connection from your PC before hooking up a PLC:
1. Download and install **UaExpert**.
2. Click the `+` icon to add a new server.
3. Double-click `Custom Discovery` and enter the Endpoint URL: `opc.tcp://<JETSON_IP>:4840`
4. Connect using `Anonymous` authentication (or configure security policies in the settings).
5. Expand the **Objects** folder in the Address Space. You will see a folder named **SwarmyRobot**.

---

## 3. Address Space Architecture

Inside the `SwarmyRobot` object, you will find Variables (telemetry) and Methods (commands).

### Variables (Live Data)
These variables update in real-time. Your PLC can subscribe to them or poll them.
- **BatteryLevel** (Float): The current battery voltage/percentage.
- **RobotState** (String): Current status (`IDLE`, `NAVIGATING`, `MAPPING`, `ERROR`).
- **PositionX** (Float): X-coordinate on the 2D map.
- **PositionY** (Float): Y-coordinate on the 2D map.
- **OrientationTheta** (Float): The rotational heading of the robot in radians.

### Methods (Commands)
You can trigger these methods from your PLC to control the robot:
- **MoveToLocation(String targetName)**: Commands the robot to autonomously drive to a saved waypoint (e.g., "DockingStation").
- **TriggerTask(String taskID)**: Executes a complex compiled workflow created in Swarmy Studio.

---

## 4. Factory Use Cases

### Use Case A: Automated Material Transport
1. A CNC machine finishes cutting a part.
2. The Siemens PLC controlling the CNC machine sends an OPC UA `MoveToLocation("CNC_Station_1")` command to Swarmy.
3. Swarmy navigates to the machine.
4. Once Swarmy arrives (PLC reads `RobotState == "IDLE"` and `PositionX/Y` matches the station), the CNC machine loads the part onto Swarmy.
5. The PLC triggers `MoveToLocation("Warehouse_Dropoff")`.

### Use Case B: Low Battery Intervention
1. A SCADA dashboard monitors `BatteryLevel` via OPC UA.
2. If `BatteryLevel` drops below 15%, the SCADA system automatically fires `TriggerTask("ReturnToCharger")`.

---

## 5. Troubleshooting
- **Connection Refused:** Ensure the Jetson's firewall (ufw) allows traffic on port `4840` (`sudo ufw allow 4840`).
- **Data Not Updating:** Verify that the ROS Core is running. The OPC UA backend bridges ROS topics (`/battery_state`, `/amcl_pose`) to the OPC nodes. If ROS is dead, the nodes will freeze.
