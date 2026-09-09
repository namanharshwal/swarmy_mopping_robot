import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, { Background, Controls, MarkerType, useNodesState, useEdgesState, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import { Power, Map, MapPin, Network, PlayCircle, Mic, ShieldCheck, Zap, BookOpen } from 'lucide-react';

const NODE_INFO = [
  {
    id: 'boot',
    title: 'Step 1: Power & Connect',
    desc: 'Start by turning on the Swarmy Robot hardware. Once booted, open this web dashboard. Check the top bar indicators to ensure ROS Core is online, CPU is stable, and battery voltage is healthy.',
    icon: <Power className="text-slate-400" size={32} />,
    color: 'slate'
  },
  {
    id: 'map',
    title: 'Step 2: SLAM Mapping',
    desc: 'Navigate to the "Teleoperation" tab. Use the joystick to manually drive the robot around your facility. As you drive, the robot uses its LiDAR to build a live 2D SLAM map. Once the area is fully scanned, save the map.',
    icon: <Map className="text-blue-400" size={32} />,
    color: 'blue'
  },
  {
    id: 'waypoints',
    title: 'Step 3: Set Waypoints',
    desc: 'Go to the "Route Planner" tab. Click on your newly saved 2D floor plan to drop coordinate pins. Name these waypoints (e.g., "Dock", "Station A") so the robot knows exactly where these locations are.',
    icon: <MapPin className="text-indigo-400" size={32} />,
    color: 'indigo'
  },
  {
    id: 'studio',
    title: 'Step 4: Build Mission',
    desc: 'Open "Swarmy Studio". Drag and drop action nodes (like "Go To Waypoint", "Wait", or "Speak") onto the canvas. Wire them together to create a fully autonomous, complex workflow without writing any code.',
    icon: <Network className="text-purple-400" size={32} />,
    color: 'purple'
  },
  {
    id: 'run',
    title: 'Step 5: Execute & Monitor',
    desc: 'Click "Update & Run" in Swarmy Studio, or trigger the mission from the Dashboard. Switch to the live map to monitor the robot as it autonomously executes your programmed workflow.',
    icon: <PlayCircle className="text-green-400" size={32} />,
    color: 'green'
  },
  {
    id: 'voice',
    title: 'Alternative: AI Voice Control',
    desc: 'Don\'t want to build a manual workflow? Navigate to the "AI Assistant" tab, press the microphone, and speak naturally (e.g., "Swarmy, go to the dock"). The onboard LLM will translate your voice directly into robot actions.',
    icon: <Mic className="text-amber-400" size={32} />,
    color: 'amber'
  },
  {
    id: 'opcua',
    title: 'Advanced: OPC UA Integration',
    desc: 'For industrial factory environments, connect your PLCs (Programmable Logic Controllers) to Swarmy\'s OPC UA Server. Your factory machinery can now read robot states or trigger autonomous missions over the local network.',
    icon: <ShieldCheck className="text-pink-400" size={32} />,
    color: 'pink'
  }
];

const GuideNode = ({ data, selected }) => {
  return (
    <div className={`px-4 py-3 shadow-2xl rounded-xl border-2 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-center w-56 transition-all duration-300 ${selected ? `border-${data.color}-400 shadow-[0_0_25px_var(--tw-shadow-color)] shadow-${data.color}-500/50 scale-105` : `border-slate-700 hover:border-slate-500`}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-500" />
      <div className={`text-[10px] font-bold tracking-widest px-2 py-0.5 rounded bg-slate-800 mb-2 ${data.stepColor}`}>
        {data.step}
      </div>
      <div className={`p-3 rounded-full mb-2 border border-slate-700 ${data.iconBg}`}>
        {data.icon}
      </div>
      <div className="font-bold text-white font-['Rajdhani'] tracking-widest">{data.label}</div>
      <div className="text-xs text-slate-400 mt-1 uppercase tracking-widest">{data.sub}</div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-500" />
      <Handle type="source" position={Position.Right} id="right" className="w-3 h-3 bg-slate-500" />
      <Handle type="target" position={Position.Left} id="left" className="w-3 h-3 bg-slate-500" />
    </div>
  );
};

const initialNodes = [
  { id: 'boot', type: 'guideNode', position: { x: 250, y: 50 }, data: { step: 'STEP 1', stepColor: 'text-slate-400', label: 'POWER & CONNECT', sub: 'Dashboard Vitals', color: 'slate', iconBg: 'bg-slate-900 text-slate-400', icon: <Power size={24} /> } },
  { id: 'map', type: 'guideNode', position: { x: 250, y: 220 }, data: { step: 'STEP 2', stepColor: 'text-blue-400', label: 'SLAM MAPPING', sub: 'Teleoperation', color: 'blue', iconBg: 'bg-blue-950 text-blue-400', icon: <Map size={24} /> } },
  { id: 'waypoints', type: 'guideNode', position: { x: 250, y: 390 }, data: { step: 'STEP 3', stepColor: 'text-indigo-400', label: 'SET WAYPOINTS', sub: 'Route Planner', color: 'indigo', iconBg: 'bg-indigo-950 text-indigo-400', icon: <MapPin size={24} /> } },
  { id: 'studio', type: 'guideNode', position: { x: 250, y: 560 }, data: { step: 'STEP 4', stepColor: 'text-purple-400', label: 'BUILD MISSION', sub: 'Swarmy Studio', color: 'purple', iconBg: 'bg-purple-950 text-purple-400', icon: <Network size={24} /> } },
  { id: 'run', type: 'guideNode', position: { x: 250, y: 730 }, data: { step: 'STEP 5', stepColor: 'text-green-400', label: 'EXECUTE MISSION', sub: 'Autonomy Live', color: 'green', iconBg: 'bg-green-950 text-green-400', icon: <PlayCircle size={24} /> } },
  { id: 'voice', type: 'guideNode', position: { x: 600, y: 130 }, data: { step: 'ALTERNATIVE', stepColor: 'text-amber-400', label: 'AI VOICE CONTROL', sub: 'Natural Language', color: 'amber', iconBg: 'bg-amber-950 text-amber-400', icon: <Mic size={24} /> } },
  { id: 'opcua', type: 'guideNode', position: { x: 600, y: 560 }, data: { step: 'ADVANCED', stepColor: 'text-pink-400', label: 'OPC UA PLCs', sub: 'Factory Integration', color: 'pink', iconBg: 'bg-pink-950 text-pink-400', icon: <ShieldCheck size={24} /> } }
];

const initialEdges = [
  { id: 'e1', source: 'boot', target: 'map', animated: true, style: { stroke: '#94a3b8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' } },
  { id: 'e2', source: 'map', target: 'waypoints', animated: true, style: { stroke: '#60a5fa', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' } },
  { id: 'e3', source: 'waypoints', target: 'studio', animated: true, style: { stroke: '#818cf8', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#818cf8' } },
  { id: 'e4', source: 'studio', target: 'run', animated: true, style: { stroke: '#c084fc', strokeWidth: 3 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#c084fc' } },
  { id: 'e-voice', source: 'boot', sourceHandle: 'right', target: 'voice', targetHandle: 'left', animated: true, style: { stroke: '#fbbf24', strokeWidth: 2, strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24' } },
  { id: 'e-voice-run', source: 'voice', sourceHandle: 'bottom', target: 'run', targetHandle: 'right', animated: true, style: { stroke: '#fbbf24', strokeWidth: 2, strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#fbbf24' } },
  { id: 'e-opcua', source: 'opcua', sourceHandle: 'left', target: 'studio', targetHandle: 'right', animated: true, style: { stroke: '#f472b6', strokeWidth: 2, strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#f472b6' } }
];

export default function GuidePanel() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState('boot');

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
      
      {/* LEFT: Flowchart Canvas */}
      <div className="flex-1 relative h-[85vh]">
        <div className="absolute top-6 left-6 z-10 bg-slate-950/90 p-5 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
          <h1 className="text-2xl font-bold text-white flex items-center tracking-widest">
            <BookOpen className="mr-3 text-cyan-400" size={26} /> OPERATOR'S MANUAL
          </h1>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-bold">Interactive Step-by-Step Workflow</p>
        </div>
        
        <ReactFlow
          nodes={nodes.map(n => ({...n, selected: n.id === selectedId}))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-[#050810]"
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls className="bg-slate-900 border-slate-700 fill-cyan-400" />
        </ReactFlow>
      </div>

      {/* RIGHT: Detail Panel with ALL steps visible */}
      <div className="w-[450px] border-l border-slate-800 bg-slate-950 overflow-y-auto relative p-6 space-y-6" style={{ height: '85vh' }}>
        
        <div className="sticky top-0 bg-slate-950/90 backdrop-blur-md py-4 z-20 border-b border-slate-800 mb-6">
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Complete Guide</h2>
        </div>

        {NODE_INFO.map((step) => {
          const isSelected = selectedId === step.id;
          return (
            <div 
              key={step.id} 
              ref={(el) => refs.current[step.id] = el}
              className={`p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${isSelected ? `bg-slate-900 border-${step.color}-500 shadow-[0_0_20px_var(--tw-shadow-color)] shadow-${step.color}-500/20` : 'border-slate-800 hover:border-slate-700'}`}
              onClick={() => setSelectedId(step.id)}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl border border-slate-700 bg-slate-950 ${isSelected ? `text-${step.color}-400` : 'text-slate-500'}`}>
                  {step.icon}
                </div>
                <div>
                  <h3 className={`text-xl font-bold tracking-widest mb-2 ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {step.title}
                  </h3>
                  <p className="text-slate-400 leading-relaxed text-sm">
                    {step.desc}
                  </p>
                </div>
              </div>
            </div>
          )
        })}

      </div>

    </div>
  );
}
