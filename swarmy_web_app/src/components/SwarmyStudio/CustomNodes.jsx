import React from 'react';
import { Handle, Position } from 'reactflow';

// Shared styles
const baseStyle = {
  padding: '12px',
  borderRadius: '8px',
  width: '160px',
  fontSize: '12px',
  textAlign: 'center',
  color: 'white',
  fontFamily: 'Orbitron, sans-serif',
  boxShadow: '0 4px 10px rgba(0,0,0,0.5)',
  border: '1px solid rgba(255,255,255,0.2)',
};

const handleStyle = { width: '10px', height: '10px', background: '#ccc' };
const successHandleStyle = { ...handleStyle, background: '#00ff00', left: '30%' };
const failHandleStyle = { ...handleStyle, background: '#ff0000', left: '70%' };

export function TaskNode({ data }) {
  return (
    <div style={{ ...baseStyle, background: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)' }}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>{data.label}</div>
      <div style={{ fontSize: '10px', opacity: 0.8 }}>{data.subline || 'Task'}</div>
      <Handle type="source" position={Position.Bottom} id="success" style={successHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="failure" style={failHandleStyle} />
    </div>
  );
}

export function ActionNode({ data }) {
  return (
    <div style={{ ...baseStyle, background: 'linear-gradient(135deg, #141E30, #243B55)' }}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', color: '#00ffff' }}>{data.label}</div>
      <div style={{ fontSize: '10px', opacity: 0.8 }}>{data.subline || 'Action'}</div>
      <Handle type="source" position={Position.Bottom} id="success" style={successHandleStyle} />
      <Handle type="source" position={Position.Bottom} id="failure" style={failHandleStyle} />
    </div>
  );
}

export function LogicNode({ data }) {
  return (
    <div style={{ ...baseStyle, background: 'linear-gradient(135deg, #b92b27, #1565C0)' }}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px', color: '#ffcc00' }}>{data.label}</div>
      <div style={{ fontSize: '10px', opacity: 0.8 }}>{data.subline || 'Logic'}</div>
      <Handle type="source" position={Position.Bottom} id="success" style={{...successHandleStyle, left: '50%'}} />
    </div>
  );
}
