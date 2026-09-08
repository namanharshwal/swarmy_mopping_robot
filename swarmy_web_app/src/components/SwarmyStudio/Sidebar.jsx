import React, { useState } from 'react';
import { Settings, CheckCircle, Navigation, Anchor, Volume2, Cpu, Smile, GitBranch } from 'lucide-react';

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
    <aside style={{ width: '320px', background: '#ffffff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', fontFamily: '"Inter", sans-serif' }}>
      
      {/* Header */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid #e2e8f0' }}>
        <h2 style={{ color: '#0f172a', margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>State machine</h2>
        <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Drag and drop tasks and actions to build your flow.</p>
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
              padding: '8px 0', 
              cursor: 'pointer', 
              color: activeTab === tab ? '#ffffff' : '#64748b',
              background: activeTab === tab ? '#0ea5e9' : '#ffffff',
              border: activeTab === tab ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      {/* Draggable Items Grid */}
      <div style={{ padding: '8px 20px', flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignContent: 'start' }}>
        
        {activeTab === 'Tasks' && (
          <>
            <NodeItem icon={<Navigation size={20} color="#0ea5e9"/>} label="go_to_place" subline="Navigation" type="taskNode" onDragStart={onDragStart} />
            <NodeItem icon={<CheckCircle size={20} color="#0ea5e9"/>} label="rotate" subline="Precise turn" type="taskNode" onDragStart={onDragStart} />
            <NodeItem icon={<Anchor size={20} color="#0ea5e9"/>} label="dock_bot" subline="Charging" type="taskNode" onDragStart={onDragStart} />
          </>
        )}

        {activeTab === 'Actions' && (
          <>
            <NodeItem icon={<Cpu size={20} color="#8b5cf6"/>} label="LocationAck_All" subline="Modbus TCP" type="actionNode" onDragStart={onDragStart} />
            <NodeItem icon={<Cpu size={20} color="#8b5cf6"/>} label="ConveyorUnlock" subline="Modbus TCP" type="actionNode" onDragStart={onDragStart} />
            <NodeItem icon={<Volume2 size={20} color="#8b5cf6"/>} label="announce" subline="AI Voice" type="actionNode" onDragStart={onDragStart} />
            <NodeItem icon={<Smile size={20} color="#8b5cf6"/>} label="emotion" subline="Face update" type="actionNode" onDragStart={onDragStart} />
          </>
        )}

        {activeTab === 'Widgets' && (
          <>
            <NodeItem icon={<GitBranch size={20} color="#f59e0b"/>} label="Split On" subline="((robot.location))" type="logicNode" onDragStart={onDragStart} />
            <NodeItem icon={<Settings size={20} color="#f59e0b"/>} label="Set Variable" subline="Global state" type="logicNode" onDragStart={onDragStart} />
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
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: 'grab',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        transition: 'box-shadow 0.2s, border-color 0.2s'
      }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'; }}
    >
      <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
        {icon}
      </div>
      <span style={{ fontSize: '12px', fontWeight: '500', color: '#334155', textAlign: 'center', wordBreak: 'break-word' }}>{label}</span>
    </div>
  );
}
