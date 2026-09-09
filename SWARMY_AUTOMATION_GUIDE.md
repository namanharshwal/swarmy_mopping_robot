# Swarmy Automation & Integration Guide

This document outlines the usage of the two major industrial upgrades added to the Swarmy web dashboard: the **OPC UA Interface** and **Swarmy Studio**.

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
* **Send Move Commands (Navigation):** Type a target X and Y coordinate, then click `Send Move`. This writes to the `CommandX`, `CommandY`, and `TriggerMove` variables. The internal bridge detects this and automatically publishes a `/move_base_simple/goal` to ROS, making the robot drive to the location!
* **Send Task Commands:** Type a custom string (e.g., `UNLOCK_CONVEYOR`) and click `Send Task`. This triggers custom ROS string topics that you can use to trigger actuators or external factory hardware.

> [!IMPORTANT]
> To prevent system conflicts, the OPC UA bridge restricts free I/O pin manipulation strictly to pins 20 through 30.

---

## 2. Swarmy Studio (State Machine Builder)

Swarmy Studio is a drag-and-drop workflow editor inspired by enterprise AMR software (like GT Studio and MiR Fleet). It allows you to program complex, conditional robot missions without writing code.

### The Component Sidebar
On the right side of the screen, you have access to three tabs of components:
* **Tasks (Teal):** Physical robot movements (Go to waypoint, Follow path, Dock/Undock, Actuate payload lifters).
* **Actions (Purple):** API and Hardware triggers (Modbus/OPC UA handshakes, GPIO toggles, Webhooks, AI Voice TTS, Face Emotions).
* **Widgets (Amber):** Logic gates (If/Else splits, Loops, Variables, Flow Termination).

### Building a Workflow
1. **Drag and Drop:** Click and hold any component from the sidebar, then drag it onto the dotted canvas.
2. **Wiring (Success vs Failure):** 
   * Every node (except logic terminators) has two output handles at the bottom: **Success (Green)** and **Failed (Red)**.
   * Click and drag from the **Success** pill of one node to the top input handle of the next node.
   * If a task might fail (e.g., the robot path is blocked, or the PLC doesn't respond), you can drag a wire from the **Failed** pill to a fallback node (like an AI Voice `announce` node saying "I am stuck!").
3. **Panning & Zooming:** You can scroll to zoom in/out, and click-and-drag the empty canvas to pan around massive workflows.

---

## 3. What's Next? (Phase 2 & 3)

You currently have **Phase 1** completed, which means the industrial-grade UI, the drag-and-drop mechanics, and the component library are fully functional. 

To make Swarmy actually execute the workflows you draw, we need to build the next phases:

* **Phase 2 (Configurable Nodes):** We need to make the nodes clickable. When you click `go_to_place`, a menu should pop up asking "Which waypoint?". When you click `announce`, it should ask "What should I say?".
* **Phase 3 (The Execution Engine):** When you click the `UPDATE & EXIT` button, the React UI will compile your flowchart into a JSON file and send it to a new ROS Python node. That node will read the JSON, find the `START` node, and physically drive the robot block-by-block based on the wires you drew!

> [!TIP]
> Whenever you are ready, simply ask me to begin Phase 2, and I will add the clickable properties panels to the nodes!
