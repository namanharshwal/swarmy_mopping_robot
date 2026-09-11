import React, { useState, useEffect } from 'react';
import { Server, Play, Square, Activity, ArrowRight, ShieldCheck, Cpu, MonitorUp } from 'lucide-react';

const API_URL = `http://${window.location.hostname}:3001`;

export default function OpcUaPanel() {
  const [status, setStatus] = useState('Checking...');
  const [logs, setLogs] = useState([]);
  
  // Client States
  const [clientReadOutput, setClientReadOutput] = useState('Click "Read State" to fetch...');
  const [cmdX, setCmdX] = useState('0.0');
  const [cmdY, setCmdY] = useState('0.0');
  const [cmdTask, setCmdTask] = useState('TEST_TASK');
  
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/opcua/status`);
      const data = await res.json();
      setStatus(data.status);
    } catch (e) {
      setStatus('Error connecting to backend');
    }
  };

  const startServer = async () => {
    try {
      await fetch(`${API_URL}/api/opcua/start`, { method: 'POST' });
      setStatus('Starting...');
      addLog("Sent start command to OPC UA Bridge...");
    } catch (e) {
      addLog(`Error: ${e.message}`);
    }
  };

  const stopServer = async () => {
    try {
      await fetch(`${API_URL}/api/opcua/stop`, { method: 'POST' });
      setStatus('Stopping...');
      addLog("Sent stop command to OPC UA Bridge...");
    } catch (e) {
      addLog(`Error: ${e.message}`);
    }
  };

  const readClientState = async () => {
    setClientReadOutput('Fetching...');
    try {
      const res = await fetch(`${API_URL}/api/opcua/client/read`);
      const data = await res.json();
      setClientReadOutput(data.output || data.error);
    } catch (e) {
      setClientReadOutput(`Error: ${e.message}`);
    }
  };

  const sendClientMove = async () => {
    try {
      const res = await fetch(`${API_URL}/api/opcua/client/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: parseFloat(cmdX), y: parseFloat(cmdY) })
      });
      const data = await res.json();
      addLog(`Client Sent Move: ${data.output || data.error}`);
    } catch (e) {
      addLog(`Client Error: ${e.message}`);
    }
  };

  const sendClientTask = async () => {
    try {
      const res = await fetch(`${API_URL}/api/opcua/client/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: cmdTask })
      });
      const data = await res.json();
      addLog(`Client Sent Task: ${data.output || data.error}`);
    } catch (e) {
      addLog(`Client Error: ${e.message}`);
    }
  };

  const addLog = (msg) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 10));
  };

  return (
    <div className="main-content" style={{ padding: '20px', fontFamily: "'Rajdhani', sans-serif" }}>
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Server size={28} color="#22d3ee" />
        Siemens PLCSIM Advanced - OPC UA Bridge
      </h1>
      <p style={{ color: '#aaa', marginBottom: '24px' }}>
        Provides a standardized OPC UA interface for Siemens PLCSIM Advanced to monitor the AMR status, control navigation, trigger tasks, and manipulate free I/O terminals securely.
      </p>

      <div className="dashboard-grid">
        {/* Connection Control Panel */}
        <div className="panel" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18}/> Server Control</h2>
          <div style={{ margin: '20px 0', fontSize: '1.2rem' }}>
            Status: <span style={{ 
              color: status.includes('Running') ? '#10b981' : (status.includes('Checking') ? '#f59e0b' : '#ef4444'),
              fontWeight: 'bold', marginLeft: '8px'
            }}>
              {status}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
            <button onClick={startServer} className="btn-tech map-btn-green" style={{ flex: 1, padding: '12px', fontSize: '16px' }} disabled={status.includes('Running')}>
              <Play size={18}/> START OPC UA SERVER
            </button>
            <button onClick={stopServer} className="btn-tech map-btn-red" style={{ flex: 1, padding: '12px', fontSize: '16px' }} disabled={!status.includes('Running')}>
              <Square size={18}/> STOP SERVER
            </button>
          </div>

          <div style={{ padding: '12px', background: 'rgba(34, 211, 238, 0.1)', border: '1px solid #22d3ee', borderRadius: '6px' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#22d3ee', fontSize: '14px' }}>Connection Details</h3>
            <div style={{ fontSize: '13px', color: '#ccc', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong>Endpoint URL:</strong> opc.tcp://{window.location.hostname}:4840/freeopcua/server/</div>
              <div><strong>Namespace URI:</strong> http://swarmy.amr.opcua</div>
              <div><strong>Root Object:</strong> SwarmyAMR</div>
            </div>
          </div>
        </div>

        {/* Variables Info Panel */}
        <div className="panel" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Cpu size={18}/> PLC Exposed Variables</h2>
          <div style={{ overflowY: 'auto', maxHeight: '300px', marginTop: '12px' }}>
            <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #444', textAlign: 'left', color: '#8b5cf6' }}>
                  <th style={{ padding: '8px' }}>Variable Name</th>
                  <th style={{ padding: '8px' }}>Access</th>
                  <th style={{ padding: '8px' }}>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #222' }}><td style={{ padding:'8px' }}>PositionX / Y</td><td style={{ color:'#10b981' }}>Read</td><td>Current AMR coordinates</td></tr>
                <tr style={{ borderBottom: '1px solid #222' }}><td style={{ padding:'8px' }}>Status</td><td style={{ color:'#10b981' }}>Read</td><td>Current execution state</td></tr>
                <tr style={{ borderBottom: '1px solid #222' }}><td style={{ padding:'8px' }}>TaskProgress</td><td style={{ color:'#10b981' }}>Read</td><td>% of task complete</td></tr>
                <tr style={{ borderBottom: '1px solid #222' }}><td style={{ padding:'8px' }}>CommandX / Y</td><td style={{ color:'#ef4444' }}>Write</td><td>Target coords for navigation</td></tr>
                <tr style={{ borderBottom: '1px solid #222' }}><td style={{ padding:'8px' }}>TriggerMove</td><td style={{ color:'#ef4444' }}>Write</td><td>Bool to execute Move command</td></tr>
                <tr style={{ borderBottom: '1px solid #222' }}><td style={{ padding:'8px' }}>TaskCommand</td><td style={{ color:'#ef4444' }}>Write</td><td>String ID of task to run</td></tr>
                <tr style={{ borderBottom: '1px solid #222' }}><td style={{ padding:'8px' }}>TriggerTask</td><td style={{ color:'#ef4444' }}>Write</td><td>Bool to execute Task command</td></tr>
                <tr style={{ borderBottom: '1px solid #222' }}><td style={{ padding:'8px' }}>IOPin / IOState</td><td style={{ color:'#ef4444' }}>Write</td><td>Set target free IO pin (20-30) state</td></tr>
                <tr><td style={{ padding:'8px' }}>TriggerIO</td><td style={{ color:'#ef4444' }}>Write</td><td>Bool to execute IO change</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Logs */}
      <div className="panel" style={{ marginTop: '20px', background: 'rgba(0,0,0,0.5)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={18}/> System Logs (Conflict Prevention)</h2>
        <div style={{ background: '#0a0a0a', padding: '12px', borderRadius: '4px', height: '150px', overflowY: 'auto', fontFamily: "'Share Tech Mono', monospace", fontSize: '12px', color: '#aaa', border: '1px solid #333' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ marginBottom: '4px' }}>{log}</div>
          ))}
          {logs.length === 0 && <div>Ready. IO operations restricted to pins 20-30 to prevent system conflict.</div>}
        </div>
      </div>

      {/* PLC Client Simulator Panel */}
      <div className="panel" style={{ marginTop: '20px', background: 'rgba(0,0,0,0.5)' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffcc00' }}><MonitorUp size={18}/> PLC Simulator (OPC UA Client)</h2>
        <p style={{ color: '#aaa', fontSize: '13px', marginBottom: '16px' }}>Use this to simulate a Siemens PLC reading and writing to the AMR via OPC UA.</p>
        <div style={{ display: 'flex', gap: '20px' }}>
            {/* Robot State Reader */}
            <div style={{ flex: 1, border: '1px solid rgba(255, 204, 0, 0.3)', padding: '16px', borderRadius: '8px', background: 'rgba(255, 204, 0, 0.05)' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#ffcc00' }}>Read Robot State</h3>
                <button onClick={readClientState} className="btn-tech" style={{ padding: '8px 16px', border: '1px solid #ffcc00', color: '#ffcc00', background: 'transparent' }}>
                  FETCH LIVE DATA
                </button>
                <pre style={{ background: '#0a0a0a', padding: '12px', marginTop: '12px', fontSize: '13px', color: '#10b981', border: '1px solid #333', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
                  {clientReadOutput}
                </pre>
            </div>
            
            {/* Command Writer */}
            <div style={{ flex: 1, border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)' }}>
                <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#ef4444' }}>Send Commands (Write)</h3>
                
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Target Coordinates</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="number" placeholder="X" value={cmdX} onChange={e=>setCmdX(e.target.value)} style={{ width: '80px', padding: '8px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px' }}/>
                      <input type="number" placeholder="Y" value={cmdY} onChange={e=>setCmdY(e.target.value)} style={{ width: '80px', padding: '8px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px' }}/>
                      <button onClick={sendClientMove} className="btn-tech map-btn-red" style={{ padding: '8px 16px' }}>Send Move</button>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: '#aaa', marginBottom: '4px' }}>Logic Task</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                      <input type="text" placeholder="e.g. UNLOCK_CONVEYOR" value={cmdTask} onChange={e=>setCmdTask(e.target.value)} style={{ flex: 1, padding: '8px', background: '#222', color: 'white', border: '1px solid #444', borderRadius: '4px' }}/>
                      <button onClick={sendClientTask} className="btn-tech map-btn-red" style={{ padding: '8px 16px' }}>Send Task</button>
                  </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
