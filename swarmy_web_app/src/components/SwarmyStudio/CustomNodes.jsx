import React from 'react';
import { Handle, Position } from 'reactflow';
import { Play, MapPin, Settings, Zap, GitBranch } from 'lucide-react';

const nodeContainerStyle = {
  background: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  width: '220px',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '12px',
  color: '#334155',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden'
};

const headerStyle = (color) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 12px',
  borderBottom: '1px solid #e2e8f0',
  fontWeight: '600',
  color: color,
  background: '#ffffff'
});

const bodyStyle = {
  padding: '12px',
  background: '#f8fafc',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const handleStyle = { width: '8px', height: '8px', background: '#94a3b8', border: '1px solid white' };

const FooterHandles = ({ hasFailure = true }) => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', padding: '8px', background: '#ffffff', borderTop: '1px solid #e2e8f0', position: 'relative' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>Success</span>
      <Handle type="source" position={Position.Bottom} id="success" style={{ ...handleStyle, background: '#10b981', bottom: '-4px', left: hasFailure ? '35%' : '50%' }} />
    </div>
    {hasFailure && (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>Failed</span>
        <Handle type="source" position={Position.Bottom} id="failure" style={{ ...handleStyle, background: '#ef4444', bottom: '-4px', left: '65%' }} />
      </div>
    )}
  </div>
);

export function TaskNode({ data }) {
  return (
    <div style={nodeContainerStyle}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <div style={headerStyle('#0ea5e9')}>
        <MapPin size={14} /> {data.label}
      </div>
      <div style={bodyStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Waypoint</span>
          <span style={{ fontWeight: '500' }}>{data.subline || 'None'}</span>
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
      <div style={headerStyle('#8b5cf6')}>
        <Zap size={14} /> {data.label}
      </div>
      <div style={bodyStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Target</span>
          <span style={{ fontWeight: '500' }}>{data.subline || 'Action'}</span>
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
      <div style={headerStyle('#f59e0b')}>
        <GitBranch size={14} /> {data.label}
      </div>
      <div style={bodyStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: '#64748b' }}>Condition</span>
          <span style={{ fontWeight: '500' }}>{data.subline || 'Logic'}</span>
        </div>
      </div>
      <FooterHandles hasFailure={false} />
    </div>
  );
}
