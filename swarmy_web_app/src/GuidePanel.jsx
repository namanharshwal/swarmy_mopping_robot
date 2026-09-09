import React, { useState, useCallback, useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType, useNodesState, useEdgesState, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { MonitorSmartphone, Server, Database, Cpu, Network, Brain, PlayCircle, ShieldCheck, Zap } from 'lucide-react';

// NODE INFO DIRECTORY
const NODE_INFO = {
  'dashboard': {
    title: 'Dashboard (React UI)',
    desc: 'The main user interface. It communicates via WebSocket to receive live telemetry (CPU, RAM, Battery) from the robot and sends manual teleop commands.',
    icon: <MonitorSmartphone className="text-blue-400" size={40} />
  },
  'studio': {
    title: 'Swarmy Studio',
    desc: 'A visual state machine builder. You drag and drop tasks, which are compiled into a JSON workflow file and sent to the Node.js API to execute autonomous missions.',
    icon: <Network className="text-purple-400" size={40} />
  },
  'ai': {
    title: 'AI Assistant',
    desc: 'The voice interface. Transcribes speech, processes it through a local LLM, and triggers robot emotions or executes ROS physical commands.',
    icon: <Brain className="text-amber-400" size={40} />
  },
  'api': {
    title: 'Node.js Middleware',
    desc: 'The central hub. It parses web requests, manages the SQLite database, and acts as a bridge communicating with ROS via rosbridge_websocket.',
    icon: <Server className="text-indigo-400" size={40} />
  },
  'opcua': {
    title: 'OPC UA Interface',
    desc: 'Industrial protocol bridge. It allows factory PLCs (Siemens, Allen Bradley) to trigger Swarmy workflows remotely using standard industrial tags.',
    icon: <ShieldCheck className="text-pink-400" size={40} />
  },
  'ros': {
    title: 'ROS Core Engine',
    desc: 'The Robot Operating System. Runs the Navigation Stack (move_base), SLAM mapping, and calculates velocity commands to avoid obstacles.',
    icon: <Database className="text-green-400" size={40} />
  },
  'hardware': {
    title: 'Physical Hardware',
    desc: 'Jetson Nano receives cmd_vel topics from ROS and sends serial PWM signals to the Arduino Mega, which actuates the servo motors and reads LiDAR data.',
    icon: <Cpu className="text-rose-400" size={40} />
  }
};

// CUSTOM NODE COMPONENT
const SystemNode = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-2xl rounded-xl border-2 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-center w-52 transition-all duration-300 ${selected ? 'border-cyan-400 shadow-[0_0_20px_#22d3ee] scale-105' : 'border-slate-700 hover:border-slate-500'}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500" />
      
      <div className={`p-3 rounded-full mb-2 border border-slate-700 ${data.colorClass}`}>
        {data.icon}
      </div>
      <div className="font-bold text-white font-['Rajdhani'] tracking-widest">{data.label}</div>
      <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{data.sub}</div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500" />
    </div>
  );
};

const initialNodes = [
  // UI Layer
  { id: 'dashboard', type: 'systemNode', position: { x: 50, y: 50 }, data: { label: 'DASHBOARD', sub: 'React Web UI', colorClass: 'bg-blue-950 text-blue-400', icon: <MonitorSmartphone size={24} /> } },
  { id: 'studio', type: 'systemNode', position: { x: 300, y: 50 }, data: { label: 'SWARMY STUDIO', sub: 'Visual Logic', colorClass: 'bg-purple-950 text-purple-400', icon: <Network size={24} /> } },
  { id: 'ai', type: 'systemNode', position: { x: 550, y: 50 }, data: { label: 'AI ASSISTANT', sub: 'Voice NLP', colorClass: 'bg-amber-950 text-amber-400', icon: <Brain size={24} /> } },
  
  // Middleware Layer
  { id: 'api', type: 'systemNode', position: { x: 175, y: 250 }, data: { label: 'NODE.JS API', sub: 'Express / WS', colorClass: 'bg-indigo-950 text-indigo-400', icon: <Server size={24} /> } },
  { id: 'opcua', type: 'systemNode', position: { x: 425, y: 250 }, data: { label: 'OPC UA SERVER', sub: 'PLC Bridge', colorClass: 'bg-pink-950 text-pink-400', icon: <ShieldCheck size={24} /> } },

  // ROS Layer
  { id: 'ros', type: 'systemNode', position: { x: 300, y: 450 }, data: { label: 'ROS CORE', sub: 'Navigation Stack', colorClass: 'bg-green-950 text-green-400', icon: <Database size={24} /> } },

  // Hardware Layer
  { id: 'hardware', type: 'systemNode', position: { x: 300, y: 650 }, data: { label: 'HARDWARE EDGE', sub: 'Jetson & Arduino', colorClass: 'bg-rose-950 text-rose-400', icon: <Cpu size={24} /> } }
];

const initialEdges = [
  { id: 'e-dash-api', source: 'dashboard', target: 'api', animated: true, style: { stroke: '#60a5fa', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' } },
  { id: 'e-studio-api', source: 'studio', target: 'api', animated: true, style: { stroke: '#c084fc', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#c084fc' } },
  { id: 'e-ai-api', source: 'ai', target: 'api', animated: true, style: { stroke: '#fbbf24', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24' } },
  
  { id: 'e-api-ros', source: 'api', target: 'ros', animated: true, style: { stroke: '#818cf8', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' } },
  
  { id: 'e-studio-opcua', source: 'studio', target: 'opcua', animated: true, style: { stroke: '#f472b6', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f472b6' } },
  { id: 'e-opcua-ros', source: 'opcua', target: 'ros', animated: true, style: { stroke: '#f472b6', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f472b6' } },

  { id: 'e-ros-hardware', source: 'ros', target: 'hardware', animated: true, style: { stroke: '#4ade80', strokeWidth: 4 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#4ade80' } }
];

export default function GuidePanel() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);

  const nodeTypes = useMemo(() => ({ systemNode: SystemNode }), []);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(NODE_INFO[node.id]);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="flex h-full bg-[#050810] text-slate-300 font-['Rajdhani']">
      
      {/* LEFT: Flowchart Canvas */}
      <div className="flex-1 relative h-full">
        <div className="absolute top-6 left-6 z-10 bg-slate-950/80 p-4 rounded-xl border border-slate-800 shadow-xl backdrop-blur-md">
          <h1 className="text-2xl font-bold text-white flex items-center tracking-widest">
            <Zap className="mr-3 text-cyan-400" size={24} /> SYSTEM FLOWCHART
          </h1>
          <p className="text-slate-400 text-sm mt-1">Interactive System Architecture Map</p>
        </div>
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-[#050810]"
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls className="bg-slate-900 border-slate-700 fill-cyan-400" />
        </ReactFlow>
      </div>

      {/* RIGHT: Detail Panel */}
      <div className="w-[400px] border-l border-slate-800 bg-slate-950 p-8 flex flex-col relative overflow-hidden">
        {selectedNode ? (
          <div className="animate-fade-in relative z-10">
            <div className="mb-6">
              {selectedNode.icon}
            </div>
            <h2 className="text-3xl font-bold text-white tracking-widest mb-4 border-b border-slate-800 pb-4">
              {selectedNode.title}
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              {selectedNode.desc}
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50 relative z-10">
            <PlayCircle size={64} className="text-slate-600 mb-4" />
            <p className="text-xl tracking-widest text-slate-500 font-bold">CLICK ANY NODE</p>
            <p className="text-slate-500 mt-2">to view system flow details</p>
          </div>
        )}
        
        {/* Background Decorative Graphic */}
        <div className="absolute bottom-0 right-0 opacity-5 pointer-events-none">
          <Network size={300} />
        </div>
      </div>

    </div>
  );
}
