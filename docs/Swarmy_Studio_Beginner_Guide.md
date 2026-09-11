# Swarmy Studio: Beginner's Guide

## What is Swarmy Studio?
Swarmy Studio is a **No-Code Visual Mission Builder**. It allows anyone—even someone with zero programming experience—to create complex, autonomous behavioral sequences for the robot simply by dragging and dropping blocks on a screen.

Think of it like drawing a flowchart. You connect a "Start" block to a "Go Here" block, and then to a "Say Hello" block. When you launch the flowchart, the robot executes those actions in order.

---

## 1. The Interface Overview
When you open **Swarmy Studio** from the dashboard sidebar, you will see three main areas:
1. **The Node Library (Left Sidebar):** A list of all the actions the robot can perform.
2. **The Canvas (Center):** The large grid where you build your flowchart.
3. **The Control Panel (Top Right):** Buttons to Save, Load, or clear the canvas.

---

## 2. Understanding the Nodes (Blocks)
Here are the building blocks you can drag onto your canvas:

- **Start Node:** The mandatory beginning of every mission.
- **Waypoint Node:** Commands the robot to drive to a specific saved location on your map (e.g., "Kitchen").
- **Wait Node:** Makes the robot pause for a specific number of seconds.
- **Speak Node:** Uses the robot's Text-to-Speech engine to say a custom phrase out loud.
- **Emotion Node:** Changes the robot's digital face (e.g., Happy, Sad, Scanning, Charging).
- **Condition Node (Advanced):** Splits the flowchart. For example, "Is battery > 20%?". If Yes, do one thing. If No, do another.

---

## 3. Step-by-Step: Creating Your First Mission
Let's build a simple mission: **Go to the Kitchen, act happy, say "Delivery here!", wait 5 seconds, and go back to the Dock.**

### Step 1: Place the Nodes
1. Click and drag a **Start** node onto the left side of the canvas.
2. Drag a **Waypoint** node next to it. Click on the node and type `Kitchen` in its settings box.
3. Drag an **Emotion** node. Set it to `happy`.
4. Drag a **Speak** node. Type `Delivery here!` in its text box.
5. Drag a **Wait** node. Set the duration to `5` seconds.
6. Drag another **Waypoint** node. Type `Dock`.

### Step 2: Connect the Flow
1. Look at the **Start** node. See the small dot on its right side? Click and drag a wire from that dot to the dot on the left side of the first **Waypoint** node.
2. Connect the output of the **Waypoint** node to the **Emotion** node.
3. Continue chaining them together: `Start` -> `Waypoint (Kitchen)` -> `Emotion (happy)` -> `Speak` -> `Wait (5s)` -> `Waypoint (Dock)`.

### Step 3: Save Your Mission
1. Click the **Save Workflow** button in the top right.
2. Give it a name like `Kitchen Delivery`.

---

## 4. Executing Your Mission
You built it, now let's run it!

1. Go to the **Mission Launcher** panel on the left sidebar.
2. Select your `Kitchen Delivery` mission from the dropdown list.
3. Make sure the robot is localized on the map.
4. Click **LAUNCH MISSION**.
5. Watch the screen—you will see a live progress tracker showing exactly which node the robot is currently executing!
