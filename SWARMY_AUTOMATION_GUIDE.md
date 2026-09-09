# Swarmy Automation & Integration Guide

This document outlines the usage of the two major industrial upgrades built into the Swarmy web dashboard: the **OPC UA Interface** and **Swarmy Studio**.

---

## 1. The OPC UA Interface (PLC Bridge)

The OPC UA panel is designed to bridge the gap between Swarmy's internal ROS network and standard factory PLCs (like Siemens PLCSIM Advanced). 

### Starting the Server
1. Navigate to **Operations > OPC UA Interface** on the left sidebar.
2. Click the green **START OPC UA SERVER** button.
3. The server will launch on `opc.tcp://<your-ip>:4840/freeopcua/server/`. 
4. Your factory PLCs can now connect to this endpoint to read the robot's real-time state or write commands.

### Using the Built-in PLC Simulator
At the bottom of the page, you will find the **PLC Simulator**. This allows you to test the bridge without needing a real physical PLC:

* **Read Robot State:** Click `FETCH LIVE DATA`. The Node.js backend runs a hidden Python client to read `PositionX`, `PositionY`, and `Status` from the server, displaying it on the screen.
* **Send Move Commands (Navigation):** Type a target X and Y coordinate, then click `Send Move`. This writes to the `CommandX`, `CommandY`, and `TriggerMove` variables. The internal bridge detects this and automatically publishes a `/move_base_simple/goal` to ROS, making the robot drive to the location.
* **Send Task Commands:** Type a custom string (e.g., `UNLOCK_CONVEYOR`) and click `Send Task`. This triggers custom ROS string topics that you can use to trigger actuators or external factory hardware.

> [!IMPORTANT]
> To prevent system conflicts, the OPC UA bridge restricts free I/O pin manipulation strictly to pins 20 through 30.

---

## 2. Swarmy Studio (State Machine Builder)

Swarmy Studio is a drag-and-drop workflow editor inspired by enterprise AMR software (like GT Studio and MiR Fleet). It allows you to program complex, conditional robot missions visually without writing code.

### The Component Library
On the right side of the screen, you have access to a massive library of 24 components split into three categories:

* **Tasks (Teal - Physical Navigation):**
  * `go_to_place`, `follow_path`, `rotate`, `dock_bot`, `undock_bot`, `lift_payload`, `drop_payload`, `wait_time`, `move_velocity`.
* **Actions (Purple - Software & APIs):**
  * `LocationAck`, `ConveyorUnlock`, `trigger_gpio`, `read_gpio`, `call_rest_api`, `send_email`, `announce` (AI Voice TTS), `play_sound`, `emotion`.
* **Widgets (Amber - Logic & Flow):**
  * `Split On`, `Set Variable`, `Loop`, `Wait Event`, `Sub-Flow`, `End Flow`.

### Building a Workflow
1. **Drag and Drop:** Click and hold any component from the sidebar, then drag it onto the dotted canvas.
2. **Configure Properties:** Click on the node you just dropped. The right sidebar will transition into a **Properties Panel**. Here, you can type in specific parameters for that node (e.g., defining `X` and `Y` coordinates for a `go_to_place` node, or typing the `Speech Text` for an `announce` node).
3. **Wiring (Success vs Failure):** 
   * Every node (except logic terminators) has two output handles at the bottom: **Success (Green)** and **Failed (Red)**.
   * Click and drag from the **Success** pill of one node to the top input handle of the next node.
   * If a task might fail (e.g., the robot path is blocked), you can drag a wire from the **Failed** pill to a fallback node (like an AI Voice `announce` node saying "I am stuck!").

---

## 3. The Execution Engine

Once your flow chart is built, it's time to run it on the physical robot.

1. **Saving the Flow:** Click the **UPDATE** button in the top right. The web interface compiles your visual flowchart into a JSON file (`swarmy_workflow.json`) and securely saves it to the backend server.
2. **Running the Flow:** Click **UPDATE & RUN**. The backend will instantly spawn the background **Python Execution Engine**.
3. **How it Works Under the Hood:**
   * The Python ROS node (`swarmy_workflow_engine.py`) boots up and reads the JSON file.
   * It locates the `START_FLOW` input node.
   * It traverses the graph, automatically evaluating success/failure routes.
   * When it lands on a node, it reads the custom configurations you typed into the Properties Panel, and publishes the corresponding hardware commands to ROS (e.g., publishing a `PoseStamped` goal to `/move_base_simple/goal`).

> [!TIP]
> You can monitor the live execution steps of the Python engine by keeping an eye on the Server terminal panel in your web dashboard, or by watching Swarmy physically move in the real world!
