# Swarmy Web App — Frontend UI

This is the React + Vite frontend for the Swarmy Industrial AMR. It acts as the primary operator control panel, fleet management system, and mapping dashboard.

## 🌟 Key Features

- **IndustrialMappingPage.jsx**: A unified interface for both Manual SLAM and Autonomous Frontier Exploration. Features an on-screen Nipple.js joystick, direct ROSBridge integration, and a live RViz VNC stream for visualization.
- **RoutePlannerPage.jsx**: An advanced topological graph editor. Users can drop stations onto the loaded map, configure **heading angles** via a touch-friendly compass pad, set **dwell times**, and draw **custom paths** for the robot to execute.
- **Responsive Layout**: Designed entirely with responsive CSS to support:
  - **Desktop / Laptop**: Side-by-side full visibility panels.
  - **Tablet**: Compact controls with optimized touch targets.
  - **Mobile**: Stacking panels, collapsible sidebars, and safe-area adjustments for on-the-go factory floor operation.
- **AI Integration**: Global AI chat side-panel and a 60fps HTML5 Canvas expressive robot face.
- **ROS Integration**: Connects via `roslibjs` (port 9090 WebSocket) to read topics (`/robot_map_pose`, `/amcl_pose`, `/swarmy_route_status`) and send commands (`/move_base_simple/goal`, `/cmd_vel`).

## 🚀 Development Setup

To run this frontend in development mode with Hot Module Replacement (HMR):

```bash
cd /home/swarmy_bot/swarmy_ws/src/swarmy_web_app
npm install
npm run dev
```

To build for production (this outputs to `dist/`, which the backend serves automatically):

```bash
cd /home/swarmy_bot/swarmy_ws/src/swarmy_web_app
npm run build
```

## 📂 Component Map
- `App.jsx`: The main router and layout shell.
- `IndustrialMappingPage.jsx`: Combined SLAM & Auto-Mapping dashboard.
- `RoutePlannerPage.jsx`: The topological routing map editor.
- `SettingsPage.jsx`: Jetson system metrics, network setup, and environment config.
- `RobotFace.jsx`: The 100+ emotion rendering engine.
- `index.css`: Global styles, CSS variables (Hexa theme), and all media queries for responsiveness.

## 🔧 Technologies
- React 18
- Vite
- Lucide React (Icons)
- ROSLibJS (ROS WebSocket communication)
- Nipple.js (Virtual Joystick)
