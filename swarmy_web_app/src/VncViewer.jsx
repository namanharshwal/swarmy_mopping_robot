import React, { useState, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Hand, MousePointer2 } from 'lucide-react';

export default function VncViewer({ src, isFullscreen }) {
  // Mobile touch panning and zooming bypass
  const [interact, setInteract] = useState(false);
  const [scale, setScale] = useState(window.innerWidth < 1024 ? 0.5 : 1);
  const containerRef = useRef(null);

  // Allow zoom controls
  const handleZoomIn = () => setScale(s => Math.min(s + 0.15, 2));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.15, 0.2));
  const resetZoom = () => setScale(window.innerWidth < 1024 ? 0.5 : 1);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      
      {/* Control Overlay */}
      <div style={{
        position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '8px', zIndex: 100
      }}>
        <button 
          onClick={() => setInteract(!interact)}
          style={{
            background: interact ? 'rgba(239,68,68,0.95)' : 'rgba(16,185,129,0.95)', 
            color: '#fff', border: 'none', padding: '6px 14px', 
            borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.6)', fontSize: '12px',
            fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.5px'
          }}
        >
          {interact ? <MousePointer2 size={16}/> : <Hand size={16}/>}
          {interact ? 'RVIZ LOCKED (TAP TO PAN)' : 'PAN SCROLL (TAP TO RVIZ)'}
        </button>

        <div style={{ display: 'flex', background: 'rgba(0,0,0,0.85)', borderRadius: '6px', overflow: 'hidden', border: '1px solid #444', boxShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
          <button onClick={handleZoomOut} style={btnStyle}><ZoomOut size={18} color="#22d3ee" /></button>
          <button onClick={resetZoom} style={{...btnStyle, borderLeft: '1px solid #444', borderRight: '1px solid #444'}}><RotateCcw size={16} color="#aaa" /></button>
          <button onClick={handleZoomIn} style={btnStyle}><ZoomIn size={18} color="#22d3ee" /></button>
        </div>
      </div>

      {/* 
        THE NATIVE SCROLL CONTAINER
      */}
      <div 
        ref={containerRef}
        style={{ 
          flex: 1, 
          width: '100%', 
          overflow: interact ? 'hidden' : 'auto', 
          WebkitOverflowScrolling: 'touch',
          position: 'relative'
        }}
      >
        {/* Bounding box matches scaled size to prevent blank scroll areas */}
        <div style={{
          width: `${1920 * scale}px`, 
          height: `${1080 * scale}px`,
          position: 'relative'
        }}>
          {/* Scaled desktop perfectly rendered at 1080p internally */}
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: '1920px', 
            height: '1080px',
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}>
            <iframe 
              src={src}
              style={{ 
                width: '100%', height: '100%', border: 'none', background: '#222',
                pointerEvents: interact ? 'auto' : 'none' 
              }} 
              title="VNC Stream" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

const btnStyle = {
  background: 'transparent', border: 'none', padding: '8px 14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
};
