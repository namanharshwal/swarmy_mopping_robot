import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play, MapPin, Settings, Zap, GitBranch } from 'lucide-react';

const nodeContainerStyle = {
  background: 'rgba(20, 25, 35, 0.95)',
  borderRadius: '8px',
  border: '1px solid #334155',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
  width: '220px',
  fontFamily: '"Rajdhani", sans-serif',
  fontSize: '13px',
  color: '#e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backdropFilter: 'blur(10px)'
};

const headerStyle = (color, bgColor) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 12px',
  borderBottom: '1px solid #334155',
  fontWeight: '600',
  color: color,
  background: bgColor,
  letterSpacing: '0.5px'
});

const bodyStyle = {
  padding: '12px',
  background: 'rgba(10, 15, 25, 0.6)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const handleStyle = { width: '8px', height: '8px', background: '#94a3b8', border: '1px solid #1e293b' };

const FooterHandles = ({ hasFailure = true }) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '10px', background: 'rgba(20, 25, 35, 0.95)', borderTop: '1px solid #334155', position: 'relative' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>Success</span>
      <Handle type="source" position={Position.Bottom} id="success" style={{ ...handleStyle, background: '#10b981', bottom: '-4px', left: hasFailure ? '35%' : '50%' }} />
    </div>
    {hasFailure && (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid #ef4444', padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>Failed</span>
        <Handle type="source" position={Position.Bottom} id="failure" style={{ ...handleStyle, background: '#ef4444', bottom: '-4px', left: '65%' }} />
      </div>
    )}
  </div>
);

export function TaskNode({ data }) {
  return (
    <div style={nodeContainerStyle}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={headerStyle('#22d3ee', 'rgba(34, 211, 238, 0.1)')}>
        <MapPin size={16} /> {data.label}
      </div>
      <div style={bodyStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Waypoint</span>
          <span style={{ fontWeight: '600', color: '#fff' }}>{data.subline || 'None'}</span>
        </div>
      </div>
      <FooterHandles />
    </div>
  );
}

export function ActionNode({ data }) {
  return (
    <div style={nodeContainerStyle}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={headerStyle('#c084fc', 'rgba(192, 132, 252, 0.1)')}>
        <Zap size={16} /> {data.label}
      </div>
      <div style={bodyStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Target</span>
          <span style={{ fontWeight: '600', color: '#fff' }}>{data.subline || 'Action'}</span>
        </div>
      </div>
      <FooterHandles />
    </div>
  );
}

export function LogicNode({ data }) {
  return (
    <div style={nodeContainerStyle}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={headerStyle('#fbbf24', 'rgba(251, 191, 36, 0.1)')}>
        <GitBranch size={16} /> {data.label}
      </div>
      <div style={bodyStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#94a3b8' }}>Condition</span>
          <span style={{ fontWeight: '600', color: '#fff' }}>{data.subline || 'Logic'}</span>
        </div>
      </div>
      <FooterHandles hasFailure={false} />
    </div>
  );
}
