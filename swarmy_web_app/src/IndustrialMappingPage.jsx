import React, { useState, useEffect, useRef, useCallback } from 'react';
import VncViewer from './VncViewer';
import { Save, Play, RefreshCw, Maximize2, XCircle, Gamepad2, Compass, Map as MapIcon, Radio, StopCircle, Trash2, Crosshair, Layers, Navigation, ChevronLeft, ChevronRight } from 'lucide-react';
import nipplejs from 'nipplejs';

const API_URL = `http://${window.location.hostname}:3001`;
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('swarmy_token')}`
});

export default function IndustrialMappingPage({ autonomous = false }) {
  const [iframeInteract, setIframeInteract] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rosStatus, setRosStatus] = useState('disconnected');
  const [mappingRunning, setMappingRunning] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [vncKey, setVncKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const joystickZoneRef = useRef(null);
  const rosRef = useRef(null);
  const moveIntervalRef = useRef(null);
  const managerRef = useRef(null);
  const cmdVelRef = useRef(null);
  
  // Refs for performance (avoids React re-renders on fast 60Hz joystick events)
  const speedRef = useRef({ linear: 0, angular: 0 });
  const linearDisplayRef = useRef(null);
  const angularDisplayRef = useRef(null);

  // Auto-collapse sidebar on very small screens initially
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  // Poll for mapping processes
  useEffect(() => {
    const poll = setInterval(() => {
      fetch(`${API_URL}/api/processes`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
          const procs = Object.values(data.processes || {});
          const isRunning = procs.some(p => p.command && p.command.includes(autonomous ? 'autonomous_mapping' : 'mapping.launch'));
          setMappingRunning(isRunning);
        }).catch(() => {});
    }, 3000);
    return () => clearInterval(poll);
  }, [autonomous]);

  const initROS = useCallback(() => {
    if (!window.ROSLIB) return;
    if (rosRef.current) { try { rosRef.current.close(); } catch(e) {} }

    const ros = new window.ROSLIB.Ros({ url: `ws://${window.location.hostname}:9090` });
    rosRef.current = ros;

    ros.on('connection', () => {
      setRosStatus('connected');
      if (!autonomous) {
        cmdVelRef.current = new window.ROSLIB.Topic({ ros: ros, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
        cmdVelRef.current.advertise();
      }
    });
    
    ros.on('error', () => setRosStatus('error'));
    ros.on('close', () => setRosStatus('disconnected'));
  }, [autonomous]);

  useEffect(() => {
    initROS();
    return () => {
      if (moveIntervalRef.current) clearInterval(moveIntervalRef.current);
      if (managerRef.current) managerRef.current.destroy();
      if (cmdVelRef.current) cmdVelRef.current.unadvertise();
      if (rosRef.current) rosRef.current.close();
    };
  }, [initROS]);

  useEffect(() => {
    if (autonomous || !joystickZoneRef.current) return;
    
    setTimeout(() => {
      if (joystickZoneRef.current && !managerRef.current) {
        joystickZoneRef.current.innerHTML = '';
        const manager = nipplejs.create({ 
          zone: joystickZoneRef.current, 
          mode: 'static', 
          position: { left: '50%', top: '50%' }, 
          color: '#22d3ee', 
          size: 100 
        });
        managerRef.current = manager;
        
        manager.on('move', (evt, data) => {
          if (!data.angle) return;
          const lin = Math.sin(data.angle.radian) * 0.5 * (data.distance / 50);
          const ang = -Math.cos(data.angle.radian) * 1.0 * (data.distance / 50);
          
          // Update refs directly for performance (bypasses React render cycle)
          speedRef.current = { linear: lin, angular: ang };
          if (linearDisplayRef.current) linearDisplayRef.current.innerText = `${lin.toFixed(2)} m/s`;
          if (angularDisplayRef.current) angularDisplayRef.current.innerText = `${ang.toFixed(2)} rad/s`;

          if (!moveIntervalRef.current) {
            moveIntervalRef.current = setInterval(() => {
              if (cmdVelRef.current) {
                cmdVelRef.current.publish(new window.ROSLIB.Message({ 
                  linear: { x: speedRef.current.linear, y: 0, z: 0 }, 
                  angular: { x: 0, y: 0, z: speedRef.current.angular } 
                }));
              }
            }, 100);
          }
        });
        
        manager.on('end', () => {
          if (moveIntervalRef.current) { clearInterval(moveIntervalRef.current); moveIntervalRef.current = null; }
          speedRef.current = { linear: 0, angular: 0 };
          if (linearDisplayRef.current) linearDisplayRef.current.innerText = `0.00 m/s`;
          if (angularDisplayRef.current) angularDisplayRef.current.innerText = `0.00 rad/s`;
          
          if (cmdVelRef.current) {
            cmdVelRef.current.publish(new window.ROSLIB.Message({ 
              linear: { x: 0, y: 0, z: 0 }, 
              angular: { x: 0, y: 0, z: 0 } 
            }));
          }
        });
      }
    }, 500);
  }, [autonomous, rosStatus, sidebarOpen]); // Re-init joystick if sidebar re-opens

  const executeCmd = async (command) => {
    try {
      const isLaunch = command.includes('roslaunch') || (command.includes('rosrun') && !command.includes('map_saver'));
      const endpoint = isLaunch ? '/api/launch' : '/api/terminal';
      await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ command })
      });
    } catch (e) { alert('Failed to execute command'); }
  };

  const startMapping = async () => {
    setStatusText('Starting mapping stack...');
    setMappingRunning(true);
    await fetch(`${API_URL}/api/kill`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ killAll: true }) });
    await new Promise(r => setTimeout(r, 2000));
    
    if (autonomous) {
      await executeCmd('roslaunch swarmy_navigation autonomous_mapping.launch');
    } else {
      await executeCmd('roslaunch swarmy_navigation mapping.launch');
    }
    
    setTimeout(() => {
      setVncKey(k => k + 1);
      setStatusText(autonomous ? 'Autonomous Mapping Active' : 'Manual SLAM Active');
      setTimeout(() => setStatusText(''), 3000);
    }, 3000);
  };

  const stopMapping = async () => {
    await fetch(`${API_URL}/api/kill`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ killAll: true }) });
    setMappingRunning(false);
    setStatusText('Mapping stopped.');
    setTimeout(() => setStatusText(''), 3000);
  };

  const saveMap = () => {
    const defaultName = `map_${Date.now()}`;
    const name = prompt('Enter a name for the new map:', defaultName);
    if (name) {
      executeCmd(`rosrun map_server map_saver -f /home/swarmy_bot/swarmy_ws/src/swarmy_navigation/maps/${name}`);
      setStatusText(`Saved map: ${name}`);
      setTimeout(() => setStatusText(''), 3000);
    }
  };

  const deleteMaps = () => {
    if (window.confirm("Are you sure you want to delete ALL maps? This cannot be undone.")) {
      executeCmd('rm /home/swarmy_bot/swarmy_ws/src/swarmy_navigation/maps/* || true');
      setStatusText('All maps deleted.');
      setTimeout(() => setStatusText(''), 3000);
    }
  };

  const stColor = rosStatus === 'connected' ? (mappingRunning ? '#10b981' : '#f59e0b') : '#ef4444';
  const stText = rosStatus === 'connected' ? (mappingRunning ? 'MAPPING' : 'ROS OK / MAP OFF') : 'DISCONNECTED';

  return (
    <div className="map-root">
      {/* TOP BAR */}
      <div className="map-topbar">
        <div className="map-topbar-left">
          <button className="map-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{padding: '4px', marginRight: '4px'}}>
            {sidebarOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
          </button>
          <h1 className="map-title">{autonomous ? 'AUTONOMOUS MAPPING' : '2D SLAM MAPPING'}</h1>
          <div className="map-status-badge" style={{borderColor: stColor}}>
            <Radio size={10} color={stColor}/> <span style={{color: stColor}}>{stText}</span>
          </div>
        </div>
        <div className="map-topbar-right">
          {!mappingRunning ? (
            <button className="map-btn map-btn-green" onClick={startMapping}>
              <Play size={14}/><span className="map-btn-label">Start Mapping</span>
            </button>
          ) : (
            <button className="map-btn map-btn-red" onClick={stopMapping}>
              <StopCircle size={14}/><span className="map-btn-label">Kill All</span>
            </button>
          )}
          
          <button className="map-btn map-btn-cyan" onClick={saveMap}>
            <Save size={14}/><span className="map-btn-label">Save Map</span>
          </button>
          
          {!autonomous && (
            <button className="map-btn map-btn-red" onClick={deleteMaps}>
              <Trash2 size={14}/><span className="map-btn-label">Delete Maps</span>
            </button>
          )}
          
          <button className="map-btn map-btn-purple" onClick={() => setVncKey(k => k + 1)}>
            <RefreshCw size={14}/><span className="map-btn-label">Refresh RViz</span>
          </button>
          
          <button className="map-btn" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Maximize2 size={14}/><span className="map-btn-label">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>
      
      {statusText && <div className="map-status-bar">{statusText}</div>}

      {/* BODY */}
      <div className="map-body">
        
        {/* LEFT / TOP SIDEBAR */}
        {sidebarOpen && (
          <div className="map-sidebar">
            {autonomous ? (
              <>
                <div className="map-section-title"><Compass size={12}/> AUTO EXPLORATION</div>
                <div style={{fontSize: '12px', color: '#ccc', lineHeight: '1.5', padding: '8px 0'}}>
                  The AI uses <strong>explore_lite</strong> to autonomously chart unknown frontiers without user intervention.
                </div>
                <div style={{background: 'rgba(59,130,246,0.1)', border: '1px solid #3b82f6', borderRadius: '4px', padding: '8px', fontSize: '11px', color: '#93c5fd', marginTop: '8px'}}>
                  <strong>Tip:</strong> If the robot gets stuck in a corner, use the <strong>"Publish Point"</strong> tool in the RViz toolbar to manually guide it out.
                </div>
              </>
            ) : (
              <>
                <div className="map-section-title"><Gamepad2 size={12}/> TELEOP DRIVE</div>
                <div style={{fontSize: '11px', color: '#888', marginBottom: '8px'}}>Drive the robot manually to scan the environment.</div>
                <div ref={joystickZoneRef} style={{flex: 1, minHeight: '180px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', position: 'relative'}}></div>
                
                <div style={{marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '8px', borderRadius: '6px', border: '1px solid #333'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px'}}>
                    <span style={{color: '#888'}}>Linear X:</span>
                    <strong style={{color: '#22d3ee'}} ref={linearDisplayRef}>0.00 m/s</strong>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px'}}>
                    <span style={{color: '#888'}}>Angular Z:</span>
                    <strong style={{color: '#a78bfa'}} ref={angularDisplayRef}>0.00 rad/s</strong>
                  </div>
                </div>
              </>
            )}
            
            <div className="map-section-title" style={{marginTop: 'auto', paddingTop: '12px'}}><Layers size={12}/> INSTRUCTIONS</div>
            <ul style={{fontSize: '11px', color: '#aaa', paddingLeft: '16px', margin: '8px 0 0 0', display: 'flex', flexDirection: 'column', gap: '6px'}}>
              <li>1. Start mapping process</li>
              <li>2. Wait for RViz to appear</li>
              <li>3. Move robot through area</li>
              <li>4. Click "Save Map" when done</li>
            </ul>
          </div>
        )}
        
        {/* VNC CANVAS PANEL */}
        <div className="map-canvas-wrap" style={isFullscreen ? {
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, borderRadius: 0, border: 'none'
        } : {}}>
          <VncViewer src={`http://${window.location.hostname}:6080/vnc.html?resize=scale&autoconnect=true`} isFullscreen={isFullscreen} />
          {isFullscreen && (
            <button onClick={() => setIsFullscreen(false)} style={{
              position: 'absolute', top: '16px', right: '16px', zIndex: 10000, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 'bold'
            }}>EXIT FULLSCREEN</button>
          )}
        </div>
      </div>
      
                        <style>{`
        .map-root { min-height:100%; height:auto; display:flex; flex-direction:column; font-family:'Rajdhani',sans-serif; overflow:auto; }
        .map-topbar { display:flex; justify-content:space-between; align-items:center; padding:8px 0; gap:8px; flex-wrap:wrap; min-height:fit-content; }
        .map-topbar-left { display:flex; align-items:center; gap:8px; flex-shrink:0; }
        .map-topbar-right { display:flex; gap:4px; flex-wrap:wrap; align-items:center; }
        .map-title { font-size:1.1rem; font-weight:bold; color:#fff; white-space:nowrap; margin:0; }
        .map-status-badge { display:flex; align-items:center; gap:4px; padding:2px 10px; border-radius:20px; background:rgba(0,0,0,0.4); border:1px solid; font-size:10px; font-weight:bold; letter-spacing:1px; }
        .map-btn { display:flex; align-items:center; gap:4px; padding:5px 8px; border-radius:4px; background:rgba(255,255,255,0.08); border:1px solid #444; color:#ccc; cursor:pointer; font-family:'Rajdhani',sans-serif; font-weight:600; font-size:12px; white-space:nowrap; transition:all .15s; }
        .map-btn:hover { background:rgba(255,255,255,0.15); }
        .map-btn-cyan { background:rgba(34,211,238,0.15); border-color:#22d3ee; color:#22d3ee; }
        .map-btn-green { background:rgba(16,185,129,0.15); border-color:#10b981; color:#10b981; }
        .map-btn-red { background:rgba(239,68,68,0.15); border-color:#ef4444; color:#ef4444; }
        .map-btn-purple { background:rgba(139,92,246,0.15); border-color:#8b5cf6; color:#8b5cf6; }
        .map-status-bar { padding:6px 12px; border-radius:6px; background:rgba(0,0,0,0.5); border:1px solid #333; font-size:12px; color:#22d3ee; font-weight:bold; margin-bottom:6px; }
        
        .map-body { display:flex; gap:12px; flex:1; overflow:visible; min-height:0; }
        .map-sidebar { width:220px; min-width:220px; background:rgba(0,0,0,0.5); border:1px solid #333; border-radius:8px; padding:12px; display:flex; flex-direction:column; transition:all 0.3s; overflow-y:auto; -webkit-overflow-scrolling:touch; }
        .map-section-title { color:#00f3ff; font-size:11px; font-weight:bold; letter-spacing:1px; border-bottom:1px solid #222; padding-bottom:6px; margin-bottom:6px; display:flex; align-items:center; gap:6px; }
        .map-canvas-wrap { flex:1; border:1px solid #333; border-radius:8px; background:#111; overflow:hidden; position:relative; min-height:400px; }
        
        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .map-btn-label { display:none; }
          .map-sidebar { width:100%; min-width:100%; max-height:none; flex:none; }
          .map-body { flex-direction:column; overflow:visible; height:auto; }
          .map-canvas-wrap { min-height:85vh; height:85vh; flex:none; }
          .map-title { font-size:0.95rem; }
          .map-btn { padding:6px 8px; }
        }
        @media (max-width: 480px) {
          .map-topbar-right { gap:4px; }
        }
      `}</style>
    </div>
  );
}
