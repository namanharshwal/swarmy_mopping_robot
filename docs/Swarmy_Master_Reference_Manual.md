# Swarmy Master Reference Manual

## 1. System Architecture Overview
Swarmy OS is a complex, multi-layered robotics stack designed to run on the NVIDIA Jetson Nano. 
- **Hardware Layer:** Motors, encoders, LiDAR, Ultrasonic sensors, and I2C Battery monitoring.
- **ROS Layer (Melodic):** Handles real-time hardware abstraction, odometry, `gmapping` (SLAM), `amcl` (localization), and `move_base` (navigation path planning).
- **Node.js Express Backend:** Bridges the gap between the web and ROS using `rosnodejs` and `rosbridge`. It executes terminal commands natively and hosts the OPC UA server and REST APIs.
- **React Frontend (Vite):** A cyberpunk-styled, highly interactive UI that renders live maps, joystick controls, AI interfaces, and visual flowchart editors in the browser.

---

## 2. Comprehensive Panel Guide

### 2.1 The AI Brain (Voice & Text)
Swarmy is powered by **Gemini 2.5 Flash** (default) or **NVIDIA NIM** models.
- **Capabilities:** The AI has full contextual awareness of the robot's hardware. It can write and execute `<EXEC>` commands directly into the Jetson's terminal.
- **Use Case:** You can say, *"Swarmy, map the room"* and the AI will automatically stop navigation processes and execute the `roslaunch swarmy_navigation autonomous_mapping.launch` command.

### 2.2 Teleoperation & Manual Control
- **Joystick:** Sends `geometry_msgs/Twist` commands directly to `/cmd_vel` at 10Hz.
- **Speed Constraints:** Max linear speed is 0.5 m/s. Max angular speed is 1.0 rad/s.
- **Keyboard Fallback:** Use WASD keys when the joystick is unavailable.

### 2.3 2D Mapping (SLAM)
- **Manual Mapping:** Uses `gmapping`. Drive the robot around manually using the joystick to build the map.
- **Autonomous Mapping:** Uses the `explore_lite` package to autonomously seek out unknown frontiers until the map is complete.
- **Saving:** Clicking "Save Map" fires `rosrun map_server map_saver` to save the `.yaml` and `.pgm` files to the workspace.

### 2.4 Autonomous Navigation
- Requires a saved map to be loaded.
- Uses `amcl` for probabilistic localization (matching LiDAR scans to the static map).
- Uses `move_base` with a Global Planner (A* or Dijkstra) and a Local Planner (DWA or TEB) to avoid dynamic obstacles like walking humans.
- Click anywhere on the map grid in the UI to send a 2D Nav Goal.

### 2.5 Swarmy Studio (Workflow Editor)
- **Concept:** A ReactFlow-based visual node editor.
- **Capabilities:** Create state machines and linear sequences combining waypoints, TTS speech, emotions, and delays.
- **Execution:** Workflows are compiled into JSON arrays and executed sequentially by the Node.js backend.

### 2.6 OPC UA Interface
- **Concept:** Industrial standard protocol running on port 4840.
- **Variables:** Exposes live ROS telemetry (`/amcl_pose`, `/battery_state`) to PLCs.
- **Methods:** Allows factory equipment to trigger workflows created in Swarmy Studio, enabling fully automated factory lines without human intervention.

### 2.7 Robot Face (Emotion Engine)
- A 60 FPS HTML5 Canvas component that visualizes 100+ emotions.
- Driven by React state. Emotions are triggered by the AI Brain in conversation (e.g., `<emotion>happy</emotion>`) or by Swarmy Studio nodes.

### 2.8 RQT Graph & Processes
- Provides a live tree view of all running Linux PIDs and ROS nodes.
- Allows you to forcefully `SIGKILL` stuck processes directly from the dashboard.

---

## 3. Advanced Master Possibilities & Workflows

### 3.1 Fully Autonomous Warehouse Operations
**The Goal:** The robot patrols the warehouse, docks itself, and interfaces with factory machines.
**The Setup:**
1. Map the warehouse using Autonomous Mapping.
2. Save waypoints via the UI for "Dock", "Conveyor_A", and "Storage_B".
3. Use Swarmy Studio to build a "Patrol" workflow: `Start -> Conveyor_A -> Storage_B -> Dock`.
4. Use OPC UA to connect a Siemens PLC to the robot. When the PLC detects a box at Conveyor_A, it calls `TriggerTask("Patrol")`.

### 3.2 AI-Driven Security Guard
**The Goal:** Swarmy listens for intruders.
**The Setup:**
1. Select the "Ultron" voice profile.
2. Tell the AI: *"Wait for 1 hour. If you hear a loud noise, drive to the Kitchen waypoint and say 'Intruder detected'."*
3. The AI will write a custom bash script or ROS subscriber on the fly and execute it via `<EXEC>` tags to monitor the microphone and trigger navigation.

### 3.3 Large Scale Map Editing
If a map gets messy (e.g., people walking around during SLAM), use the Workspace IDE panel to open the `.pgm` map file and physically erase grey obstacle pixels, replacing them with white (free space) before saving and launching navigation.

---

## 4. Emergency Recovery
If the robot's navigation stack freezes or fails to find a path:
1. Hit the red **STOP ALL PROCESSES** button in the top right of the dashboard (this sends a global SIGKILL to all ROS nodes).
2. Go to System Settings and Restart the Backend Service.
3. Reload the dashboard and manually launch the Navigation stack again.
