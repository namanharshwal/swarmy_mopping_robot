import React, { useState } from 'react';
import { 
  Settings, CheckCircle, Navigation, Anchor, Volume2, Cpu, Smile, GitBranch, 
  LogOut, Route, Timer, ArrowUpFromLine, ArrowDownToLine, ToggleRight, 
  Activity, Webhook, Mail, Repeat, PauseCircle, Network, StopCircle, Music, Radio
} from 'lucide-react';

export default function Sidebar() {
  const [activeTab, setActiveTab] = useState('Tasks');

  const onDragStart = (event, nodeType, label, subline) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    event.dataTransfer.setData('application/reactflow/label', label);
    event.dataTransfer.setData('application/reactflow/subline', subline);
    event.dataTransfer.effectAllowed = 'move';
  };

  const tabs = ['Tasks', 'Actions', 'Widgets'];

  return (
    <aside style={{ width: '340px', background: 'rgba(10, 15, 25, 0.95)', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', fontFamily: '"Rajdhani", sans-serif', backdropFilter: 'blur(10px)' }}>
      
      {/* Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #1e293b' }}>
        <h2 style={{ color: '#fff', margin: '0 0 8px 0', fontSize: '22px', fontWeight: '600', letterSpacing: '1px' }}>STATE MACHINE</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>Drag and drop components to build your AMR flow.</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', padding: '16px 20px', gap: '8px' }}>
        {tabs.map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              flex: 1, 
              textAlign: 'center', 
              padding: '10px 0', 
              cursor: 'pointer', 
              color: activeTab === tab ? '#22d3ee' : '#64748b',
              background: activeTab === tab ? 'rgba(34, 211, 238, 0.1)' : 'rgba(20, 25, 35, 0.6)',
              border: activeTab === tab ? '1px solid #22d3ee' : '1px solid #334155',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s',
              letterSpacing: '1px'
            }}
          >
            {tab.toUpperCase()}
          </div>
        ))}
      </div>

      {/* Draggable Items Grid */}
      <div style={{ padding: '8px 20px 24px 20px', flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignContent: 'start' }}>
        
        {activeTab === 'Tasks' && (
          <>
            <NodeItem icon={<Navigation size={22} color="#22d3ee"/>} label="go_to_place" subline="Navigation" type="taskNode" onDragStart={onDragStart} />
            <NodeItem icon={<Route size={22} color="#22d3ee"/>} label="follow_path" subline="Strict routing" type="taskNode" onDragStart={onDragStart} />
            <NodeItem icon={<CheckCircle size={22} color="#22d3ee"/>} label="rotate" subline="Precise turn" type="taskNode" onDragStart={onDragStart} />
            <NodeItem icon={<Anchor size={22} color="#22d3ee"/>} label="dock_bot" subline="Charging" type="taskNode" onDragStart={onDragStart} />
            <NodeItem icon={<LogOut size={22} color="#22d3ee"/>} label="undock_bot" subline="Leave dock" type="taskNode" onDragStart={onDragStart} />
            <NodeItem icon={<ArrowUpFromLine size={22} color="#22d3ee"/>} label="lift_payload" subline="Actuator up" type="taskNode" onDragStart={onDragStart} />
            <NodeItem icon={<ArrowDownToLine size={22} color="#22d3ee"/>} label="drop_payload" subline="Actuator down" type="taskNode" onDragStart={onDragStart} />
            <NodeItem icon={<Timer size={22} color="#22d3ee"/>} label="wait_time" subline="Pause (sec)" type="taskNode" onDragStart={onDragStart} />
            <NodeItem icon={<Activity size={22} color="#22d3ee"/>} label="move_velocity" subline="Direct cmd_vel" type="taskNode" onDragStart={onDragStart} />
          </>
        )}

        {activeTab === 'Actions' && (
          <>
            <NodeItem icon={<Cpu size={22} color="#c084fc"/>} label="LocationAck" subline="Modbus TCP" type="actionNode" onDragStart={onDragStart} />
            <NodeItem icon={<Cpu size={22} color="#c084fc"/>} label="ConveyorUnlock" subline="Modbus TCP" type="actionNode" onDragStart={onDragStart} />
            <NodeItem icon={<ToggleRight size={22} color="#c084fc"/>} label="trigger_gpio" subline="Set IO pin" type="actionNode" onDragStart={onDragStart} />
            <NodeItem icon={<Radio size={22} color="#c084fc"/>} label="read_gpio" subline="Read IO pin" type="actionNode" onDragStart={onDragStart} />
            <NodeItem icon={<Webhook size={22} color="#c084fc"/>} label="call_rest_api" subline="Webhook POST" type="actionNode" onDragStart={onDragStart} />
            <NodeItem icon={<Mail size={22} color="#c084fc"/>} label="send_email" subline="Notification" type="actionNode" onDragStart={onDragStart} />
            <NodeItem icon={<Volume2 size={22} color="#c084fc"/>} label="announce" subline="AI Voice TTS" type="actionNode" onDragStart={onDragStart} />
            <NodeItem icon={<Music size={22} color="#c084fc"/>} label="play_sound" subline="Audio WAV" type="actionNode" onDragStart={onDragStart} />
            <NodeItem icon={<Smile size={22} color="#c084fc"/>} label="emotion" subline="Face update" type="actionNode" onDragStart={onDragStart} />
          </>
        )}

        {activeTab === 'Widgets' && (
          <>
            <NodeItem icon={<GitBranch size={22} color="#fbbf24"/>} label="Split On" subline="Condition Branch" type="logicNode" onDragStart={onDragStart} />
            <NodeItem icon={<Settings size={22} color="#fbbf24"/>} label="Set Variable" subline="Global state" type="logicNode" onDragStart={onDragStart} />
            <NodeItem icon={<Repeat size={22} color="#fbbf24"/>} label="Loop" subline="Repeat X times" type="logicNode" onDragStart={onDragStart} />
            <NodeItem icon={<PauseCircle size={22} color="#fbbf24"/>} label="Wait Event" subline="Pause flow" type="logicNode" onDragStart={onDragStart} />
            <NodeItem icon={<Network size={22} color="#fbbf24"/>} label="Sub-Flow" type="logicNode" subline="Call state mach" onDragStart={onDragStart} />
            <NodeItem icon={<StopCircle size={22} color="#fbbf24"/>} label="End Flow" subline="Terminate" type="logicNode" onDragStart={onDragStart} />
          </>
        )}

      </div>
    </aside>
  );
}

function NodeItem({ icon, label, subline, type, onDragStart }) {
  return (
    <div 
      onDragStart={(e) => onDragStart(e, type, label, subline)} 
      draggable 
      style={{
        background: 'rgba(30, 41, 59, 0.4)',
        border: '1px solid #334155',
        borderRadius: '8px',
        padding: '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '10px',
        cursor: 'grab',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease-in-out'
      }}
      onMouseOver={(e) => { 
        let color = '#22d3ee';
        if (type === 'actionNode') color = '#c084fc';
        if (type === 'logicNode') color = '#fbbf24';
        e.currentTarget.style.borderColor = color; 
        e.currentTarget.style.boxShadow = `0 0 10px ${color}33`; 
        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.8)'; 
      }}
      onMouseOut={(e) => { 
        e.currentTarget.style.borderColor = '#334155'; 
        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.3)'; 
        e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)'; 
      }}
    >
      <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
        {icon}
      </div>
      <span style={{ fontSize: '13px', fontWeight: '600', color: '#e2e8f0', textAlign: 'center', wordBreak: 'break-word', letterSpacing: '0.5px' }}>{label}</span>
      <span style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>{subline}</span>
    </div>
  );
}
