import React, { useState, useCallback, useMemo, useRef } from 'react';
import ReactFlow, { Background, Controls, MarkerType, useNodesState, useEdgesState, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  LayoutDashboard, Gamepad2, Map, Compass, MapPin, Navigation, 
  Network, Rocket, Brain, Eye, Server, FolderTree, Settings, Activity, BookOpen
} from 'lucide-react';

const NODE_INFO = [
  {
    id: 'dashboard',
    title: '1. Dashboard (Mission Control)',
    desc: 'The central hub for monitoring Swarmy. \n\n• Check the Top Bar for live ROS Core connection, CPU, RAM, and Battery Voltage.\n• View live telemetry, speed, and active mission status.\n• Use the HELP button on the top right anytime to launch the interactive overlay tour.\n• Hit the Emergency Power button to safely shutdown the robot.',
    icon: <LayoutDashboard className="text-cyan-400" size={32} />,
    color: 'cyan'
  },
  {
    id: 'teleop',
    title: '2. Teleoperation (Manual Drive)',
    desc: 'Control the robot\'s physical movements manually.\n\n• Navigate to the "Teleoperation" panel.\n• Use the on-screen joystick or keyboard (WASD) to drive the chassis.\n• The panel streams direct cmd_vel commands to the hardware.\n• Use this to position the robot before starting a mapping sequence.',
    icon: <Gamepad2 className="text-blue-400" size={32} />,
    color: 'blue'
  },
  {
    id: 'map2d',
    title: '3. 2D Mapping (SLAM)',
    desc: 'Create a floor plan of your environment.\n\n• Open the "2D Mapping" panel.\n• Drive the robot manually using the joystick (or Teleop tab) around your facility.\n• The LiDAR sensor will gradually construct a live 2D map on the screen.\n• Once the entire area is mapped, click the "Save Map" button.',
    icon: <Map className="text-indigo-400" size={32} />,
    color: 'indigo'
  },
  {
    id: 'automap',
    title: 'Alternative: Auto Mapping',
    desc: 'Let the robot map the facility autonomously.\n\n• Open the "Auto Mapping" panel.\n• The robot uses Frontier Exploration algorithms to find unknown areas and drive to them automatically until the map is complete.',
    icon: <Compass className="text-teal-400" size={32} />,
    color: 'teal'
  },
  {
    id: 'planner',
    title: '4. Route Planner (Waypoints)',
    desc: 'Teach the robot specific locations.\n\n• Go to "Route Planner" and load your saved 2D map.\n• Click anywhere on the map to drop a coordinate pin (Waypoint).\n• Assign names to these pins (e.g., "Charging Dock", "Storage Room").\n• Save the waypoints so they can be referenced by Swarmy Studio or AI commands.',
    icon: <MapPin className="text-purple-400" size={32} />,
    color: 'purple'
  },
  {
    id: 'autonav',
    title: 'Alternative: Auto Navigation',
    desc: 'Send the robot to a single destination without a complex mission.\n\n• Open "Auto Navigation".\n• Click a point on the map, and the ROS Navigation Stack (move_base) will calculate a path and drive the robot there while avoiding dynamic obstacles.',
    icon: <Navigation className="text-fuchsia-400" size={32} />,
    color: 'fuchsia'
  },
  {
    id: 'studio',
    title: '5. Swarmy Studio (No-Code IDE)',
    desc: 'Program complex, autonomous workflows visually.\n\n• Open "Swarmy Studio".\n• Drag action nodes from the left menu (e.g., "Go to Waypoint", "Wait", "Speak", "Set Emotion").\n• Wire the nodes together to form a sequence or state machine.\n• Enter parameters (like selecting the "Dock" waypoint).\n• Click "Update & Compile" to save the workflow.',
    icon: <Network className="text-pink-400" size={32} />,
    color: 'pink'
  },
  {
    id: 'launcher',
    title: '6. Mission Launcher',
    desc: 'Execute your programmed workflows.\n\n• Open the "Mission Launcher" panel.\n• Select a compiled workflow (from Swarmy Studio) and the corresponding map.\n• Click Launch. Monitor the robot\'s real-time progression through the workflow steps.',
    icon: <Rocket className="text-green-400" size={32} />,
    color: 'green'
  },
  {
    id: 'ai',
    title: 'AI Assistant (Voice Control)',
    desc: 'Talk to your robot using Natural Language.\n\n• Open the "AI Assistant" panel.\n• Click the Microphone icon and speak (e.g., "Go to the kitchen and look happy").\n• The onboard LLM processes the speech, triggers the specific ROS actions, and responds with a synthesized voice.',
    icon: <Brain className="text-amber-400" size={32} />,
    color: 'amber'
  },
  {
    id: 'face',
    title: 'Robot Face (Emotions)',
    desc: 'Give the robot a personality.\n\n• Open the "Robot Face" panel to see the live rendering of the robot\'s digital eyes.\n• Emotions can be triggered manually here, or automatically via AI Voice interactions and Swarmy Studio nodes.',
    icon: <Eye className="text-orange-400" size={32} />,
    color: 'orange'
  },
  {
    id: 'opcua',
    title: 'OPC UA Interface (Factory PLC)',
    desc: 'Bridge the robot to industrial machinery.\n\n• Open the "OPC UA" panel.\n• Configure the server to expose robot states to external Siemens/Allen Bradley PLCs.\n• External machinery can read the robot\'s battery, position, and even trigger Swarmy Studio missions over the network.',
    icon: <Server className="text-rose-400" size={32} />,
    color: 'rose'
  },
  {
    id: 'dev',
    title: 'Development (IDE & Terminal)',
    desc: 'Tools for advanced developers and debugging.\n\n• Workspace IDE: A built-in code editor for modifying ROS scripts directly from the browser.\n• Web Terminal: Full SSH/Bash access to the Jetson Nano hardware.\n• All Launch Files: Edit and restart specific ROS launch configurations.',
    icon: <FolderTree className="text-slate-400" size={32} />,
    color: 'slate'
  },
  {
    id: 'rqt',
    title: 'ROS RQT Graph',
    desc: 'Visualize the ROS Core architecture.\n\n• Open "ROS RQT Graph" to see a live node-and-topic map of the underlying Robot Operating System.\n• Use this to verify that sensors (LiDAR, Camera) are actively publishing to the correct navigation nodes.',
    icon: <Activity className="text-slate-400" size={32} />,
    color: 'slate'
  },
  {
    id: 'sys',
    title: 'System Manager & Settings',
    desc: 'Manage hardware and configurations.\n\n• System Manager: View backend logs, restart the Node.js API, or completely reboot the ROS Core.\n• Settings: Configure network IP addresses, adjust robot velocity limits, and customize the AI voice parameters.',
    icon: <Settings className="text-slate-400" size={32} />,
    color: 'slate'
  }
];

const GuideNode = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-2xl rounded-xl border-2 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center w-60 transition-all duration-300 ${selected ? `border-${data.color}-400 shadow-[0_0_25px_var(--tw-shadow-color)] shadow-${data.color}-500/50 scale-105 z-50 relative` : `border-slate-700 hover:border-slate-500`}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500" />
      <div className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded bg-slate-800 mb-2 ${data.stepColor}`}>
        {data.step}
      </div>
      <div className={`p-3 rounded-full mb-2 border border-slate-700 ${data.iconBg}`}>
        {data.icon}
      </div>
      <div className="font-bold text-white font-['Rajdhani'] tracking-widest leading-tight">{data.label}</div>
      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">{data.sub}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500" />
      <Handle type="source" position={Position.Right} id="right" className="w-3 h-3 bg-slate-500" />
      <Handle type="target" position={Position.Left} id="left" className="w-3 h-3 bg-slate-500" />
    </div>
  );
};

const initialNodes = [
  // Core Spine
  { id: 'dashboard', type: 'guideNode', position: { x: 400, y: 50 }, data: { step: '1. OPERATIONS', stepColor: 'text-cyan-400', label: 'DASHBOARD', sub: 'Mission Control', color: 'cyan', iconBg: 'bg-cyan-950 text-cyan-400', icon: <LayoutDashboard size={24} /> } },
  { id: 'teleop', type: 'guideNode', position: { x: 400, y: 220 }, data: { step: '2. ROBOT INTERFACE', stepColor: 'text-blue-400', label: 'TELEOPERATION', sub: 'Manual Drive', color: 'blue', iconBg: 'bg-blue-950 text-blue-400', icon: <Gamepad2 size={24} /> } },
  { id: 'map2d', type: 'guideNode', position: { x: 400, y: 390 }, data: { step: '3. MAPPING & NAV', stepColor: 'text-indigo-400', label: '2D MAPPING (SLAM)', sub: 'Build Maps', color: 'indigo', iconBg: 'bg-indigo-950 text-indigo-400', icon: <Map size={24} /> } },
  { id: 'planner', type: 'guideNode', position: { x: 400, y: 560 }, data: { step: '4. MAPPING & NAV', stepColor: 'text-purple-400', label: 'ROUTE PLANNER', sub: 'Set Waypoints', color: 'purple', iconBg: 'bg-purple-950 text-purple-400', icon: <MapPin size={24} /> } },
  { id: 'studio', type: 'guideNode', position: { x: 400, y: 730 }, data: { step: '5. OPERATIONS', stepColor: 'text-pink-400', label: 'SWARMY STUDIO', sub: 'Build Mission', color: 'pink', iconBg: 'bg-pink-950 text-pink-400', icon: <Network size={24} /> } },
  { id: 'launcher', type: 'guideNode', position: { x: 400, y: 900 }, data: { step: '6. OPERATIONS', stepColor: 'text-green-400', label: 'MISSION LAUNCHER', sub: 'Execute', color: 'green', iconBg: 'bg-green-950 text-green-400', icon: <Rocket size={24} /> } },
  
  // Branches Right
  { id: 'automap', type: 'guideNode', position: { x: 750, y: 390 }, data: { step: 'MAPPING & NAV', stepColor: 'text-teal-400', label: 'AUTO MAPPING', sub: 'Autonomous Scan', color: 'teal', iconBg: 'bg-teal-950 text-teal-400', icon: <Compass size={24} /> } },
  { id: 'autonav', type: 'guideNode', position: { x: 750, y: 560 }, data: { step: 'MAPPING & NAV', stepColor: 'text-fuchsia-400', label: 'AUTO NAVIGATION', sub: 'Single Point Nav', color: 'fuchsia', iconBg: 'bg-fuchsia-950 text-fuchsia-400', icon: <Navigation size={24} /> } },
  { id: 'opcua', type: 'guideNode', position: { x: 750, y: 730 }, data: { step: 'MAPPING & NAV', stepColor: 'text-rose-400', label: 'OPC UA INTERFACE', sub: 'Factory PLCs', color: 'rose', iconBg: 'bg-rose-950 text-rose-400', icon: <Server size={24} /> } },
  
  // Branches Left
  { id: 'ai', type: 'guideNode', position: { x: 50, y: 220 }, data: { step: 'ROBOT INTERFACE', stepColor: 'text-amber-400', label: 'AI ASSISTANT', sub: 'Voice Control', color: 'amber', iconBg: 'bg-amber-950 text-amber-400', icon: <Brain size={24} /> } },
  { id: 'face', type: 'guideNode', position: { x: 50, y: 390 }, data: { step: 'ROBOT INTERFACE', stepColor: 'text-orange-400', label: 'ROBOT FACE', sub: 'Emotions', color: 'orange', iconBg: 'bg-orange-950 text-orange-400', icon: <Eye size={24} /> } },
  { id: 'dev', type: 'guideNode', position: { x: 50, y: 730 }, data: { step: 'DEVELOPMENT', stepColor: 'text-slate-400', label: 'IDE & TERMINAL', sub: 'Coding Tools', color: 'slate', iconBg: 'bg-slate-900 text-slate-400', icon: <FolderTree size={24} /> } },
  { id: 'rqt', type: 'guideNode', position: { x: 50, y: 840 }, data: { step: 'DEVELOPMENT', stepColor: 'text-slate-400', label: 'ROS RQT GRAPH', sub: 'Diagnostics', color: 'slate', iconBg: 'bg-slate-900 text-slate-400', icon: <Activity size={24} /> } },
  { id: 'sys', type: 'guideNode', position: { x: 50, y: 950 }, data: { step: 'SYSTEM', stepColor: 'text-slate-400', label: 'MANAGER & SETTINGS', sub: 'Configuration', color: 'slate', iconBg: 'bg-slate-900 text-slate-400', icon: <Settings size={24} /> } }
];

const initialEdges = [
  // Spine
  { id: 'e1', source: 'dashboard', target: 'teleop', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
  { id: 'e2', source: 'teleop', target: 'map2d', animated: true, style: { stroke: '#60a5fa', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' } },
  { id: 'e3', source: 'map2d', target: 'planner', animated: true, style: { stroke: '#818cf8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' } },
  { id: 'e4', source: 'planner', target: 'studio', animated: true, style: { stroke: '#c084fc', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#c084fc' } },
  { id: 'e5', source: 'studio', target: 'launcher', animated: true, style: { stroke: '#f472b6', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f472b6' } },
  
  // Right Branches
  { id: 'er1', source: 'map2d', sourceHandle: 'right', target: 'automap', targetHandle: 'left', animated: true, style: { stroke: '#2dd4bf', strokeWidth: 2, strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2dd4bf' } },
  { id: 'er2', source: 'planner', sourceHandle: 'right', target: 'autonav', targetHandle: 'left', animated: true, style: { stroke: '#e879f9', strokeWidth: 2, strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#e879f9' } },
  { id: 'er3', source: 'studio', sourceHandle: 'right', target: 'opcua', targetHandle: 'left', animated: true, style: { stroke: '#fb7185', strokeWidth: 2, strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#fb7185' } },
  
  // Left Branches
  { id: 'el1', source: 'teleop', sourceHandle: 'left', target: 'ai', targetHandle: 'right', animated: true, style: { stroke: '#fbbf24', strokeWidth: 2, strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24' } },
  { id: 'el2', source: 'ai', sourceHandle: 'bottom', target: 'face', targetHandle: 'top', animated: true, style: { stroke: '#fb923c', strokeWidth: 2, strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#fb923c' } },
  
  { id: 'el3', source: 'studio', sourceHandle: 'left', target: 'dev', targetHandle: 'right', animated: false, style: { stroke: '#64748b', strokeWidth: 1, strokeDasharray: '5 5' } },
  { id: 'el4', source: 'dev', sourceHandle: 'bottom', target: 'rqt', targetHandle: 'top', animated: false, style: { stroke: '#64748b', strokeWidth: 1, strokeDasharray: '5 5' } },
  { id: 'el5', source: 'rqt', sourceHandle: 'bottom', target: 'sys', targetHandle: 'top', animated: false, style: { stroke: '#64748b', strokeWidth: 1, strokeDasharray: '5 5' } },
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
    <div className="flex h-full bg-[#050810] text-slate-300 font-['Rajdhani']">
      
      {/* LEFT: Massive Flowchart Canvas */}
      <div className="flex-1 relative h-[85vh]">
        <div className="absolute top-6 left-6 z-10 bg-slate-950/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          <h1 className="text-2xl font-bold text-white flex items-center tracking-widest">
            <BookOpen className="mr-3 text-cyan-400" size={26} /> COMPLETE SYSTEM MANUAL
          </h1>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Comprehensive Interactive Panel Guide</p>
        </div>
        
        <ReactFlow
          nodes={nodes.map(n => ({...n, selected: n.id === selectedId}))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          minZoom={0.2}
          maxZoom={1.5}
          className="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-[#050810]"
        >
          <Background color="#334155" gap={25} size={1} />
          <Controls className="bg-slate-900 border-slate-700 fill-cyan-400" />
        </ReactFlow>
      </div>

      {/* RIGHT: Comprehensive Detail Panel */}
      <div className="w-[500px] border-l border-slate-800 bg-slate-950 overflow-y-auto relative p-8 space-y-8" style={{ height: '85vh' }}>
        
        <div className="sticky top-0 bg-slate-950/95 backdrop-blur-md py-4 z-20 border-b border-slate-800 mb-6">
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Comprehensive Instructions</h2>
        </div>

        {NODE_INFO.map((step) => {
          const isSelected = selectedId === step.id;
          return (
            <div 
              key={step.id} 
              ref={(el) => refs.current[step.id] = el}
              className={`p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${isSelected ? `bg-slate-900 border-${step.color}-500 shadow-[0_0_20px_var(--tw-shadow-color)] shadow-${step.color}-500/20` : 'border-slate-800/50 hover:border-slate-700'}`}
              onClick={() => setSelectedId(step.id)}
            >
              <div className="flex items-start gap-5">
                <div className={`p-4 rounded-xl border border-slate-700 bg-slate-950 ${isSelected ? `text-${step.color}-400 shadow-[0_0_15px_var(--tw-shadow-color)] shadow-${step.color}-500/30` : 'text-slate-500'}`}>
                  {step.icon}
                </div>
                <div>
                  <h3 className={`text-xl font-bold tracking-widest mb-3 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {step.title}
                  </h3>
                  <div className="text-slate-300 leading-relaxed text-[15px] whitespace-pre-wrap">
                    {step.desc}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Decorative Space */}
        <div className="h-32"></div>
      </div>

    </div>
  );
}
