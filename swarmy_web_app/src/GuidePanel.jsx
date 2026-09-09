import React, { useState, useCallback, useMemo, useRef } from 'react';
import ReactFlow, { Background, Controls, MarkerType, useNodesState, useEdgesState, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  LayoutDashboard, Gamepad2, Map, Compass, MapPin, Navigation, 
  Network, Rocket, Brain, Eye, Server, FolderTree, Settings, Activity, Sparkles
} from 'lucide-react';

// Neon styles for edges to mimic the futuristic infographic
const glowCyan = { stroke: '#00f2fe', strokeWidth: 3, filter: 'drop-shadow(0 0 8px rgba(0,242,254,0.8))' };
const glowPink = { stroke: '#fe0979', strokeWidth: 3, filter: 'drop-shadow(0 0 8px rgba(254,9,121,0.8))' };
const glowPurple = { stroke: '#b224ef', strokeWidth: 3, filter: 'drop-shadow(0 0 8px rgba(178,36,239,0.8))' };
const glowAmber = { stroke: '#ffb199', strokeWidth: 3, filter: 'drop-shadow(0 0 8px rgba(255,177,153,0.8))' };
const glowGreen = { stroke: '#10b981', strokeWidth: 3, filter: 'drop-shadow(0 0 8px rgba(16,185,129,0.8))' };

const NODE_INFO = [
  { id: 'dashboard', title: '1. Dashboard (Mission Control)', desc: 'The central hub for monitoring Swarmy. \n\n• Check the Top Bar for live ROS Core connection, CPU, RAM, and Battery Voltage.\n• View live telemetry, speed, and active mission status.\n• Use the HELP button on the top right anytime to launch the interactive overlay tour.', icon: <LayoutDashboard className="text-cyan-400" size={32} />, color: 'cyan' },
  { id: 'teleop', title: '2. Teleoperation (Manual Drive)', desc: 'Control the robot\'s physical movements manually.\n\n• Navigate to the "Teleoperation" panel.\n• Use the on-screen joystick or keyboard (WASD) to drive the chassis.\n• The panel streams direct cmd_vel commands to the hardware.', icon: <Gamepad2 className="text-blue-400" size={32} />, color: 'blue' },
  { id: 'map2d', title: '3. 2D Mapping (SLAM)', desc: 'Create a floor plan of your environment.\n\n• Open the "2D Mapping" panel.\n• Drive the robot manually using the joystick (or Teleop tab) around your facility.\n• The LiDAR sensor will gradually construct a live 2D map on the screen.\n• Once the entire area is mapped, click the "Save Map" button.', icon: <Map className="text-indigo-400" size={32} />, color: 'indigo' },
  { id: 'automap', title: 'Alternative: Auto Mapping', desc: 'Let the robot map the facility autonomously.\n\n• Open the "Auto Mapping" panel.\n• The robot uses Frontier Exploration algorithms to find unknown areas and drive to them automatically until the map is complete.', icon: <Compass className="text-teal-400" size={32} />, color: 'teal' },
  { id: 'planner', title: '4. Route Planner (Waypoints)', desc: 'Teach the robot specific locations.\n\n• Go to "Route Planner" and load your saved 2D map.\n• Click anywhere on the map to drop a coordinate pin (Waypoint).\n• Assign names to these pins (e.g., "Charging Dock", "Storage Room").', icon: <MapPin className="text-purple-400" size={32} />, color: 'purple' },
  { id: 'autonav', title: 'Alternative: Auto Navigation', desc: 'Send the robot to a single destination without a complex mission.\n\n• Open "Auto Navigation".\n• Click a point on the map, and the ROS Navigation Stack (move_base) will calculate a path and drive the robot there while avoiding dynamic obstacles.', icon: <Navigation className="text-fuchsia-400" size={32} />, color: 'fuchsia' },
  { id: 'studio', title: '5. Swarmy Studio (No-Code IDE)', desc: 'Program complex, autonomous workflows visually.\n\n• Open "Swarmy Studio".\n• Drag action nodes from the left menu (e.g., "Go to Waypoint", "Wait", "Speak", "Set Emotion").\n• Wire the nodes together to form a sequence or state machine.\n• Enter parameters (like selecting the "Dock" waypoint).', icon: <Network className="text-pink-400" size={32} />, color: 'pink' },
  { id: 'launcher', title: '6. Mission Launcher', desc: 'Execute your programmed workflows.\n\n• Open the "Mission Launcher" panel.\n• Select a compiled workflow (from Swarmy Studio) and the corresponding map.\n• Click Launch. Monitor the robot\'s real-time progression through the workflow steps.', icon: <Rocket className="text-rose-500" size={32} />, color: 'rose' },
  { id: 'ai', title: 'AI Assistant (Voice Control)', desc: 'Talk to your robot using Natural Language.\n\n• Open the "AI Assistant" panel.\n• Click the Microphone icon and speak (e.g., "Go to the kitchen and look happy").\n• The onboard LLM processes the speech, triggers the specific ROS actions, and responds with a synthesized voice.', icon: <Brain className="text-amber-400" size={32} />, color: 'amber' },
  { id: 'face', title: 'Robot Face (Emotions)', desc: 'Give the robot a personality.\n\n• Open the "Robot Face" panel to see the live rendering of the robot\'s digital eyes.\n• Emotions can be triggered manually here, or automatically via AI Voice interactions and Swarmy Studio nodes.', icon: <Eye className="text-orange-400" size={32} />, color: 'orange' },
  { id: 'opcua', title: 'OPC UA Interface (Factory PLC)', desc: 'Bridge the robot to industrial machinery.\n\n• Open the "OPC UA" panel.\n• Configure the server to expose robot states to external Siemens/Allen Bradley PLCs.\n• External machinery can read the robot\'s battery, position, and even trigger Swarmy Studio missions over the network.', icon: <Server className="text-red-400" size={32} />, color: 'red' },
  { id: 'dev', title: 'Workspace (IDE & Terminal)', desc: 'Tools for advanced developers and debugging.\n\n• Workspace IDE: A built-in code editor for modifying ROS scripts directly from the browser.\n• Web Terminal: Full SSH/Bash access to the Jetson Nano hardware.\n• All Launch Files: Edit and restart specific ROS launch configurations.', icon: <FolderTree className="text-slate-400" size={32} />, color: 'slate' },
  { id: 'rqt', title: 'ROS RQT Graph', desc: 'Visualize the ROS Core architecture.\n\n• Open "ROS RQT Graph" to see a live node-and-topic map of the underlying Robot Operating System.\n• Use this to verify that sensors (LiDAR, Camera) are actively publishing to the correct navigation nodes.', icon: <Activity className="text-slate-400" size={32} />, color: 'slate' },
  { id: 'sys', title: 'System Manager & Settings', desc: 'Manage hardware and configurations.\n\n• System Manager: View backend logs, restart the Node.js API, or completely reboot the ROS Core.\n• Settings: Configure network IP addresses, adjust robot velocity limits, and customize the AI voice parameters.', icon: <Settings className="text-slate-400" size={32} />, color: 'slate' }
];

const GuideNode = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 rounded-xl border flex items-center gap-4 w-72 backdrop-blur-md transition-all duration-300 shadow-2xl ${selected ? `border-${data.color}-400 shadow-[0_0_25px_var(--tw-shadow-color)] shadow-${data.color}-500/60 scale-105 z-50 bg-[#0a1224]` : 'border-slate-800 bg-[#050810]/95 hover:border-slate-600'}`}>
      
      {/* Node Input (Left) */}
      {data.id !== 'dashboard' && (
        <Handle type="target" position={Position.Left} className={`w-1 h-6 bg-slate-800 border-none rounded-r-md -ml-5 opacity-0`} />
      )}
      
      <div className={`flex-shrink-0 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-${data.color}-400 shadow-[0_0_15px_var(--tw-shadow-color)] shadow-${data.color}-500/30`}>
        {data.icon}
      </div>
      
      <div className="flex-1 text-left overflow-hidden">
        <div className={`text-[9px] font-bold tracking-[0.2em] mb-1 uppercase ${data.stepColor}`}>{data.step}</div>
        <div className="text-white font-bold font-['Rajdhani'] tracking-widest text-sm leading-tight truncate">{data.label}</div>
      </div>
      
      {/* Node Output (Right) */}
      <Handle type="source" position={Position.Right} className={`w-2 h-2 bg-${data.color}-400 border-none shadow-[0_0_10px_var(--tw-shadow-color)] shadow-${data.color}-500 -mr-5`} />
    </div>
  );
};

// Layout coordinates for a Left-to-Right spreading hierarchy (like Massive X)
const initialNodes = [
  // Level 0 (Root)
  { id: 'dashboard', type: 'guideNode', position: { x: 50, y: 400 }, data: { id: 'dashboard', step: 'SYSTEM CORE', stepColor: 'text-cyan-400', label: 'DASHBOARD', color: 'cyan', icon: <LayoutDashboard size={24} /> } },
  
  // Level 1
  { id: 'sys', type: 'guideNode', position: { x: 450, y: 150 }, data: { id: 'sys', step: 'CONFIG', stepColor: 'text-slate-400', label: 'SYSTEM & SETTINGS', color: 'slate', icon: <Settings size={24} /> } },
  { id: 'teleop', type: 'guideNode', position: { x: 450, y: 400 }, data: { id: 'teleop', step: 'MANUAL', stepColor: 'text-blue-400', label: 'TELEOPERATION', color: 'blue', icon: <Gamepad2 size={24} /> } },
  { id: 'ai', type: 'guideNode', position: { x: 450, y: 700 }, data: { id: 'ai', step: 'NATURAL LANGUAGE', stepColor: 'text-amber-400', label: 'AI ASSISTANT', color: 'amber', icon: <Brain size={24} /> } },
  
  // Level 2
  { id: 'dev', type: 'guideNode', position: { x: 850, y: 50 }, data: { id: 'dev', step: 'DEVELOPER', stepColor: 'text-purple-400', label: 'WORKSPACE IDE', color: 'purple', icon: <FolderTree size={24} /> } },
  { id: 'rqt', type: 'guideNode', position: { x: 850, y: 250 }, data: { id: 'rqt', step: 'DIAGNOSTICS', stepColor: 'text-purple-400', label: 'ROS RQT GRAPH', color: 'purple', icon: <Activity size={24} /> } },
  { id: 'map2d', type: 'guideNode', position: { x: 850, y: 400 }, data: { id: 'map2d', step: 'SCANNING', stepColor: 'text-indigo-400', label: '2D SLAM MAPPING', color: 'indigo', icon: <Map size={24} /> } },
  { id: 'face', type: 'guideNode', position: { x: 850, y: 700 }, data: { id: 'face', step: 'EXPRESSION', stepColor: 'text-orange-400', label: 'ROBOT FACE', color: 'orange', icon: <Eye size={24} /> } },
  
  // Level 3
  { id: 'automap', type: 'guideNode', position: { x: 1250, y: 250 }, data: { id: 'automap', step: 'AUTONOMOUS', stepColor: 'text-teal-400', label: 'AUTO MAPPING', color: 'teal', icon: <Compass size={24} /> } },
  { id: 'planner', type: 'guideNode', position: { x: 1250, y: 450 }, data: { id: 'planner', step: 'WAYPOINTS', stepColor: 'text-cyan-400', label: 'ROUTE PLANNER', color: 'cyan', icon: <MapPin size={24} /> } },
  
  // Level 4
  { id: 'autonav', type: 'guideNode', position: { x: 1650, y: 300 }, data: { id: 'autonav', step: 'AUTONOMOUS', stepColor: 'text-green-400', label: 'AUTO NAVIGATION', color: 'green', icon: <Navigation size={24} /> } },
  { id: 'studio', type: 'guideNode', position: { x: 1650, y: 550 }, data: { id: 'studio', step: 'NO-CODE LOGIC', stepColor: 'text-pink-400', label: 'SWARMY STUDIO', color: 'pink', icon: <Network size={24} /> } },
  
  // Level 5
  { id: 'launcher', type: 'guideNode', position: { x: 2050, y: 450 }, data: { id: 'launcher', step: 'EXECUTION', stepColor: 'text-rose-400', label: 'MISSION LAUNCHER', color: 'rose', icon: <Rocket size={24} /> } },
  { id: 'opcua', type: 'guideNode', position: { x: 2050, y: 650 }, data: { id: 'opcua', step: 'FACTORY BRIDGE', stepColor: 'text-red-400', label: 'OPC UA INTERFACE', color: 'red', icon: <Server size={24} /> } }
];

const initialEdges = [
  // To Level 1
  { id: 'e1', source: 'dashboard', target: 'sys', type: 'bezier', animated: true, style: glowPurple },
  { id: 'e2', source: 'dashboard', target: 'teleop', type: 'bezier', animated: true, style: glowCyan },
  { id: 'e3', source: 'dashboard', target: 'ai', type: 'bezier', animated: true, style: glowAmber },
  
  // To Level 2
  { id: 'e4', source: 'sys', target: 'dev', type: 'bezier', animated: true, style: glowPurple },
  { id: 'e5', source: 'sys', target: 'rqt', type: 'bezier', animated: true, style: glowPurple },
  { id: 'e6', source: 'teleop', target: 'map2d', type: 'bezier', animated: true, style: glowCyan },
  { id: 'e7', source: 'ai', target: 'face', type: 'bezier', animated: true, style: glowAmber },
  
  // To Level 3
  { id: 'e8', source: 'map2d', target: 'automap', type: 'bezier', animated: true, style: glowGreen },
  { id: 'e9', source: 'map2d', target: 'planner', type: 'bezier', animated: true, style: glowCyan },
  
  // To Level 4
  { id: 'e10', source: 'planner', target: 'autonav', type: 'bezier', animated: true, style: glowGreen },
  { id: 'e11', source: 'planner', target: 'studio', type: 'bezier', animated: true, style: glowPink },
  
  // To Level 5
  { id: 'e12', source: 'studio', target: 'launcher', type: 'bezier', animated: true, style: glowPink },
  { id: 'e13', source: 'studio', target: 'opcua', type: 'bezier', animated: true, style: glowPink },
];

export default function GuidePanel() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState('dashboard');

  const refs = useRef({});
  const nodeTypes = useMemo(() => ({ guideNode: GuideNode }), []);

  const onNodeClick = useCallback((event, node) => {
    setSelectedId(node.id);
    if (refs.current[node.id]) {
      refs.current[node.id].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="flex h-full bg-[#03050a] text-slate-300 font-['Rajdhani']">
      
      {/* LEFT: Massive Flowchart Canvas (Neon Cyberpunk Style) */}
      <div className="flex-1 relative h-[85vh]">
        <div className="absolute top-6 left-6 z-10 bg-[#0a1224]/80 p-5 rounded-2xl border border-cyan-900/50 shadow-[0_0_30px_rgba(0,242,254,0.15)] backdrop-blur-xl">
          <h1 className="text-2xl font-bold text-white flex items-center tracking-widest drop-shadow-[0_0_10px_rgba(0,242,254,0.8)]">
            <Sparkles className="mr-3 text-cyan-400" size={26} /> SWARMY OS
          </h1>
          <p className="text-cyan-400/80 text-xs mt-1 uppercase tracking-[0.3em] font-bold">Interactive Architecture Flow</p>
        </div>
        
        <ReactFlow
          nodes={nodes.map(n => ({...n, selected: n.id === selectedId}))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1}
          maxZoom={1.5}
          className="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0a1224] to-[#03050a]"
        >
          <Background color="#1e293b" gap={30} size={2} variant="dots" />
          <Controls className="bg-slate-900 border-slate-700 fill-cyan-400" />
        </ReactFlow>
      </div>

      {/* RIGHT: Comprehensive Detail Panel */}
      <div className="w-[500px] border-l border-cyan-900/30 bg-[#060a14] overflow-y-auto relative p-8 space-y-6" style={{ height: '85vh' }}>
        
        <div className="sticky top-0 bg-[#060a14]/95 backdrop-blur-xl py-4 z-20 border-b border-cyan-900/50 mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-cyan-400 tracking-[0.2em] uppercase drop-shadow-[0_0_5px_rgba(0,242,254,0.5)]">Operator Manual</h2>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse delay-75"></div>
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse delay-150"></div>
          </div>
        </div>

        {NODE_INFO.map((step) => {
          const isSelected = selectedId === step.id;
          return (
            <div 
              key={step.id} 
              ref={(el) => refs.current[step.id] = el}
              className={`p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${isSelected ? `bg-[#0a1224] border-${step.color}-400 shadow-[0_0_30px_var(--tw-shadow-color)] shadow-${step.color}-500/20` : 'border-slate-800/40 bg-[#080d1a] hover:border-slate-600/50'}`}
              onClick={() => setSelectedId(step.id)}
            >
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-xl bg-[#03050a] border ${isSelected ? `border-${step.color}-400 text-${step.color}-400 shadow-[0_0_15px_var(--tw-shadow-color)] shadow-${step.color}-500/40` : 'border-slate-800 text-slate-500'}`}>
                  {step.icon}
                </div>
                <div>
                  <h3 className={`text-xl font-bold tracking-widest mb-3 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {step.title}
                  </h3>
                  <div className="text-slate-400 leading-relaxed text-[15px] whitespace-pre-wrap font-sans">
                    {step.desc}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        <div className="h-32"></div>
      </div>

    </div>
  );
}
