import React, { useState, useCallback, useMemo, useRef } from 'react';
import ReactFlow, { Background, Controls, useNodesState, useEdgesState, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';
import {
  LayoutDashboard, Gamepad2, Map, Compass, MapPin, Navigation,
  Network, Rocket, Brain, Eye, Server, FolderTree, Settings, Activity, Sparkles
} from 'lucide-react';

/* ── colour palette (matches project CSS vars) ── */
const C = {
  bg:       '#05050a',
  panelBg:  'rgba(10,15,30,0.85)',
  cyan:     '#00f3ff',
  pink:     '#fe0979',
  purple:   '#bd00ff',
  amber:    '#ffb199',
  green:    '#10b981',
  text:     '#e2e8f0',
  muted:    '#8b949e',
  border:   'rgba(0,243,255,0.2)',
  nodeBg:   'rgba(8,12,26,0.95)',
};

/* ── Edge glow helpers ── */
const glow = (color) => ({
  stroke: color, strokeWidth: 3,
  filter: `drop-shadow(0 0 6px ${color})`
});

/* ── per-node metadata ── */
const NODE_INFO = [
  { id:'dashboard',  title:'1. Dashboard (Mission Control)',  color:C.cyan,   icon:'LayoutDashboard', desc:'The central hub for monitoring Swarmy.\n\n• Check the Top Bar for live ROS Core connection, CPU, RAM, and Battery Voltage.\n• View live telemetry, speed, and active mission status.\n• Use the HELP button on the top right anytime to launch the interactive overlay tour.' },
  { id:'teleop',     title:'2. Teleoperation (Manual Drive)',  color:'#3b82f6', icon:'Gamepad2',        desc:'Control the robot\'s physical movements manually.\n\n• Navigate to the "Teleoperation" panel.\n• Use the on-screen joystick or keyboard (WASD) to drive the chassis.\n• The panel streams direct cmd_vel commands to the hardware.' },
  { id:'map2d',      title:'3. 2D Mapping (SLAM)',             color:'#818cf8', icon:'Map',             desc:'Create a floor plan of your environment.\n\n• Open the "2D Mapping" panel.\n• Drive the robot manually using the joystick around your facility.\n• The LiDAR sensor will gradually construct a live 2D map on the screen.\n• Once the entire area is mapped, click the "Save Map" button.' },
  { id:'automap',    title:'Alternative: Auto Mapping',        color:'#2dd4bf', icon:'Compass',         desc:'Let the robot map the facility autonomously.\n\n• Open the "Auto Mapping" panel.\n• The robot uses Frontier Exploration algorithms to find unknown areas and drive to them automatically until the map is complete.' },
  { id:'planner',    title:'4. Route Planner (Waypoints)',     color:C.purple, icon:'MapPin',          desc:'Teach the robot specific locations.\n\n• Go to "Route Planner" and load your saved 2D map.\n• Click anywhere on the map to drop a coordinate pin (Waypoint).\n• Assign names to these pins (e.g., "Charging Dock", "Storage Room").' },
  { id:'autonav',    title:'Alternative: Auto Navigation',     color:C.green,  icon:'Navigation',      desc:'Send the robot to a single destination without a complex mission.\n\n• Open "Auto Navigation".\n• Click a point on the map, and the ROS Navigation Stack (move_base) will calculate a path and drive the robot there while avoiding dynamic obstacles.' },
  { id:'studio',     title:'5. Swarmy Studio (No-Code IDE)',   color:C.pink,   icon:'Network',         desc:'Program complex, autonomous workflows visually.\n\n• Open "Swarmy Studio".\n• Drag action nodes from the left menu (e.g., "Go to Waypoint", "Wait", "Speak", "Set Emotion").\n• Wire the nodes together to form a sequence or state machine.\n• Enter parameters (like selecting the "Dock" waypoint).' },
  { id:'launcher',   title:'6. Mission Launcher',              color:'#f43f5e', icon:'Rocket',          desc:'Execute your programmed workflows.\n\n• Open the "Mission Launcher" panel.\n• Select a compiled workflow (from Swarmy Studio) and the corresponding map.\n• Click Launch. Monitor the robot\'s real-time progression through the workflow steps.' },
  { id:'ai',         title:'AI Assistant (Voice Control)',      color:C.amber,  icon:'Brain',           desc:'Talk to your robot using Natural Language.\n\n• Open the "AI Assistant" panel.\n• Click the Microphone icon and speak (e.g., "Go to the kitchen and look happy").\n• The onboard LLM processes the speech, triggers the specific ROS actions, and responds with a synthesized voice.' },
  { id:'face',       title:'Robot Face (Emotions)',             color:'#fb923c', icon:'Eye',             desc:'Give the robot a personality.\n\n• Open the "Robot Face" panel to see the live rendering of the robot\'s digital eyes.\n• Emotions can be triggered manually here, or automatically via AI Voice interactions and Swarmy Studio nodes.' },
  { id:'opcua',      title:'OPC UA Interface (Factory PLC)',    color:'#ef4444', icon:'Server',          desc:'Bridge the robot to industrial machinery.\n\n• Open the "OPC UA" panel.\n• Configure the server to expose robot states to external Siemens/Allen Bradley PLCs.\n• External machinery can read the robot\'s battery, position, and even trigger Swarmy Studio missions over the network.' },
  { id:'dev',        title:'Workspace (IDE & Terminal)',        color:'#94a3b8', icon:'FolderTree',      desc:'Tools for advanced developers and debugging.\n\n• Workspace IDE: A built-in code editor for modifying ROS scripts directly from the browser.\n• Web Terminal: Full SSH/Bash access to the Jetson Nano hardware.\n• All Launch Files: Edit and restart specific ROS launch configurations.' },
  { id:'rqt',        title:'ROS RQT Graph',                    color:'#94a3b8', icon:'Activity',        desc:'Visualize the ROS Core architecture.\n\n• Open "ROS RQT Graph" to see a live node-and-topic map of the underlying Robot Operating System.\n• Use this to verify that sensors (LiDAR, Camera) are actively publishing to the correct navigation nodes.' },
  { id:'sys',        title:'System Manager & Settings',         color:'#94a3b8', icon:'Settings',        desc:'Manage hardware and configurations.\n\n• System Manager: View backend logs, restart the Node.js API, or completely reboot the ROS Core.\n• Settings: Configure network IP addresses, adjust robot velocity limits, and customize the AI voice parameters.' },
];

const ICONS = { LayoutDashboard, Gamepad2, Map, Compass, MapPin, Navigation, Network, Rocket, Brain, Eye, Server, FolderTree, Activity, Settings };

/* ── Custom Node (pure inline styles) ── */
const GuideNode = ({ data, selected }) => {
  const Icon = ICONS[data.iconName];
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:14, width:280, padding:'12px 16px',
      borderRadius:14, border:`2px solid ${selected ? data.color : 'rgba(255,255,255,0.08)'}`,
      background: selected ? 'rgba(10,15,30,0.95)' : C.nodeBg,
      boxShadow: selected ? `0 0 25px ${data.color}44, 0 0 60px ${data.color}22` : '0 4px 20px rgba(0,0,0,0.4)',
      transition:'all 0.3s ease', transform: selected ? 'scale(1.04)' : 'scale(1)',
      cursor:'pointer', position:'relative',
    }}>
      {data.id !== 'dashboard' && (
        <Handle type="target" position={Position.Left}
          style={{ width:2, height:20, background:'transparent', border:'none', left:-4 }} />
      )}

      <div style={{
        flexShrink:0, padding:10, borderRadius:10,
        background:'rgba(5,5,10,0.8)',
        border:`1px solid ${selected ? data.color : 'rgba(255,255,255,0.1)'}`,
        boxShadow: selected ? `0 0 12px ${data.color}55` : 'none',
        color: data.color, display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {Icon && <Icon size={22} />}
      </div>

      <div style={{ flex:1, overflow:'hidden' }}>
        <div style={{
          fontSize:9, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase',
          color: data.color, marginBottom:3, fontFamily:'monospace',
        }}>{data.step}</div>
        <div style={{
          color:'#fff', fontWeight:700, fontSize:13, letterSpacing:'0.08em',
          whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
        }}>{data.label}</div>
      </div>

      <Handle type="source" position={Position.Right}
        style={{ width:8, height:8, background:data.color, border:'none',
          boxShadow:`0 0 8px ${data.color}`, right:-6, borderRadius:'50%' }} />
    </div>
  );
};

/* ── Node positions (left-to-right branching tree) ── */
const initialNodes = [
  { id:'dashboard', type:'guideNode', position:{x:50,y:380},  data:{id:'dashboard', step:'SYSTEM CORE',     label:'DASHBOARD',        color:C.cyan,   iconName:'LayoutDashboard'} },
  { id:'sys',       type:'guideNode', position:{x:440,y:100}, data:{id:'sys',       step:'CONFIG',          label:'SYSTEM & SETTINGS', color:'#94a3b8', iconName:'Settings'} },
  { id:'teleop',    type:'guideNode', position:{x:440,y:380}, data:{id:'teleop',    step:'MANUAL CONTROL',  label:'TELEOPERATION',     color:'#3b82f6', iconName:'Gamepad2'} },
  { id:'ai',        type:'guideNode', position:{x:440,y:660}, data:{id:'ai',        step:'NATURAL LANGUAGE', label:'AI ASSISTANT',      color:C.amber,  iconName:'Brain'} },
  { id:'dev',       type:'guideNode', position:{x:830,y:30},  data:{id:'dev',       step:'DEVELOPER',       label:'WORKSPACE IDE',     color:'#94a3b8', iconName:'FolderTree'} },
  { id:'rqt',       type:'guideNode', position:{x:830,y:200}, data:{id:'rqt',       step:'DIAGNOSTICS',     label:'ROS RQT GRAPH',     color:'#94a3b8', iconName:'Activity'} },
  { id:'map2d',     type:'guideNode', position:{x:830,y:380}, data:{id:'map2d',     step:'SCANNING',        label:'2D SLAM MAPPING',   color:'#818cf8', iconName:'Map'} },
  { id:'face',      type:'guideNode', position:{x:830,y:660}, data:{id:'face',      step:'EXPRESSION',      label:'ROBOT FACE',        color:'#fb923c', iconName:'Eye'} },
  { id:'automap',   type:'guideNode', position:{x:1220,y:230},data:{id:'automap',   step:'AUTONOMOUS',      label:'AUTO MAPPING',      color:'#2dd4bf', iconName:'Compass'} },
  { id:'planner',   type:'guideNode', position:{x:1220,y:430},data:{id:'planner',   step:'WAYPOINTS',       label:'ROUTE PLANNER',     color:C.purple, iconName:'MapPin'} },
  { id:'autonav',   type:'guideNode', position:{x:1610,y:280},data:{id:'autonav',   step:'AUTONOMOUS',      label:'AUTO NAVIGATION',   color:C.green,  iconName:'Navigation'} },
  { id:'studio',    type:'guideNode', position:{x:1610,y:500},data:{id:'studio',    step:'NO-CODE LOGIC',   label:'SWARMY STUDIO',     color:C.pink,   iconName:'Network'} },
  { id:'launcher',  type:'guideNode', position:{x:2000,y:400},data:{id:'launcher',  step:'EXECUTION',       label:'MISSION LAUNCHER',  color:'#f43f5e', iconName:'Rocket'} },
  { id:'opcua',     type:'guideNode', position:{x:2000,y:600},data:{id:'opcua',     step:'FACTORY BRIDGE',  label:'OPC UA INTERFACE',  color:'#ef4444', iconName:'Server'} },
];

const initialEdges = [
  { id:'e1',  source:'dashboard', target:'sys',     type:'default', animated:true, style:glow(C.purple) },
  { id:'e2',  source:'dashboard', target:'teleop',  type:'default', animated:true, style:glow(C.cyan) },
  { id:'e3',  source:'dashboard', target:'ai',      type:'default', animated:true, style:glow(C.amber) },
  { id:'e4',  source:'sys',       target:'dev',     type:'default', animated:true, style:glow(C.purple) },
  { id:'e5',  source:'sys',       target:'rqt',     type:'default', animated:true, style:glow(C.purple) },
  { id:'e6',  source:'teleop',    target:'map2d',   type:'default', animated:true, style:glow(C.cyan) },
  { id:'e7',  source:'ai',        target:'face',    type:'default', animated:true, style:glow(C.amber) },
  { id:'e8',  source:'map2d',     target:'automap', type:'default', animated:true, style:glow(C.green) },
  { id:'e9',  source:'map2d',     target:'planner', type:'default', animated:true, style:glow(C.cyan) },
  { id:'e10', source:'planner',   target:'autonav', type:'default', animated:true, style:glow(C.green) },
  { id:'e11', source:'planner',   target:'studio',  type:'default', animated:true, style:glow(C.pink) },
  { id:'e12', source:'studio',    target:'launcher',type:'default', animated:true, style:glow(C.pink) },
  { id:'e13', source:'studio',    target:'opcua',   type:'default', animated:true, style:glow(C.pink) },
];

/* ── Inject custom CSS for ReactFlow animated edges and scrollbar ── */
const CUSTOM_CSS = `
  .guide-flow .react-flow__edge-path { stroke-linecap: round; }
  .guide-flow .react-flow__controls { background: rgba(10,15,30,0.9); border: 1px solid rgba(0,243,255,0.2); border-radius: 10px; }
  .guide-flow .react-flow__controls button { background: transparent; border-bottom: 1px solid rgba(255,255,255,0.1); color: #00f3ff; fill: #00f3ff; }
  .guide-flow .react-flow__controls button:hover { background: rgba(0,243,255,0.15); }
  .guide-detail::-webkit-scrollbar { width: 6px; }
  .guide-detail::-webkit-scrollbar-thumb { background: rgba(0,243,255,0.3); border-radius: 10px; }
  .guide-detail::-webkit-scrollbar-track { background: transparent; }
  @keyframes guidePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
`;

export default function GuidePanel() {
  const [nodes,,onNodesChange] = useNodesState(initialNodes);
  const [edges,,onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState('dashboard');
  const refs = useRef({});
  const nodeTypes = useMemo(() => ({ guideNode: GuideNode }), []);

  const onNodeClick = useCallback((_e, node) => {
    setSelectedId(node.id);
    refs.current[node.id]?.scrollIntoView({ behavior:'smooth', block:'start' });
  }, []);

  return (
    <div style={{ display:'flex', height:'100%', background:C.bg, color:C.text, fontFamily:"'Outfit',sans-serif" }}>
      <style>{CUSTOM_CSS}</style>

      {/* LEFT — Flowchart Canvas */}
      <div style={{ flex:1, position:'relative', height:'85vh' }} className="guide-flow">
        {/* Title overlay */}
        <div style={{
          position:'absolute', top:20, left:20, zIndex:10, padding:'16px 22px',
          background:'rgba(10,15,30,0.8)', backdropFilter:'blur(16px)',
          borderRadius:16, border:'1px solid rgba(0,243,255,0.15)',
          boxShadow:'0 0 30px rgba(0,243,255,0.1)',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Sparkles size={22} color={C.cyan} />
            <span style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'0.15em',
              textShadow:`0 0 12px ${C.cyan}` }}>SWARMY OS</span>
          </div>
          <div style={{ fontSize:10, color:C.cyan, opacity:0.7, letterSpacing:'0.25em',
            fontWeight:700, textTransform:'uppercase', marginTop:4 }}>
            Interactive Architecture Flow
          </div>
        </div>

        <ReactFlow
          nodes={nodes.map(n => ({ ...n, selected: n.id === selectedId }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.1} maxZoom={1.5}
          style={{ background:'radial-gradient(ellipse at center, #0a1224 0%, #05050a 70%)' }}
        >
          <Background color="rgba(255,255,255,0.06)" gap={30} size={1.5} variant="dots" />
          <Controls />
        </ReactFlow>
      </div>

      {/* RIGHT — Operator Manual */}
      <div className="guide-detail" style={{
        width:460, borderLeft:`1px solid rgba(0,243,255,0.15)`,
        background:'rgba(6,10,20,0.95)', overflowY:'auto', padding:'24px 28px',
        height:'85vh',
      }}>
        {/* Sticky header */}
        <div style={{
          position:'sticky', top:0, zIndex:20, paddingBottom:16, marginBottom:20,
          borderBottom:'1px solid rgba(0,243,255,0.15)',
          background:'rgba(6,10,20,0.95)', backdropFilter:'blur(10px)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
        }}>
          <span style={{ fontSize:15, fontWeight:700, color:C.cyan, letterSpacing:'0.18em',
            textTransform:'uppercase', textShadow:`0 0 6px ${C.cyan}55` }}>
            Operator Manual
          </span>
          <div style={{ display:'flex', gap:6 }}>
            {[C.pink, C.cyan, C.amber].map((c,i) => (
              <div key={i} style={{ width:7, height:7, borderRadius:'50%', background:c,
                animation:'guidePulse 2s ease infinite', animationDelay:`${i*0.2}s` }} />
            ))}
          </div>
        </div>

        {/* Step cards */}
        {NODE_INFO.map((step) => {
          const active = selectedId === step.id;
          const Icon = ICONS[step.icon];
          return (
            <div key={step.id} ref={el => refs.current[step.id] = el}
              onClick={() => setSelectedId(step.id)}
              style={{
                padding:'20px 22px', borderRadius:16, marginBottom:14, cursor:'pointer',
                border:`1.5px solid ${active ? step.color : 'rgba(255,255,255,0.06)'}`,
                background: active ? 'rgba(10,15,30,0.9)' : 'rgba(8,13,26,0.6)',
                boxShadow: active ? `0 0 25px ${step.color}22` : 'none',
                transition:'all 0.35s ease',
              }}>
              <div style={{ display:'flex', gap:16, alignItems:'flex-start' }}>
                <div style={{
                  padding:12, borderRadius:12, background:'rgba(5,5,10,0.8)', flexShrink:0,
                  border:`1px solid ${active ? step.color : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: active ? `0 0 10px ${step.color}44` : 'none',
                  color: active ? step.color : C.muted, display:'flex',
                }}>
                  {Icon && <Icon size={26} />}
                </div>
                <div>
                  <div style={{
                    fontSize:16, fontWeight:700, letterSpacing:'0.05em', marginBottom:8,
                    color: active ? '#fff' : C.text,
                  }}>{step.title}</div>
                  <div style={{
                    color: C.muted, lineHeight:1.7, fontSize:14, whiteSpace:'pre-wrap',
                  }}>{step.desc}</div>
                </div>
              </div>
            </div>
          );
        })}
        <div style={{ height:100 }} />
      </div>
    </div>
  );
}
