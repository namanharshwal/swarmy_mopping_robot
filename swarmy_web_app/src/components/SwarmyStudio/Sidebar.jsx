import React, { useState } from 'react';
import { FaMapMarkerAlt, FaSyncAlt, FaBatteryFull, FaMicrochip, FaVolumeUp, FaSmile, FaRandom } from 'react-icons/fa';

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
    <aside style={{ width: '300px', background: '#0a0f1e', borderLeft: '1px solid rgba(0,255,255,0.2)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,255,255,0.2)', textAlign: 'center' }}>
        <h2 style={{ color: '#00ffff', margin: 0, fontFamily: 'Orbitron' }}>Swarmy Studio</h2>
        <p style={{ color: '#aaa', fontSize: '12px', marginTop: '5px' }}>Drag tasks to build workflow</p>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid rgba(0,255,255,0.2)' }}>
        {tabs.map(tab => (
          <div 
            key={tab} 
            onClick={() => setActiveTab(tab)}
            style={{ 
              flex: 1, 
              textAlign: 'center', 
              padding: '10px 0', 
              cursor: 'pointer', 
              color: activeTab === tab ? '#00ffff' : '#888',
              borderBottom: activeTab === tab ? '2px solid #00ffff' : 'none',
              fontFamily: 'Orbitron', fontSize: '14px'
            }}
          >
            {tab}
          </div>
        ))}
      </div>

      <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexWrap: 'wrap', gap: '15px', alignContent: 'flex-start' }}>
        
        {activeTab === 'Tasks' && (
          <>
            <div className="dndnode task" onDragStart={(e) => onDragStart(e, 'taskNode', 'Go To Waypoint', 'Navigate to point')} draggable style={nodeStyle}>
              <FaMapMarkerAlt size={24} color="#00ffff" />
              <span>Go To Place</span>
            </div>
            <div className="dndnode task" onDragStart={(e) => onDragStart(e, 'taskNode', 'Rotate', 'Precise angular rotation')} draggable style={nodeStyle}>
              <FaSyncAlt size={24} color="#00ffff" />
              <span>Rotate</span>
            </div>
            <div className="dndnode task" onDragStart={(e) => onDragStart(e, 'taskNode', 'Dock', 'Auto-docking sequence')} draggable style={nodeStyle}>
              <FaBatteryFull size={24} color="#00ffff" />
              <span>Dock</span>
            </div>
          </>
        )}

        {activeTab === 'Actions' && (
          <>
            <div className="dndnode action" onDragStart={(e) => onDragStart(e, 'actionNode', 'PLC Trigger', 'Modbus / OPC UA')} draggable style={nodeStyle}>
              <FaMicrochip size={24} color="#ff00ff" />
              <span>PLC Trigger</span>
            </div>
            <div className="dndnode action" onDragStart={(e) => onDragStart(e, 'actionNode', 'Voice Announce', 'TTS output')} draggable style={nodeStyle}>
              <FaVolumeUp size={24} color="#ff00ff" />
              <span>Voice</span>
            </div>
            <div className="dndnode action" onDragStart={(e) => onDragStart(e, 'actionNode', 'Emotion', 'Face control')} draggable style={nodeStyle}>
              <FaSmile size={24} color="#ff00ff" />
              <span>Emotion</span>
            </div>
          </>
        )}

        {activeTab === 'Widgets' && (
          <>
            <div className="dndnode logic" onDragStart={(e) => onDragStart(e, 'logicNode', 'Split On', 'Condition / If-Else')} draggable style={nodeStyle}>
              <FaRandom size={24} color="#ffcc00" />
              <span>Split On</span>
            </div>
          </>
        )}

      </div>
    </aside>
  );
}

const nodeStyle = {
  width: '110px',
  height: '90px',
  border: '1px solid rgba(0, 255, 255, 0.3)',
  borderRadius: '8px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  cursor: 'grab',
  background: 'rgba(0,0,0,0.3)',
  color: 'white',
  fontSize: '12px',
  fontFamily: 'Orbitron',
  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
};
