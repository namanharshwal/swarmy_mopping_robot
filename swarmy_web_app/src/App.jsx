/**
 * ============================================================================
 * Project Handlers: Naman Sain & Souvik Mallik
 * 
 * Maintainers:
 * - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
 * - Souvik Mallik: Embedded Maintainer
 * ============================================================================
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Activity, Menu,  Battery, Cpu, Wifi, WifiOff, Gamepad2, Navigation, AlertTriangle, Settings, FileText, LayoutDashboard, Power, Pause, RefreshCw, Save, Terminal, FolderTree, Network, Info, Play, MapPin, Database, Map, HardDrive, Thermometer, Clock, Globe, Zap, Shield, Eye, Radio, Bot, Rocket, XCircle, CheckCircle, MessageSquare, Send, Brain, MonitorUp, Server, RotateCw, FileCode, Maximize2, Palette, Compass, Mic, Volume2, VolumeX, HelpCircle } from 'lucide-react';
import Login from './Login';
import nipplejs from 'nipplejs';
import MatrixBackground from './MatrixBackground';
import VncViewer from './VncViewer';
import RobotFace, { EMOTION_LIST } from './RobotFace';
import SettingsPage from './SettingsPage';
import OpcUaPanel from './OpcUaPanel';
import RoutePlannerPage from "./RoutePlannerPage";
import ErrorBoundary from "./ErrorBoundary";
import SidebarMenu from "./SidebarMenu";
import IndustrialMappingPage from './IndustrialMappingPage';
import SwarmyStudio from './components/SwarmyStudio/SwarmyStudio';
import TourGuide from './TourGuide';
import GuidePanel from './GuidePanel';
import './index.css';

const THEMES = ['apple-dark', 'apple-light', 'midnight', 'obsidian', 'emerald', 'amethyst', 'gold', 'arctic', 'sunset', 'ocean', 'blossom', 'monolith', 'autumn', 'royal', 'mint', 'cyber', 'tokyo', 'lunar', 'blood', 'aurora'];

const ROSLIB = window.ROSLIB;
const API_URL = '';

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('swarmy_token')}` };
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================


// ============================================

// ============================================
// TOP BAR
// ============================================
function TopBar({ health, onEmergencyStop }) {
  const handlePower = async (mode) => {
    if(!window.confirm(`Are you sure you want to trigger: ${mode}?`)) return;
    try {
      await fetch(`${API_URL}/api/system/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ mode })
      });
    } catch(e) {}
  };

  return (
    <header className="top-bar">
      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
        <button className="mobile-menu-btn" onClick={() => window.dispatchEvent(new Event('toggleMobileMenu'))}>
          <Menu size={24} color="#00f3ff" />
        </button>
      </div>
      <div className="status-indicators">
        <div className="status-item"><Activity size={18} color={health.cpu > 80 ? '#ff003c' : '#00f3ff'} /> <span>{health.cpu ? health.cpu.toFixed(1) : 0}% CPU</span></div>
        <div className="status-item"><Thermometer size={18} color={health.temp > 75 ? '#ff003c' : '#00f3ff'} /> <span>{health.temp ? health.temp.toFixed(1) : 0}°C</span></div>
        <div className="status-item"><HardDrive size={18} color={health.ram > 90 ? '#ff003c' : '#00f3ff'} /> <span>{health.ram ? health.ram.toFixed(0) : 0}% RAM</span></div>
        <div className="status-item"><Battery size={18} color={health.battery < 20 ? '#ff003c' : '#00f3ff'} /> <span>{health.battery || 0}% ({health.voltage || 0}V)</span></div>
        <div className="status-item"><Clock size={18} color="#00f3ff" /> <span>{health.uptime}</span></div>
      </div>
      
      <div style={{display: 'flex', gap: '8px'}}>
        <button className="btn-tech tour-help-button" onClick={() => window.dispatchEvent(new Event('start-tour'))}>
          <HelpCircle size={16} /> HELP
        </button>
        <button className="btn-tech" onClick={() => window.location.reload()}>
          <RefreshCw size={16} /> REFRESH
        </button>
        <button className="btn-tech" style={{borderColor: '#f59e0b', color: '#f59e0b'}} onClick={() => handlePower('shutdown')}>
          <Power size={16} /> SHUTDOWN
        </button>
        <button className="btn-emergency pulse-fast" onClick={onEmergencyStop}>
          <AlertTriangle size={16} /> EMERGENCY STOP
        </button>
      </div>
    </header>
  );
}

// ============================================
// PAGE: MISSION LAUNCHER & MAPS
// ============================================
function Launcher() {
  const [maps, setMaps] = useState([]);
  const [launching, setLaunching] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [processes, setProcesses] = useState({});

  useEffect(() => {
    fetchMaps();
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchMaps = async () => {
    try {
      const res = await fetch(`${API_URL}/api/maps`, { headers: authHeaders() });
      const data = await res.json();
      if (data.maps) setMaps(data.maps);
    } catch (e) {}
  };

  const fetchProcesses = async () => {
    try {
      const res = await fetch(`${API_URL}/api/processes`, { headers: authHeaders() });
      const data = await res.json();
      setProcesses(data.processes || {});
    } catch (e) {}
  };

  const executeLaunch = async (command) => {
    setLaunching(true);
    setStatusMsg('⏳ Launching...');
    try {
      const res = await fetch(`${API_URL}/api/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ command })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`✅ ${data.message}`);
        setTimeout(fetchProcesses, 1000);
      } else {
        setStatusMsg(`❌ ${data.error}`);
      }
    } catch (e) {
      setStatusMsg('❌ Network error. Backend unreachable.');
    }
    setLaunching(false);
    setTimeout(() => setStatusMsg(''), 5000);
  };

  const killProcess = async (id) => {
    try {
      await fetch(`${API_URL}/api/kill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ processId: id })
      });
      fetchProcesses();
    } catch (e) {}
  };

  const MAPS_DIR = '/home/swarmy_bot/swarmy_ws/src/swarmy_navigation/maps';

  return (
    <div className="page-content animate-fade-in">
      <h1 className="page-title">MISSION LAUNCHER</h1>
      
      {statusMsg && <div className="alert-box info" style={{marginBottom: '16px'}}>{statusMsg}</div>}
      
      <h2 style={{color: 'var(--hexa-cyan)', marginBottom: '16px'}}><Terminal size={20}/> Core Launch Files</h2>
      <div className="launcher-grid">
        <button className="btn-launch" onClick={() => executeLaunch('roslaunch Swarmy_Bot_URDF swarmy_nav_core_bringup.launch teleop:=true rviz:=false')} disabled={launching}>
          <Zap size={32} color="var(--hexa-purple)" />
          <h3>Robot Bringup</h3>
          <p>Motors, LiDAR, EKF, TFs</p>
        </button>
        <button className="btn-launch" onClick={() => executeLaunch('roslaunch swarmy_navigation mapping.launch')} disabled={launching}>
          <MapPin size={32} color="var(--hexa-cyan)" />
          <h3>Start SLAM Mapping</h3>
          <p>GMapping + Bringup</p>
        </button>
        <button className="btn-launch" onClick={() => executeLaunch(`rosrun map_server map_saver -f ${MAPS_DIR}/map_${Date.now()}`)} disabled={launching}>
          <Save size={32} color="#10b981" />
          <h3>Save Current Map</h3>
          <p>Write .pgm + .yaml</p>
        </button>
        <button className="btn-launch" onClick={() => executeLaunch('roslaunch swarmy_display emotion_display.launch')} disabled={launching}>
          <Bot size={32} color="#f59e0b" />
          <h3>OLED Face Display</h3>
          <p>Start Emotion Engine</p>
        </button>
        <button className="btn-launch" onClick={() => executeLaunch('roslaunch Swarmy_Bot_URDF gazebo.launch')} disabled={launching}>
          <Globe size={32} color="#8b5cf6" />
          <h3>Gazebo Simulation</h3>
          <p>Virtual Environment</p>
        </button>
        <button className="btn-launch" onClick={() => { fetchMaps(); fetchProcesses(); }}>
          <RefreshCw size={32} color="var(--text-muted)" />
          <h3>Refresh Status</h3>
          <p>Reload Maps & Procs</p>
        </button>
      </div>

      {/* Saved Maps Vault */}
      <h2 style={{color: 'var(--hexa-cyan)', marginTop: '40px', marginBottom: '16px'}}><Database size={20}/> Saved Maps Vault ({maps.length} maps)</h2>
      <div className="launcher-grid map-vault">
        {maps.length > 0 ? maps.map(map => (
          <button key={map} className="btn-launch" onClick={() => executeLaunch(`roslaunch swarmy_navigation navigation_with_bringup.launch map_file:=${MAPS_DIR}/${map}.yaml`)} disabled={launching}>
            <Map size={32} color="#10b981" />
            <h3>{map.replace(/_/g, ' ').toUpperCase()}</h3>
            <p>Load & Navigate</p>
          </button>
        )) : <div style={{color: 'var(--text-muted)', gridColumn: '1/-1'}}>No maps saved yet. Use "Start SLAM Mapping" then "Save Current Map".</div>}
      </div>

      {/* Running Processes */}
      {Object.keys(processes).length > 0 && (
        <>
          <h2 style={{color: '#10b981', marginTop: '40px', marginBottom: '16px'}}><Activity size={20}/> Running Processes ({Object.keys(processes).length})</h2>
          <div className="launcher-grid">
            {Object.entries(processes).map(([id, proc]) => (
              <div key={id} className="btn-launch" style={{borderColor: '#10b981', cursor: 'default'}}>
                <CheckCircle size={24} color="#10b981" />
                <h3 style={{fontSize: '0.9rem'}}>{proc.command.substring(0, 40)}...</h3>
                <p>PID: {proc.pid}</p>
                <button className="btn-tech" style={{marginTop: '8px', borderColor: '#ff003c', color: '#ff003c'}} onClick={() => killProcess(id)}>
                  <XCircle size={14}/> Kill
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// PAGE: WORKSPACE IDE
// ============================================
function WorkspaceIDE() {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [viewingFile, setViewingFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [fileType, setFileType] = useState('text');
  const [fileMime, setFileMime] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { loadDirectory(currentPath); }, [currentPath]);

  const loadDirectory = async (pathStr) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/workspace?path=${encodeURIComponent(pathStr)}`, { headers: authHeaders() });
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) {}
    setLoading(false);
  };

  const handleFileClick = async (file) => {
    if (file.isDirectory) {
      setCurrentPath(file.path);
    } else {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/workspace/read?path=${encodeURIComponent(file.path)}`, { headers: authHeaders() });
        const data = await res.json();
        if (data.content !== undefined) {
          setViewingFile(file.name);
          setFileContent(data.content);
          setFileType(data.type || 'text');
          setFileMime(data.mime || '');
        } else {
          setViewingFile(file.name);
          setFileContent('Error: ' + (data.error || 'Could not read file'));
          setFileType('text');
        }
      } catch (e) {
        setViewingFile(file.name);
        setFileContent('Error: Network request failed.');
      }
      setLoading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
    return `${(bytes/1048576).toFixed(1)} MB`;
  };

  const pathParts = currentPath ? currentPath.split('/') : [];

  if (viewingFile) {
    return (
      <div className="page-content animate-fade-in" style={{display: 'flex', flexDirection: 'column'}}>
        <h1 className="page-title">{viewingFile}</h1>
        <div style={{display: 'flex', gap: '12px', marginBottom: '16px'}}>
          <button className="btn-tech" onClick={() => setViewingFile(null)}>← Back to Explorer</button>
          <span style={{color: 'var(--text-muted)', display: 'flex', alignItems: 'center'}}>/{currentPath}/{viewingFile}</span>
        </div>
        <div className="panel" style={{flex: 1, overflow: 'hidden', padding: 0, minHeight: '400px'}}>
          {fileType === 'image' ? (
            <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', padding: '16px'}}>
              <img src={`data:${fileMime};base64,${fileContent}`} alt={viewingFile} style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
            </div>
          ) : (
            <pre style={{
              width: '100%', height: '100%', background: '#000', color: '#00f3ff', 
              padding: '16px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.9rem',
              border: 'none', outline: 'none', overflow: 'auto', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }}>{fileContent}</pre>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-content animate-fade-in" style={{display: 'flex', flexDirection: 'column'}}>
      <h1 className="page-title">WORKSPACE EXPLORER</h1>
      <div className="panel" style={{flex: 1, display: 'flex', flexDirection: 'column'}}>
        {/* Breadcrumb Navigation */}
        <div style={{display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center'}}>
          <button className="btn-tech" onClick={() => setCurrentPath('')}>swarmy_ws</button>
          {pathParts.map((part, i) => (
            <React.Fragment key={i}>
              <span style={{color: 'var(--text-muted)'}}>/</span>
              <button className="btn-tech" onClick={() => setCurrentPath(pathParts.slice(0, i+1).join('/'))} 
                style={i === pathParts.length - 1 ? {borderColor: 'var(--hexa-purple)', color: 'var(--hexa-purple)'} : {}}>
                {part}
              </button>
            </React.Fragment>
          ))}
          <button className="btn-tech" onClick={() => loadDirectory(currentPath)} style={{marginLeft: 'auto'}}><RefreshCw size={14}/> Refresh</button>
        </div>
        
        {loading ? (
          <div className="pulse-fast text-cyan" style={{padding: '40px', textAlign: 'center'}}>Loading...</div>
        ) : (
          <div className="file-grid">
            {currentPath !== '' && (
              <div className="file-item" onClick={() => setCurrentPath(currentPath.split('/').slice(0, -1).join('/'))}>
                <FolderTree size={20} color="#f59e0b"/>
                <span>.. (go up)</span>
              </div>
            )}
            {files.map(f => (
              <div key={f.name} className="file-item" onClick={() => handleFileClick(f)}>
                {f.isDirectory ? <FolderTree size={20} color="var(--hexa-purple)"/> : <FileText size={20} color="var(--hexa-cyan)"/>}
                <div style={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
                  <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{f.name}</span>
                  {!f.isDirectory && f.size > 0 && <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{formatSize(f.size)}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PAGE: ROS GRAPH
// ============================================
function RosGraph() {
  const [nodes, setNodes] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/ros/graph`, { headers: authHeaders() });
      const data = await res.json();
      setNodes(data.nodes || []);
      setTopics(data.topics || []);
      if (data.error) setError(data.error);
    } catch (e) {
      setError('Backend unreachable');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  return (
    <div className="page-content animate-fade-in">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h1 className="page-title" style={{marginBottom: 0}}>LIVE ROS GRAPH & TOPICS</h1>
        <div style={{display: 'flex', gap: '12px'}}>
          <button className="btn-tech" onClick={fetchData}><RefreshCw size={14}/> Refresh Now</button>
          <button className={`btn-tech ${autoRefresh ? 'highlight' : ''}`} onClick={() => setAutoRefresh(!autoRefresh)}>
            <Radio size={14}/> {autoRefresh ? 'Auto: ON' : 'Auto: OFF'}
          </button>
        </div>
      </div>

      {error && <div className="alert-box warning" style={{marginBottom: '16px'}}>⚠️ {error}</div>}
      
      {loading ? (
        <div className="pulse-fast text-cyan" style={{padding: '40px', textAlign: 'center', fontSize: '1.2rem'}}>Scanning ROS Master...</div>
      ) : (
        <div className="dashboard-grid">
          <div className="panel console-panel">
            <h2 style={{position: 'sticky', top: '-24px', background: '#000', zIndex: 1, padding: '8px 0'}}>
              <Network size={18}/> Active Nodes ({nodes.length})
            </h2>
            {nodes.length > 0 ? nodes.map(n => (
              <div key={n} className="log-line info" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <CheckCircle size={12} color="#10b981"/> {n}
              </div>
            )) : <div className="log-line warning">No nodes found. Is roscore running?</div>}
          </div>
          <div className="panel console-panel">
            <h2 style={{position: 'sticky', top: '-24px', background: '#000', zIndex: 1, padding: '8px 0'}}>
              <Radio size={18}/> Active Topics ({topics.length})
            </h2>
            {topics.length > 0 ? topics.map(t => (
              <div key={t} className="log-line success">{t}</div>
            )) : <div className="log-line warning">No topics found.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PAGE: ABOUT ROBOT
// ============================================
function AboutRobot() {
  return (
    <div className="page-content animate-fade-in">
      <h1 className="page-title">ABOUT SWARMY</h1>
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px'}}>
        
        {/* Overview Panel */}
        <div className="panel" style={{gridColumn: '1 / -1'}}>
          <h2><Bot size={18}/> Robot Overview</h2>
          <p style={{color: 'var(--text-muted)', lineHeight: '1.8', fontSize: '1.1rem'}}>
            <strong style={{color: '#fff'}}>Swarmy</strong> is a fully autonomous ROS-based mobile robot platform powered by the NVIDIA Jetson Nano.
            Built for commercial-grade operations, Swarmy combines 2D SLAM mapping, autonomous path planning, real-time sensor fusion,
            and an expressive OLED face interface into a compact, deployable platform. It features a web-based enterprise dashboard
            for remote monitoring, teleoperation, and mission control.
          </p>
        </div>

        {/* Hardware Specs */}
        <div className="panel">
          <h2><Cpu size={18}/> Hardware Specifications</h2>
          <div className="data-row"><span>Compute Module</span><strong>NVIDIA Jetson Nano 4GB</strong></div>
          <div className="data-row"><span>OS</span><strong>Ubuntu 18.04 LTS (L4T)</strong></div>
          <div className="data-row"><span>ROS Version</span><strong>ROS Melodic Morenia</strong></div>
          <div className="data-row"><span>LiDAR</span><strong>YDLidar G2 (360° 2D)</strong></div>
          <div className="data-row"><span>IMU</span><strong>MPU6050 (6-axis)</strong></div>
          <div className="data-row"><span>Motors</span><strong>DC Geared with Encoders</strong></div>
          <div className="data-row"><span>Display</span><strong>SSD1306 128x64 OLED</strong></div>
          <div className="data-row"><span>Connectivity</span><strong>WiFi + USB + UART</strong></div>
        </div>

        {/* Software Stack */}
        <div className="panel">
          <h2><Terminal size={18}/> Software Stack</h2>
          <div className="data-row"><span>SLAM</span><strong>GMapping (OpenSLAM)</strong></div>
          <div className="data-row"><span>Navigation</span><strong>move_base + AMCL</strong></div>
          <div className="data-row"><span>Localization</span><strong>EKF (robot_localization)</strong></div>
          <div className="data-row"><span>Path Planning</span><strong>NavFn + TrajectoryPlanner</strong></div>
          <div className="data-row"><span>Simulation</span><strong>Gazebo 9</strong></div>
          <div className="data-row"><span>Visualization</span><strong>RViz + VNC Streaming</strong></div>
          <div className="data-row"><span>Web Backend</span><strong>Node.js + Express + JWT</strong></div>
          <div className="data-row"><span>AI Assistant</span><strong>NVIDIA GLM-5.2</strong></div>
        </div>

        {/* Capabilities */}
        <div className="panel">
          <h2><Shield size={18}/> Capabilities</h2>
          <ul style={{listStyle: 'none', padding: 0, color: '#fff', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle size={16} color="#10b981"/> Advanced 2D SLAM Mapping</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle size={16} color="#10b981"/> Fully Autonomous Navigation</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle size={16} color="#10b981"/> Web-Based Remote Teleoperation</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle size={16} color="#10b981"/> Real-Time Sensor Fusion (EKF)</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle size={16} color="#10b981"/> NVIDIA AI-Powered Diagnostics</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle size={16} color="#10b981"/> Expressive OLED Emotion Display</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle size={16} color="#10b981"/> Dynamic Map Save/Load Vault</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle size={16} color="#10b981"/> Interactive Waypoint Manager</li>
          </ul>
        </div>

        {/* Deployment Zones */}
        <div className="panel">
          <h2><Globe size={18}/> Deployment Zones</h2>
          <ul style={{listStyle: 'none', padding: 0, color: '#fff', display: 'flex', flexDirection: 'column', gap: '10px'}}>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="var(--hexa-cyan)"/> Commercial Warehouses & Logistics</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="var(--hexa-cyan)"/> University Research Laboratories</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="var(--hexa-cyan)"/> Hospital & Cleanroom Delivery</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="var(--hexa-cyan)"/> Security Patrol & Surveillance</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="var(--hexa-cyan)"/> Industrial Site Inspection</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="var(--hexa-cyan)"/> Smart Office / Hospitality</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="var(--hexa-cyan)"/> Agricultural Monitoring</li>
            <li style={{display: 'flex', alignItems: 'center', gap: '8px'}}><MapPin size={16} color="var(--hexa-cyan)"/> Disaster Response & Search</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE: DASHBOARD (LIVE SYSTEM HEALTH)
// ============================================
function DashboardPage({ health, connected }) {
  const setPowerMode = async (mode) => {
    try {
      await fetch(`${API_URL}/api/system/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ mode })
      });
      alert(`Power mode '${mode}' command sent.`);
    } catch(e) { alert('Failed to set power mode.'); }
  };

  return (
    <div className="page-content animate-fade-in">
      <h1 className="page-title">SYSTEM OVERVIEW</h1>
      <div className="dashboard-grid">
        
        {/* System Health */}
        <div className="panel">
          <h2><Activity size={18} /> System Health</h2>
          <div className="data-row"><span>CPU Usage</span><strong style={{color: health.cpu > 80 ? '#ff003c' : '#10b981'}}>{health.cpu ? health.cpu.toFixed(1) : 0}%</strong></div>
          <div className="data-row"><span>Temperature</span><strong style={{color: health.temp > 70 ? '#ff003c' : '#10b981'}}>{health.temp ? health.temp.toFixed(1) : 0}°C</strong></div>
          <div className="data-row"><span>RAM Usage</span><strong style={{color: health.ram > 85 ? '#ff003c' : '#10b981'}}>{health.ram ? health.ram.toFixed(0) : 0}%</strong></div>
          <div className="data-row"><span>Swap Space</span><strong style={{color: health.swap > 50 ? '#f59e0b' : '#10b981'}}>{health.swap ? health.swap.toFixed(1) : 0}% ({health.swapUsed}/{health.swapTotal})</strong></div>
          <div className="data-row"><span>Uptime</span><strong>{health.uptime || 'N/A'}</strong></div>
          <div className="data-row"><span>IP Address</span><strong>{health.ip || 'N/A'}</strong></div>
        </div>

        {/* CPU Cores (HTOP style) */}
        <div className="panel">
          <h2><Cpu size={18} /> CPU Core Loads</h2>
          {health.cores && health.cores.map((c, i) => (
            <div key={i} style={{marginBottom: '8px'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px'}}>
                <span>Core {i}</span>
                <span style={{color: c > 80 ? '#ff003c' : '#10b981'}}>{c.toFixed(1)}%</span>
              </div>
              <div style={{width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden'}}>
                <div style={{width: `${c}%`, height: '100%', background: c > 80 ? '#ff003c' : '#10b981', transition: 'width 0.5s ease'}}></div>
              </div>
            </div>
          ))}
          <div className="data-row" style={{marginTop: '16px'}}><span>Current Power Mode</span><strong style={{color: 'var(--hexa-cyan)'}}>{health.pwrMode || 'N/A'}</strong></div>
        </div>

        {/* Disk & Battery */}
        <div className="panel">
          <h2><HardDrive size={18} /> Power & Storage</h2>
          <div className="data-row"><span>Battery Level</span><strong style={{color: health.battery < 20 ? '#ff003c' : '#10b981'}}>{health.battery || 100}% ({health.voltage || '12.0'}V) {health.isCharging ? '🔌' : '🔋'}</strong></div>
          <div className="data-row"><span>Storage Free</span><strong>{health.diskFree || 'N/A'} / {health.diskTotal || 'N/A'}</strong></div>
          <div className="data-row"><span>Storage Used</span><strong style={{color: health.disk > 80 ? '#ff003c' : '#10b981'}}>{health.disk ? health.disk.toFixed(0) : 0}%</strong></div>
          <div className="data-row"><span>Disk Health</span><strong style={{color: health.diskHealth === 'Healthy' ? '#10b981' : '#f59e0b'}}>{health.diskHealth || 'Unknown'}</strong></div>
        </div>

        {/* Jetson Power Management */}
        <div className="panel" style={{gridColumn: '1 / -1', border: '1px solid var(--hexa-purple)', background: 'color-mix(in srgb, var(--hexa-purple) 5%, transparent)'}}>
          <h2 style={{color: 'var(--hexa-purple)'}}><Battery size={18} /> Jetson Power Management</h2>
          <div style={{display: 'flex', gap: '12px', flexWrap: 'wrap'}}>
            <button className="btn-tech" onClick={() => setPowerMode('low')}>5W Low Power Mode</button>
            <button className="btn-tech" onClick={() => setPowerMode('high')}>10W MAXN Mode</button>
            <button className="btn-tech" style={{borderColor: '#ff003c', color: '#ff003c'}} onClick={() => setPowerMode('max')}>MAX PERFORMANCE (jetson_clocks)</button>
          </div>
        </div>

        {/* Sensors & Actuators */}
        <div className="panel">
          <h2><Zap size={18} /> Hardware Status</h2>
          <div className="data-row"><span>LiDAR Sensor</span><strong style={{color: health.sensors?.lidar === 'Online' ? '#10b981' : '#ff003c'}}>● {health.sensors?.lidar || 'Offline'}</strong></div>
          <div className="data-row"><span>Depth Camera</span><strong style={{color: health.sensors?.camera === 'Online' ? '#10b981' : '#ff003c'}}>● {health.sensors?.camera || 'Offline'}</strong></div>
          <div className="data-row"><span>Base Motors</span><strong style={{color: health.sensors?.motors === 'Online' ? '#10b981' : '#ff003c'}}>● {health.sensors?.motors || 'Offline'}</strong></div>
          <div className="data-row"><span>IMU Module</span><strong style={{color: health.sensors?.imu === 'Online' ? '#10b981' : '#ff003c'}}>● {health.sensors?.imu || 'Offline'}</strong></div>
        </div>


        {/* Connection Status */}
        <div className="panel">
          <h2><Wifi size={18}/> Connectivity</h2>
          <div className="data-row">
            <span>ROS Bridge</span>
            <strong style={{color: connected ? '#10b981' : '#ff003c'}}>{connected ? '● CONNECTED' : '● DISCONNECTED'}</strong>
          </div>
          <div className="data-row"><span>ROS Master</span><strong>http://localhost:11311</strong></div>
          <div className="data-row"><span>Web Backend</span><strong style={{color: '#10b981'}}>● Port 3001</strong></div>
          <div className="data-row"><span>VNC Server</span><strong style={{color: '#10b981'}}>● Port 6080</strong></div>
          <div className="data-row"><span>ROSBridge</span><strong style={{color: connected ? '#10b981' : '#ff003c'}}>● Port 9090</strong></div>
        </div>

        {/* Autonomous Mapping Panel */}
        <div className="panel" style={{gridColumn: '1 / -1', border: '1px solid var(--hexa-cyan)', background: 'color-mix(in srgb, var(--hexa-cyan) 5%, transparent)'}}>
          <h2 style={{color: 'var(--hexa-cyan)', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <Play size={18} /> Autonomous Mapping
          </h2>
          <p style={{color: 'var(--text-muted)', marginBottom: '16px'}}>
            Deploy the AI to explore and map unknown environments automatically using frontier exploration.
          </p>
          <div style={{display: 'flex', gap: '16px'}}>
            <button className="btn-launch" onClick={async () => {
              try {
                // Ensure all old nodes release the USB ports first to prevent [Errno 9] Bad file descriptor
                await fetch(`${API_URL}/api/kill`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...authHeaders() },
                  body: JSON.stringify({ killAll: true })
                });
                await new Promise(r => setTimeout(r, 2500)); // wait for ports to clear

                await fetch(`${API_URL}/api/launch`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...authHeaders() },
                  body: JSON.stringify({ command: 'roslaunch swarmy_navigation autonomous_mapping.launch' })
                });
                alert('Autonomous Mapping Initialized! The robot will now start exploring.');
              } catch (e) {
                alert('Failed to launch autonomous mapping.');
              }
            }}>
              <Play size={16} /> LAUNCH AUTONOMOUS MAPPING
            </button>
            <button className="btn-emergency" onClick={async () => {
              try {
                await fetch(`${API_URL}/api/kill`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...authHeaders() },
                  body: JSON.stringify({ killAll: true })
                });
                alert('All ROS processes stopped.');
              } catch(e) {}
            }}>
              <XCircle size={16} /> STOP ALL
            </button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="panel" style={{gridColumn: '1 / -1'}}>
          <h2><AlertTriangle size={18} color="#f59e0b"/> System Alerts</h2>
          <div className="alert-box info">Dashboard connected. All backend services operational.</div>
          {!connected && <div className="alert-box warning">⚠️ ROSBridge WebSocket is disconnected. Teleoperation joystick will not function.</div>}
          {health.temp > 70 && <div className="alert-box warning">⚠️ High temperature detected: {health.temp.toFixed(1)}°C. Consider cooling the Jetson Nano.</div>}
          {health.cpu > 85 && <div className="alert-box warning">⚠️ CPU load critical: {health.cpu.toFixed(1)}%. Too many ROS nodes may be running.</div>}
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE: TELEOPERATION
// ============================================
function Teleoperation() {
  const joystickZoneRef = useRef(null);
  const [speed, setSpeed] = useState({ linear: 0, angular: 0 });
  const [rosStatus, setRosStatus] = useState('connecting');
  const [teleopEnabled, setTeleopEnabled] = useState(false);
  const [teleopLoading, setTeleopLoading] = useState(false);
  const rosRef = useRef(null);

  // Poll teleop bridge status every 3 seconds
  useEffect(() => {
    const checkStatus = () => {
      fetch(`${API_URL}/api/teleop/status`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => setTeleopEnabled(data.active))
        .catch(() => {});
    };
    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleTeleop = async () => {
    setTeleopLoading(true);
    try {
      const endpoint = teleopEnabled ? '/api/teleop/disable' : '/api/teleop/enable';
      const resp = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() }
      });
      const data = await resp.json();
      if (data.success) {
        // Wait a moment for the process to start/stop, then re-check status
        setTimeout(async () => {
          const s = await fetch(`${API_URL}/api/teleop/status`, { headers: authHeaders() }).then(r => r.json());
          setTeleopEnabled(s.active);
          setTeleopLoading(false);
        }, 2000);
      } else {
        setTeleopLoading(false);
      }
    } catch (e) {
      setTeleopLoading(false);
    }
  };

  useEffect(() => {
    if (!joystickZoneRef.current) return;
    console.log('[Teleop] Initializing own ROS connection...');
    
    // Create a dedicated ROS connection for this component
    const myRos = new ROSLIB.Ros({ url: `ws://${window.location.hostname}:9090` });
    rosRef.current = myRos;
    let cmdVel = null;
    let manager = null;
    let moveInterval = null;
    let currentLinear = 0;
    let currentAngular = 0;

    const initJoystick = () => {
      if (joystickZoneRef.current && !manager) {
        joystickZoneRef.current.innerHTML = '';
        manager = nipplejs.create({ zone: joystickZoneRef.current, mode: 'static', position: { left: '50%', top: '50%' }, color: '#00f3ff', size: 150 });
        
        manager.on('move', (evt, data) => {
          if (!data.angle) return;
          currentLinear = Math.sin(data.angle.radian) * 0.5 * (data.distance / 75);
          currentAngular = -Math.cos(data.angle.radian) * 1.0 * (data.distance / 75);
          try { setSpeed({ linear: currentLinear, angular: currentAngular }); } catch(e){}

          if (!moveInterval) {
            moveInterval = setInterval(() => {
              if (cmdVel) {
                cmdVel.publish(new ROSLIB.Message({ linear: { x: currentLinear, y: 0, z: 0 }, angular: { x: 0, y: 0, z: currentAngular } }));
              }
              fetch(`${API_URL}/api/teleop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ linear: currentLinear, angular: currentAngular })
              }).catch(()=>{});
            }, 100);
          }
        });
        
        manager.on('end', () => {
          if (moveInterval) { clearInterval(moveInterval); moveInterval = null; }
          currentLinear = 0;
          currentAngular = 0;
          try { setSpeed({ linear: 0, angular: 0 }); } catch(e){}
          
          fetch(`${API_URL}/api/teleop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ linear: 0, angular: 0 })
          }).catch(()=>{});
          
          if (cmdVel) {
            cmdVel.publish(new ROSLIB.Message({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } }));
          }
        });
      }
    };

    setTimeout(initJoystick, 500);

    myRos.on('connection', () => {
      console.log('[Teleop] ROS connected! Setting up joystick...');
      setRosStatus('connected');
      cmdVel = new ROSLIB.Topic({ ros: myRos, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
      cmdVel.advertise();
      initJoystick();
    });

    myRos.on('error', (err) => { console.error('[Teleop] ROS error:', err); setRosStatus('error'); });
    myRos.on('close', () => { console.warn('[Teleop] ROS closed'); setRosStatus('disconnected'); });

    return () => {
      console.log('[Teleop] Cleanup');
      if (moveInterval) clearInterval(moveInterval);
      if (manager) manager.destroy();
      if (cmdVel) cmdVel.unadvertise();
      myRos.close();
    };
  }, []);

  return (
    <div className="page-content animate-fade-in" style={{display: 'flex', gap: '24px'}}>
      <KeyboardTeleop rosInstance={rosRef.current} />
      <div className="panel" style={{flex: 1}}>
        <h2><Gamepad2 size={18} /> Manual Teleoperation <span style={{fontSize: '0.6em', color: 'var(--hexa-cyan)', background: 'rgba(0, 243, 255, 0.1)', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px'}}>v3.0 (Independent)</span></h2>
        
        {/* Enable/Disable Teleop Toggle */}
        <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', padding: '12px', background: teleopEnabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${teleopEnabled ? '#10b981' : '#ef4444'}`, borderRadius: '8px'}}>
          <button
            onClick={toggleTeleop}
            disabled={teleopLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: teleopLoading ? 'wait' : 'pointer',
              background: teleopEnabled ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', fontWeight: 700, fontSize: '0.95rem',
              boxShadow: teleopEnabled ? '0 0 15px rgba(239,68,68,0.3)' : '0 0 15px rgba(16,185,129,0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            <Power size={18} />
            {teleopLoading ? 'Processing...' : teleopEnabled ? 'Disable Motor Control' : 'Enable Motor Control'}
          </button>
          <div style={{flex: 1}}>
            <div style={{fontWeight: 600, color: teleopEnabled ? '#10b981' : '#ef4444', fontSize: '0.95rem'}}>
              {teleopEnabled ? '🟢 Motors Active — Joystick Ready' : '🔴 Motors Offline — Enable to drive'}
            </div>
            <div style={{fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px'}}>
              {teleopEnabled ? 'The robot will respond to joystick input. No mapping or navigation required.' : 'Click "Enable Motor Control" to activate independent joystick driving.'}
            </div>
          </div>
        </div>

        {rosStatus !== 'connected' && <div className="alert-box warning" style={{marginBottom: '16px'}}>⚠️ ROSBridge {rosStatus}. Using Direct Serial Override.</div>}
        {rosStatus === 'connected' && <div className="alert-box info" style={{marginBottom: '16px'}}>✅ Joystick connected to /cmd_vel via ROSBridge</div>}
        <div className="joystick-zone" ref={joystickZoneRef} style={{height: '350px', marginTop: '16px'}}></div>
        <div style={{display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '24px'}}>
          <div className="data-row" style={{borderBottom: 'none'}}>
            <span>Linear X:&nbsp;</span>
            <strong style={{color: 'var(--hexa-cyan)'}}>{speed.linear.toFixed(3)} m/s</strong>
          </div>
          <div className="data-row" style={{borderBottom: 'none'}}>
            <span>Angular Z:&nbsp;</span>
            <strong style={{color: 'var(--hexa-purple)'}}>{speed.angular.toFixed(3)} rad/s</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENT: KEYBOARD TELEOP
// ============================================
function KeyboardTeleop({ rosInstance }) {
  const [speed, setSpeed] = useState({ linear: 0, angular: 0 });
  const [isActive, setIsActive] = useState(false);
  const cmdRef = useRef(null);
  
  // State for the current speeds
  const vRef = useRef(0);
  const wRef = useRef(0);
  
  useEffect(() => {
    if (!rosInstance) return;
    const cmdVel = new ROSLIB.Topic({ ros: rosInstance, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
    cmdVel.advertise();
    cmdRef.current = cmdVel;
    
    return () => {
      cmdVel.unadvertise();
      cmdRef.current = null;
    };
  }, [rosInstance]);

  useEffect(() => {
    if (!isActive) return;
    
    const handleKeyDown = (e) => {
      if (e.repeat) return;
      const key = e.key.toLowerCase();
      let changed = false;
      
      if (key === 'i' || key === 'w' || key === 'ArrowUp') { vRef.current = 0.5; changed = true; }
      else if (key === ',' || key === 's' || key === 'ArrowDown') { vRef.current = -0.5; changed = true; }
      else if (key === 'j' || key === 'a' || key === 'ArrowLeft') { wRef.current = 1.0; changed = true; }
      else if (key === 'l' || key === 'd' || key === 'ArrowRight') { wRef.current = -1.0; changed = true; }
      else if (key === 'k' || key === ' ') { vRef.current = 0; wRef.current = 0; changed = true; }
      
      if (changed && cmdRef.current) {
        setSpeed({ linear: vRef.current, angular: wRef.current });
        cmdRef.current.publish(new ROSLIB.Message({
          linear: { x: vRef.current, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: wRef.current }
        }));
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      let changed = false;
      
      if ((key === 'i' || key === 'w' || key === 'ArrowUp') && vRef.current > 0) { vRef.current = 0; changed = true; }
      else if ((key === ',' || key === 's' || key === 'ArrowDown') && vRef.current < 0) { vRef.current = 0; changed = true; }
      else if ((key === 'j' || key === 'a' || key === 'ArrowLeft') && wRef.current > 0) { wRef.current = 0; changed = true; }
      else if ((key === 'l' || key === 'd' || key === 'ArrowRight') && wRef.current < 0) { wRef.current = 0; changed = true; }
      
      if (changed && cmdRef.current) {
        setSpeed({ linear: vRef.current, angular: wRef.current });
        cmdRef.current.publish(new ROSLIB.Message({
          linear: { x: vRef.current, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: wRef.current }
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      // Force stop on unmount/blur
      if (cmdRef.current) {
        cmdRef.current.publish(new ROSLIB.Message({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } }));
      }
    };
  }, [isActive]);

  return (
    <div 
      className={`panel ${isActive ? 'highlight' : ''}`}
      style={{
        marginTop: '16px', 
        cursor: 'pointer', 
        border: isActive ? '2px solid var(--hexa-cyan)' : '1px solid var(--glass-border)',
        boxShadow: isActive ? '0 0 15px rgba(0, 243, 255, 0.4)' : 'none',
        transition: 'all 0.3s'
      }}
      onClick={() => setIsActive(!isActive)}
    >
      <h3 style={{marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px'}}>
        <Gamepad2 size={16}/> Web Keyboard Control
      </h3>
      {isActive ? (
        <div className="alert-box info" style={{fontSize: '0.85em'}}>
          ✅ ACTIVE: Use <strong>W/A/S/D</strong> or <strong>Arrow Keys</strong> or <strong>I/J/K/L</strong> to drive. Click to disable.
        </div>
      ) : (
        <div className="alert-box warning" style={{fontSize: '0.85em'}}>
          ❌ INACTIVE: Click here to enable keyboard control.
        </div>
      )}
      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.9em'}}>
        <span>Linear: <strong style={{color: 'var(--hexa-cyan)'}}>{speed.linear.toFixed(2)}</strong></span>
        <span>Angular: <strong style={{color: 'var(--hexa-purple)'}}>{speed.angular.toFixed(2)}</strong></span>
      </div>
    </div>
  );
}

// ============================================
// PAGE: SLAM & SIMULATION (VNC)
// ============================================
// ============================================
// PAGE: AUTONOMOUS MAPPING
// ============================================
function AutonomousMappingView({ connected }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vncKey, setVncKey] = useState(0);
  
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
  
  const refreshVnc = () => { setVncKey(k => k + 1); };

  return (
    <div className="page-content animate-fade-in" style={{display: 'flex', flexDirection: 'column', height: '100%', position: 'relative'}}>


      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px'}}>
        <h1 className="page-title" style={{marginBottom: 0}}>AUTONOMOUS MAPPING PIPELINE</h1>
        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
          <button className="btn-tech highlight" onClick={async () => {
              await fetch(`${API_URL}/api/kill`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ killAll: true }) });
              await new Promise(r => setTimeout(r, 2500));
              await executeCmd('roslaunch swarmy_navigation autonomous_mapping.launch');
          }}>
            <Play size={16}/> Start Auto Mapping
          </button>
          <button className="btn-emergency" onClick={async () => {
            await fetch(`${API_URL}/api/kill`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ killAll: true }) });
          }}>
            <XCircle size={16}/> Kill All
          </button>
          <button className="btn-tech" onClick={() => {
            const name = prompt('Enter a name for the new map:', 'map_' + Date.now());
            if(name) executeCmd(`rosrun map_server map_saver -f /home/swarmy_bot/swarmy_ws/src/swarmy_navigation/maps/${name}`);
          }} style={{background: 'var(--hexa-cyan)', color: '#000'}}>
            <Save size={16}/> Save Map
          </button>
          <button className="btn-tech" onClick={refreshVnc} style={{background: '#6366f1'}}>
            <RotateCw size={16}/> Refresh RViz
          </button>
          <button className="btn-tech highlight" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Maximize2 size={16}/> {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>

      <div className="nav-view-body" style={{display: 'flex', flex: 1, gap: '16px', overflow: 'auto'}}>
        <div className="panel" style={isFullscreen ? {
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, padding: 0, margin: 0, borderRadius: 0
        } : {flex: 3, padding: 0, overflow: 'hidden'}}>
          <div style={{position: 'relative', width: '100%', height: '85vh', flex: 1, minHeight: '400px'}}>
            <VncViewer src={`http://${window.location.hostname}:6080/vnc.html?resize=scale&autoconnect=true`} />
          </div>
          {isFullscreen && (
            <button onClick={() => setIsFullscreen(false)} style={{
              position: 'absolute', top: '16px', right: '16px', zIndex: 10000, background: 'rgba(255,0,60,0.8)', color: '#fff', border: 'none', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold'
            }}>EXIT FULLSCREEN</button>
          )}
        </div>
        <div className="panel" style={{flex: 1, overflowY: 'auto'}}>
          <h2 style={{color: 'var(--hexa-cyan)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px'}}>
            <Compass size={24} /> Frontier Exploration
          </h2>
          <p style={{color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.6'}}>
            The AI uses <strong>explore_lite</strong> to autonomously chart unknown frontiers.
          </p>
          <div className="alert-box info" style={{marginTop: '16px', fontSize: '0.9rem'}}>
            <strong>Tip:</strong> Use the <strong>"Publish Point"</strong> tool in the RViz toolbar above to manually guide the robot to a specific area if it gets stuck! The robot will automatically navigate to any point you click.
          </div>
        </div>
      </div>
    </div>
  );
}

function MappingView({ connected }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const joystickZoneRef = useRef(null);
  const [speed, setSpeed] = useState({ linear: 0, angular: 0 });
  const [rosStatus, setRosStatus] = useState('connecting');
  const [vncKey, setVncKey] = useState(0);
  const rosRef = useRef(null);

  useEffect(() => {
    if (!joystickZoneRef.current) return;
    console.log('[MapView] Initializing own ROS connection...');
    
    const myRos = new ROSLIB.Ros({ url: `ws://${window.location.hostname}:9090` });
    // Save ROS instance to ref for Keyboard component
    rosRef.current = myRos;
    let cmdVel = null;
    let manager = null;
    let moveInterval = null;
    let currentLinear = 0;
    let currentAngular = 0;

    const initJoystick = () => {
      if (joystickZoneRef.current && !manager) {
        joystickZoneRef.current.innerHTML = '';
        manager = nipplejs.create({ zone: joystickZoneRef.current, mode: 'static', position: { left: '50%', top: '50%' }, color: '#00f3ff', size: 100 });
        
        manager.on('move', (evt, data) => {
          if (!data.angle) return;
          currentLinear = Math.sin(data.angle.radian) * 0.5 * (data.distance / 50);
          currentAngular = -Math.cos(data.angle.radian) * 1.0 * (data.distance / 50);
          try { setSpeed({ linear: currentLinear, angular: currentAngular }); } catch(e){}

          if (!moveInterval) {
            moveInterval = setInterval(() => {
              if (cmdVel) {
                cmdVel.publish(new ROSLIB.Message({ linear: { x: currentLinear, y: 0, z: 0 }, angular: { x: 0, y: 0, z: currentAngular } }));
              }
              fetch(`${API_URL}/api/teleop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ linear: currentLinear, angular: currentAngular })
              }).catch(()=>{});
            }, 100);
          }
        });
        
        manager.on('end', () => {
          if (moveInterval) { clearInterval(moveInterval); moveInterval = null; }
          currentLinear = 0;
          currentAngular = 0;
          try { setSpeed({ linear: 0, angular: 0 }); } catch(e){}
          
          fetch(`${API_URL}/api/teleop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ linear: 0, angular: 0 })
          }).catch(()=>{});
          
          if (cmdVel) {
            cmdVel.publish(new ROSLIB.Message({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } }));
          }
        });
      }
    };

    setTimeout(initJoystick, 500);

    myRos.on('connection', () => {
      console.log('[MapView] ROS connected! Setting up joystick...');
      setRosStatus('connected');
      cmdVel = new ROSLIB.Topic({ ros: myRos, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
      cmdVel.advertise();
      initJoystick();
    });

    myRos.on('error', (err) => { console.error('[MapView] ROS error:', err); setRosStatus('error'); });
    myRos.on('close', () => { console.warn('[MapView] ROS closed'); setRosStatus('disconnected'); });

    return () => {
      console.log('[MapView] Cleanup');
      if (moveInterval) clearInterval(moveInterval);
      if (manager) manager.destroy();
      if (cmdVel) cmdVel.unadvertise();
      myRos.close();
    };
  }, []);

  const executeCmd = async (command) => {
    try {
      const isLaunch = command.includes('roslaunch') || (command.includes('rosrun') && !command.includes('map_saver'));
      const endpoint = isLaunch ? '/api/launch' : '/api/terminal';
      await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ command })
      });
    } catch (e) {
      alert('Failed to execute command');
    }
  };

  // Force VNC iframe reload
  const refreshVnc = () => { setVncKey(k => k + 1); };

  return (
    <div className="page-content animate-fade-in" style={{minHeight: '100%', height: 'auto', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden'}}>
      <KeyboardTeleop rosInstance={rosRef.current} />
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px'}}>
        <h1 className="page-title" style={{marginBottom: 0}}>2D SLAM MAPPING DASHBOARD</h1>
        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
          <button className="btn-tech highlight" onClick={async () => {
            await executeCmd('roslaunch swarmy_navigation mapping.launch');
          }}>
            <Play size={16}/> Restart Mapping
          </button>
          <button className="btn-emergency" onClick={async () => {
            await fetch(`${API_URL}/api/kill`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ killAll: true }) });
          }}>
            <XCircle size={16}/> Instantly Kill
          </button>
          <button className="btn-tech" onClick={() => executeCmd(`rosrun map_server map_saver -f /home/swarmy_bot/swarmy_ws/src/swarmy_navigation/maps/map_${Date.now()}`)} style={{background: 'var(--hexa-cyan)', color: '#000'}}>
            <Save size={16}/> Save Map
          </button>
          <button className="btn-emergency" onClick={() => executeCmd('rm /home/swarmy_bot/swarmy_ws/src/swarmy_navigation/maps/* || true')}>
            <XCircle size={16}/> Delete Maps
          </button>
          <button className="btn-tech" onClick={refreshVnc} style={{background: '#6366f1'}}>
            <RotateCw size={16}/> Refresh RViz
          </button>
          <button className="btn-tech highlight" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Maximize2 size={16}/> {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen RViz'}
          </button>
        </div>
      </div>
      
      <div className="nav-view-body" style={{display: 'flex', flex: 1, gap: '16px', overflow: 'auto'}}>
        {/* VNC Stream Panel */}
        <div className="panel" style={isFullscreen ? {
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, padding: 0, margin: 0, borderRadius: 0
        } : {flex: 3, padding: 0, overflow: 'hidden'}}>
          <div style={{position: 'relative', width: '100%', height: '85vh', flex: 1, minHeight: '400px'}}>
            <VncViewer src={`http://${window.location.hostname}:6080/vnc.html?resize=scale&autoconnect=true`} />
          </div>
          {isFullscreen && (
            <button onClick={() => setIsFullscreen(false)} style={{
              position: 'absolute', top: '16px', right: '16px', zIndex: 10000, background: 'rgba(255,0,60,0.8)', color: '#fff', border: 'none', padding: '8px 16px', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 'bold'
            }}>EXIT FULLSCREEN</button>
          )}
        </div>

        {/* Teleoperation Sidebar Panel */}
        <div className="panel" style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: '8px'}}><Gamepad2 size={18}/> SLAM Drive</h2>
          {rosStatus !== 'connected' && <div className="alert-box warning" style={{fontSize: '0.85rem'}}>⚠️ ROS {rosStatus}</div>}
          {rosStatus === 'connected' && <div className="alert-box info" style={{fontSize: '0.85rem'}}>✅ Joystick live</div>}
          <div className="joystick-zone" ref={joystickZoneRef} style={{flex: 1, minHeight: '150px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px'}}></div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div className="data-row" style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <span>Linear X:</span>
              <strong style={{color: 'var(--hexa-cyan)'}}>{speed.linear.toFixed(2)} m/s</strong>
            </div>
            <div className="data-row" style={{borderBottom: 'none'}}>
              <span>Angular Z:</span>
              <strong style={{color: 'var(--hexa-purple)'}}>{speed.angular.toFixed(2)} rad/s</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



// ============================================
// PAGE: AUTONOMOUS NAVIGATION DASHBOARD
// ============================================
function NavigationView({ connected }) {
  const [iframeInteract, setIframeInteract] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const joystickZoneRef = useRef(null);
  const [speed, setSpeed] = useState({ linear: 0, angular: 0 });
  const [rosStatus, setRosStatus] = useState('connecting');
  const [vncKey, setVncKey] = useState(0);
  const rosRef = useRef(null);
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState('');

  const fetchMaps = async () => {
    try {
      const res = await fetch(`${API_URL}/api/workspace?path=src/swarmy_navigation/maps`, { headers: authHeaders() });
      const data = await res.json();
      if(data.files) {
        const mapFiles = data.files.filter(f => f.name.endsWith('.yaml')).map(f => f.name.replace('.yaml', ''));
        setMaps(mapFiles);
        if(mapFiles.length > 0 && !selectedMap) setSelectedMap(mapFiles[0]);
      }
    } catch(e) {}
  };

  useEffect(() => { fetchMaps(); }, []);

  useEffect(() => {
    if (!joystickZoneRef.current) return;
    const myRos = new ROSLIB.Ros({ url: `ws://${window.location.hostname}:9090` });
    rosRef.current = myRos;
    let cmdVel = null;
    let manager = null;
    let moveInterval = null;
    let currentLinear = 0;
    let currentAngular = 0;

    const initJoystick = () => {
      if (joystickZoneRef.current && !manager) {
        joystickZoneRef.current.innerHTML = '';
        manager = nipplejs.create({ zone: joystickZoneRef.current, mode: 'static', position: { left: '50%', top: '50%' }, color: '#00f3ff', size: 100 });
        
        manager.on('move', (evt, data) => {
          if (!data.angle) return;
          currentLinear = Math.sin(data.angle.radian) * 0.5 * (data.distance / 50);
          currentAngular = -Math.cos(data.angle.radian) * 1.0 * (data.distance / 50);
          try { setSpeed({ linear: currentLinear, angular: currentAngular }); } catch(e){}

          if (!moveInterval) {
            moveInterval = setInterval(() => {
              if (cmdVel) {
                cmdVel.publish(new ROSLIB.Message({ linear: { x: currentLinear, y: 0, z: 0 }, angular: { x: 0, y: 0, z: currentAngular } }));
              }
              fetch(`${API_URL}/api/teleop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ linear: currentLinear, angular: currentAngular })
              }).catch(()=>{});
            }, 100);
          }
        });
        
        manager.on('end', () => {
          if (moveInterval) { clearInterval(moveInterval); moveInterval = null; }
          currentLinear = 0; currentAngular = 0;
          try { setSpeed({ linear: 0, angular: 0 }); } catch(e){}
          
          fetch(`${API_URL}/api/teleop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({ linear: 0, angular: 0 })
          }).catch(()=>{});
          
          if (cmdVel) {
            cmdVel.publish(new ROSLIB.Message({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } }));
          }
        });
      }
    };

    setTimeout(initJoystick, 500);

    myRos.on('connection', () => {
      setRosStatus('connected');
      cmdVel = new ROSLIB.Topic({ ros: myRos, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
      cmdVel.advertise();
      initJoystick();
    });

    myRos.on('error', () => setRosStatus('error'));
    myRos.on('close', () => setRosStatus('disconnected'));

    return () => {
      if (moveInterval) clearInterval(moveInterval);
      if (manager) manager.destroy();
      if (cmdVel) cmdVel.unadvertise();
      myRos.close();
    };
  }, []);

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

  const refreshVnc = () => { setVncKey(k => k + 1); };

  // --- 2D Nav Goal Publisher ---
  const [goalStatus, setGoalStatus] = useState('');
  const [goalX, setGoalX] = useState('');
  const [goalY, setGoalY] = useState('');
  const [goalTheta, setGoalTheta] = useState('0');

  const publishNavGoal = () => {
    const x = parseFloat(goalX);
    const y = parseFloat(goalY);
    const theta = parseFloat(goalTheta) || 0;
    if (isNaN(x) || isNaN(y)) return setGoalStatus('❌ Invalid coordinates');
    
    const ros = rosRef.current;
    if (!ros) return setGoalStatus('❌ ROSBridge not connected');
    
    const goalTopic = new ROSLIB.Topic({
      ros: ros,
      name: '/move_base_simple/goal',
      messageType: 'geometry_msgs/PoseStamped'
    });
    
    const qz = Math.sin(theta / 2);
    const qw = Math.cos(theta / 2);
    
    const goalMsg = new ROSLIB.Message({
      header: { frame_id: 'map', stamp: { secs: 0, nsecs: 0 } },
      pose: {
        position: { x: x, y: y, z: 0 },
        orientation: { x: 0, y: 0, z: qz, w: qw }
      }
    });
    
    goalTopic.publish(goalMsg);
    setGoalStatus(`✅ Goal sent: (${x.toFixed(2)}, ${y.toFixed(2)}) θ=${(theta * 180 / Math.PI).toFixed(0)}°`);
    setTimeout(() => setGoalStatus(''), 5000);
  };

  const cancelNavGoal = () => {
    const ros = rosRef.current;
    if (!ros) return;
    const cancelTopic = new ROSLIB.Topic({
      ros: ros,
      name: '/move_base/cancel',
      messageType: 'actionlib_msgs/GoalID'
    });
    cancelTopic.publish(new ROSLIB.Message({ id: '' }));
    setGoalStatus('🛑 Navigation cancelled');
    setTimeout(() => setGoalStatus(''), 3000);
  };

  return (
    <div className="page-content animate-fade-in" style={{minHeight: '100%', height: 'auto', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px'}}>
        <h1 className="page-title" style={{marginBottom: 0}}>AUTONOMOUS NAVIGATION DASHBOARD</h1>
        <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center'}}>
          <select value={selectedMap} onChange={(e) => setSelectedMap(e.target.value)} style={{padding: '8px', borderRadius: '4px', background: '#333', color: '#fff', border: '1px solid var(--hexa-cyan)', fontFamily: "'Rajdhani', sans-serif"}}>
            {maps.length === 0 ? <option value="">No maps found</option> : maps.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="btn-tech" onClick={fetchMaps} style={{padding: '8px', background: 'transparent', border: 'none'}} title="Refresh Map List"><RefreshCw size={16}/></button>

          <button className="btn-tech highlight" onClick={async () => {
            if(!selectedMap) return alert('Please select a map first!');
            await executeCmd(`roslaunch swarmy_navigation navigation_with_bringup.launch map_file:=/home/swarmy_bot/swarmy_ws/src/swarmy_navigation/maps/${selectedMap}.yaml`);
          }}>
            <Play size={16}/> Start Navigation
          </button>
          <button className="btn-emergency" onClick={async () => {
            await fetch(`${API_URL}/api/kill`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify({ killAll: true }) });
          }}>
            <XCircle size={16}/> Instantly Kill
          </button>
          <button className="btn-tech" onClick={refreshVnc} style={{background: '#6366f1'}}>
            <RotateCw size={16}/> Refresh RViz
          </button>
          <button className="btn-tech highlight" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Maximize2 size={16}/> {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen RViz'}
          </button>
        </div>
      </div>
      
      <div className="nav-view-body" style={{display: 'flex', flex: 1, gap: '16px', overflow: 'auto'}}>
        <div className="panel" style={isFullscreen ? {
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, padding: 0, margin: 0, borderRadius: 0
        } : {flex: 3, padding: 0, overflow: 'hidden'}}>
          <div style={{position: 'relative', width: '100%', height: '85vh', flex: 1, minHeight: '400px'}}>
            <VncViewer src={`http://${window.location.hostname}:6080/vnc.html?resize=scale&autoconnect=true`} />
          </div>
          {isFullscreen && (
            <button onClick={() => setIsFullscreen(false)} style={{
              position: 'absolute', top: '16px', right: '16px', zIndex: 10000, background: 'rgba(255,0,60,0.8)', color: '#fff', border: 'none', padding: '8px 16px', cursor: 'pointer', fontFamily: "'Rajdhani', sans-serif", fontWeight: 'bold'
            }}>EXIT FULLSCREEN</button>
          )}
        </div>

        <div className="panel" style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '16px'}}>
          <h2 style={{fontSize: '1.2rem', marginBottom: '8px'}}><Gamepad2 size={18}/> Navigation Teleop Override</h2>
          {rosStatus !== 'connected' && <div className="alert-box warning" style={{fontSize: '0.85rem'}}>⚠️ ROS {rosStatus}</div>}
          {rosStatus === 'connected' && <div className="alert-box info" style={{fontSize: '0.85rem'}}>✅ Joystick live</div>}
          <div className="joystick-zone" ref={joystickZoneRef} style={{flex: 1, minHeight: '150px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px'}}></div>
          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
            <div className="data-row" style={{borderBottom: '1px solid rgba(255,255,255,0.1)'}}>
              <span>Linear X:</span>
              <strong style={{color: 'var(--hexa-cyan)'}}>{speed.linear.toFixed(2)} m/s</strong>
            </div>
            <div className="data-row" style={{borderBottom: 'none'}}>
              <span>Angular Z:</span>
              <strong style={{color: 'var(--hexa-purple)'}}>{speed.angular.toFixed(2)} rad/s</strong>
            </div>
          </div>

          {/* 2D Nav Goal Publisher */}
          <div style={{borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px'}}>
            <h3 style={{fontSize: '1rem', marginBottom: '8px', color: 'var(--hexa-cyan)'}}><MapPin size={16}/> Autonomous Navigation Goals</h3>
            
            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              {/* Send Goal (Pose) */}
              <div>
                <div style={{fontSize: '0.85rem', marginBottom: '4px'}}>2D Nav Goal (Pose)</div>
                <div style={{display: 'flex', gap: '6px', marginBottom: '6px'}}>
                  <input type="number" step="0.1" placeholder="X" value={goalX} onChange={e => setGoalX(e.target.value)} style={{flex: 1, padding: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px', fontFamily: "'Rajdhani', sans-serif"}} />
                  <input type="number" step="0.1" placeholder="Y" value={goalY} onChange={e => setGoalY(e.target.value)} style={{flex: 1, padding: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px', fontFamily: "'Rajdhani', sans-serif"}} />
                  <input type="number" step="0.1" placeholder="θ" value={goalTheta} onChange={e => setGoalTheta(e.target.value)} style={{flex: 1, padding: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px', fontFamily: "'Rajdhani', sans-serif"}} />
                </div>
                <div style={{display: 'flex', gap: '6px'}}>
                  <button className="btn-tech highlight" onClick={publishNavGoal} style={{flex: 1, fontSize: '0.85rem'}}><Navigation size={14}/> Send Goal</button>
                  <button className="btn-emergency" onClick={cancelNavGoal} style={{flex: 1, fontSize: '0.85rem'}}><XCircle size={14}/> Cancel Nav</button>
                </div>
              </div>

              {/* Publish Point */}
              <div style={{borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '12px'}}>
                <div style={{fontSize: '0.85rem', marginBottom: '4px'}}>Publish Point (Waypoint)</div>
                <div style={{display: 'flex', gap: '6px', marginBottom: '6px'}}>
                  <input type="number" step="0.1" placeholder="X" id="ptX" style={{flex: 1, padding: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px', fontFamily: "'Rajdhani', sans-serif"}} />
                  <input type="number" step="0.1" placeholder="Y" id="ptY" style={{flex: 1, padding: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px', fontFamily: "'Rajdhani', sans-serif"}} />
                  <input type="number" step="0.1" placeholder="Z" id="ptZ" defaultValue="0" style={{flex: 1, padding: '6px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '4px', fontFamily: "'Rajdhani', sans-serif"}} />
                </div>
                <button className="btn-tech outline" onClick={() => {
                  const ros = rosRef.current;
                  if (!ros) return setGoalStatus('❌ ROSBridge not connected');
                  const x = parseFloat(document.getElementById('ptX').value);
                  const y = parseFloat(document.getElementById('ptY').value);
                  const z = parseFloat(document.getElementById('ptZ').value) || 0;
                  if (isNaN(x) || isNaN(y)) return setGoalStatus('❌ Invalid coordinates for point');
                  
                  const ptTopic = new ROSLIB.Topic({ ros: ros, name: '/clicked_point', messageType: 'geometry_msgs/PointStamped' });
                  ptTopic.publish(new ROSLIB.Message({ header: { frame_id: 'map', stamp: { secs: 0, nsecs: 0 } }, point: { x, y, z } }));
                  setGoalStatus(`✅ Published Point: (${x.toFixed(2)}, ${y.toFixed(2)})`);
                  setTimeout(() => setGoalStatus(''), 5000);
                }} style={{width: '100%', fontSize: '0.85rem'}}><MapPin size={14}/> Publish Point</button>
              </div>
            </div>
            {goalStatus && <div className="alert-box info" style={{fontSize: '0.8rem', marginTop: '12px'}}>{goalStatus}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}


function WebTerminal() {
  const [history, setHistory] = useState([{ type: 'sys', text: 'Welcome to Swarmy Web Terminal (Jetson Nano) - ROS Melodic Environment Active' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history]);

  const executeCmd = async () => {
    if (!input.trim() || loading) return;
    const cmd = input.trim();
    setHistory(prev => [...prev, { type: 'in', text: `swarmy_bot@jetson:~$ ${cmd}` }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/terminal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ command: cmd })
      });
      const data = await res.json();
      if (data.error) {
        setHistory(prev => [...prev, { type: 'err', text: `bash: ${data.error}` }]);
      } else {
        if (data.stdout) setHistory(prev => [...prev, { type: 'out', text: data.stdout }]);
        if (data.stderr) setHistory(prev => [...prev, { type: 'err', text: data.stderr }]);
        if (!data.stdout && !data.stderr) setHistory(prev => [...prev, { type: 'sys', text: '[Command executed with no output]' }]);
      }
    } catch (e) {
      setHistory(prev => [...prev, { type: 'err', text: 'Network Error: Failed to reach backend terminal.' }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); executeCmd(); }
  };

  return (
    <div className="page-content animate-fade-in" style={{display: 'flex', flexDirection: 'column', height: '100%', position: 'relative'}}>


      <h1 className="page-title">SYSTEM TERMINAL</h1>
      <div className="panel" style={{flex: 1, padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
        <div style={{flex: 1, background: '#05050a', overflowY: 'auto', padding: '16px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.9rem', lineHeight: '1.4'}}>
          {history.map((h, i) => (
            <div key={i} style={{
              color: h.type === 'in' ? '#00f3ff' : h.type === 'err' ? '#ff003c' : h.type === 'sys' ? '#bd00ff' : '#e2e8f0',
              marginBottom: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }}>{h.text}</div>
          ))}
          {loading && <div className="pulse-fast text-cyan" style={{marginBottom: '8px'}}>Executing...</div>}
          <div ref={endRef} />
        </div>
        <div style={{display: 'flex', padding: '12px', background: '#0f172a', borderTop: '1px solid var(--hexa-cyan)'}}>
          <span style={{color: '#10b981', marginRight: '8px', fontFamily: "'Share Tech Mono', monospace"}}>swarmy_bot@jetson:~$</span>
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey} disabled={loading}
            style={{flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontFamily: "'Share Tech Mono', monospace", fontSize: '1rem'}}
            placeholder="Type a bash or ROS command..." autoFocus />
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE: ALL LAUNCH FILES BROWSER
// ============================================
function AllLaunchFiles() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [filter, setFilter] = useState('');

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/launch-files`, { headers: authHeaders() });
      const data = await res.json();
      setFiles(data.files || []);
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchFiles(); }, [fetchFiles]);

  const executeLaunch = async (command) => {
    setLaunching(true);
    setStatusMsg(`⏳ Launching ${command}...`);
    try {
      const res = await fetch(`${API_URL}/api/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ command })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(`✅ Launched (PID: ${data.pid})`);
      } else {
        setStatusMsg(`❌ Error: ${data.error}`);
      }
    } catch (e) {
      setStatusMsg('❌ Error connecting to backend.');
    }
    setLaunching(false);
    setTimeout(() => setStatusMsg(''), 5000);
  };

  const grouped = files.filter(f => f.name.toLowerCase().includes(filter.toLowerCase())).reduce((acc, f) => {
    if (!acc[f.package]) acc[f.package] = [];
    acc[f.package].push(f);
    return acc;
  }, {});

  return (
    <div className="page-content animate-fade-in">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
        <h1 className="page-title" style={{marginBottom: 0}}>ALL LAUNCH FILES</h1>
        <div style={{display: 'flex', gap: '12px'}}>
          <input type="text" placeholder="Search launch files..." value={filter} onChange={e => setFilter(e.target.value)}
            style={{background: 'rgba(0,0,0,0.5)', border: '1px solid var(--hexa-cyan)', color: '#fff', padding: '6px 12px', fontFamily: "'Share Tech Mono', monospace", outline: 'none'}} />
          <button className="btn-tech" onClick={fetchFiles}><RefreshCw size={14}/> Scan Workspace</button>
        </div>
      </div>

      {statusMsg && <div className="alert-box info" style={{marginBottom: '16px'}}>{statusMsg}</div>}

      {loading ? (
        <div className="pulse-fast text-cyan" style={{padding: '40px', textAlign: 'center'}}>Scanning swarmy_ws for .launch files...</div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
          {Object.keys(grouped).sort().map(pkg => (
            <div key={pkg} className="panel" style={{padding: '16px'}}>
              <h2 style={{fontSize: '1.1rem', margin: '0 0 16px 0', color: 'var(--hexa-purple)'}}><FolderTree size={16}/> Package: {pkg}</h2>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px'}}>
                {grouped[pkg].map(f => (
                  <div key={f.fullPath} style={{background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', padding: '12px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hexa-cyan)', fontFamily: "'Share Tech Mono', monospace"}}>
                      <FileCode size={16}/> {f.name}
                    </div>
                    <button className="btn-tech highlight" style={{width: '100%', justifyContent: 'center', marginTop: 'auto'}} onClick={() => executeLaunch(f.rosCommand)} disabled={launching}>
                      <Play size={14}/> Execute Launch
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// PAGE: SYSTEM MANAGER
// ============================================
function SystemManager() {
  const [services, setServices] = useState({});
  const [loading, setLoading] = useState(true);
  const [topData, setTopData] = useState('');
  const [isTopActive, setIsTopActive] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    let interval;
    if (isTopActive) {
      const fetchTop = async () => {
        try {
          const res = await fetch(`${API_URL}/api/system/top`, { headers: authHeaders() });
          const data = await res.json();
          if (data.top) setTopData(data.top);
        } catch (e) {}
      };
      fetchTop();
      interval = setInterval(fetchTop, 1500); // 1.5s interval for live feel
    }
    return () => clearInterval(interval);
  }, [isTopActive]);

  useEffect(() => {
    if (endRef.current && isTopActive) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [topData, isTopActive]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/system/services`, { headers: authHeaders() });
      const data = await res.json();
      setServices(data.services || {});
    } catch (e) {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const restartSvc = async (svc) => {
    if (!window.confirm(`Restart ${svc}.service? This may temporarily disconnect you.`)) return;
    try {
      await fetch(`${API_URL}/api/system/restart-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ service: svc })
      });
      alert(`${svc} restart command sent.`);
      setTimeout(fetchServices, 2000);
    } catch(e) {
      alert(`Failed to restart ${svc}`);
    }
  };

  const rebootSystem = async () => {
    if (!window.confirm(`⚠️ DANGER: REBOOT NVIDIA JETSON NANO\n\nThe robot will completely reboot and all connections will drop. Are you sure?`)) return;
    try {
      await fetch(`${API_URL}/api/system/reboot`, { method: 'POST', headers: authHeaders() });
      alert('Reboot initiated. Dashboard will go offline in a few seconds.');
    } catch(e) {
      alert('Failed to send reboot command.');
    }
  };

  const changePowerMode = async (mode) => {
    if (!window.confirm(`Are you sure you want to change power mode to: ${mode}?`)) return;
    try {
      await fetch(`${API_URL}/api/system/power`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ mode })
      });
      alert(`Power mode command for '${mode}' sent to hardware.`);
    } catch(e) {
      alert('Failed to change power mode.');
    }
  };

  return (
    <div className="page-content animate-fade-in">
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
        <h1 className="page-title" style={{marginBottom: 0}}>SYSTEM SERVICES MANAGER</h1>
        <button className="btn-tech" onClick={fetchServices}><RefreshCw size={14}/> Refresh Status</button>
      </div>

      <div className="dashboard-grid">
        <div className="panel" style={{gridColumn: '1 / -1'}}>
          <h2><Server size={18}/> Background Linux Services</h2>
          {loading ? (
            <div className="pulse-fast text-cyan">Checking systemctl status...</div>
          ) : (
            <div style={{display: 'flex', flexDirection: 'column', gap: '16px'}}>
              {Object.entries(services).map(([svc, status]) => (
                <div key={svc} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', padding: '16px', borderRadius: '4px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                    {status === 'active' ? <CheckCircle size={20} color="#10b981"/> : <AlertTriangle size={20} color="#ff003c"/>}
                    <div>
                      <h3 style={{margin: 0, fontFamily: "'Share Tech Mono', monospace", color: 'var(--hexa-cyan)'}}>{svc}.service</h3>
                      <span style={{fontSize: '0.8rem', color: status === 'active' ? '#10b981' : '#ff003c', textTransform: 'uppercase'}}>{status}</span>
                    </div>
                  </div>
                  <button className="btn-tech" onClick={() => restartSvc(svc)}>
                    <RotateCw size={14}/> Restart Service
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel" style={{gridColumn: '1 / -1', border: '1px solid #ff003c', background: 'rgba(255,0,60,0.05)'}}>
          <h2 style={{color: '#ff003c', borderBottomColor: 'rgba(255,0,60,0.3)'}}><AlertTriangle size={18}/> Hardware Power Options</h2>
          <p style={{color: 'var(--text-muted)', marginBottom: '16px'}}>These commands directly control the NVIDIA Jetson Nano hardware. Proceed with caution.</p>
          <div style={{display: 'flex', gap: '16px', flexWrap: 'wrap'}}>
            <button className="btn-tech" style={{borderColor: '#10b981', color: '#10b981'}} onClick={() => changePowerMode('low')}>
              <Battery size={16}/> 5W MODE
            </button>
            <button className="btn-tech" style={{borderColor: '#f59e0b', color: '#f59e0b'}} onClick={() => changePowerMode('high')}>
              <Zap size={16}/> 10W MAXN
            </button>
            <button className="btn-tech" style={{borderColor: '#bd00ff', color: '#bd00ff'}} onClick={() => changePowerMode('max')}>
              <Rocket size={16}/> MAXN + CLOCKS
            </button>
            <button className="btn-tech" style={{borderColor: '#ff003c', color: '#ff003c'}} onClick={() => changePowerMode('shutdown')}>
              <Power size={16}/> SHUTDOWN
            </button>
            <button className="btn-emergency" onClick={rebootSystem}>
              <RotateCw size={16}/> REBOOT SYSTEM
            </button>
          </div>
        </div>

        <div className="panel" style={{gridColumn: '1 / -1', display: 'flex', flexDirection: 'column'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
            <h2 style={{margin: 0, color: 'var(--hexa-cyan)'}}><Terminal size={18}/> Live Process Monitor (htop)</h2>
            <div style={{display: 'flex', gap: '12px'}}>
              <button className="btn-tech" onClick={() => setIsTopActive(true)} disabled={isTopActive} style={{opacity: isTopActive ? 0.5 : 1}}>
                <Play size={14}/> Start Live Feed
              </button>
              <button className="btn-emergency" onClick={() => setIsTopActive(false)} disabled={!isTopActive} style={{opacity: !isTopActive ? 0.5 : 1, padding: '8px 16px', background: 'rgba(255,0,60,0.1)'}}>
                <Pause size={14}/> Stop Feed
              </button>
            </div>
          </div>
          
          <div style={{
            background: '#05050a', 
            borderRadius: '8px', 
            border: '1px solid var(--glass-border)',
            padding: '16px',
            flex: 1,
            overflowY: 'auto',
            minHeight: '350px',
            maxHeight: '500px'
          }}>
            {isTopActive ? (
              <pre style={{
                margin: 0,
                color: '#10b981',
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: '0.85rem',
                lineHeight: '1.4',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {topData || 'Initializing live process feed from Jetson Nano...'}
                <div ref={endRef} />
              </pre>
            ) : (
              <div style={{display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: "'Share Tech Mono', monospace"}}>
                Process monitor is currently offline. Click 'Start Live Feed' to begin streaming.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE: AI CHAT (NVIDIA NEMOTRON)
// ============================================
function AIChat({ isActiveTab = true }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem('swarmy_ai_chat');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState('minimaxai/minimax-m3');
  const [streamingMessage, setStreamingMessage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  
  // Voice Settings State
  const [voiceProfile, setVoiceProfile] = useState(() => localStorage.getItem('swarmy_voice_profile') || 'doraemon');
  const [elevenLabsKey, setElevenLabsKey] = useState(() => localStorage.getItem('swarmy_eleven_key') || '');
  const [elevenLabsVoiceId, setElevenLabsVoiceId] = useState(() => localStorage.getItem('swarmy_eleven_vid') || '');
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const speakingRef = useRef(true);

  const [voiceMode, setVoiceMode] = useState(true); // Default to on
  const [aiState, setAiState] = useState('idle');
  const silenceTimerRef = useRef(null);

  const [currentEmotion, setCurrentEmotion] = useState('neutral');
  const rosRef = useRef(null);

  const [battery, setBattery] = useState(null);
  const batteryWarnedRef = useRef(false);
  const sendMessageRef = useRef(null);

  useEffect(() => {
    try {
      rosRef.current = new window.ROSLIB.Ros({ url: `ws://${window.location.hostname}:9090` });
      
      const batTopic = new window.ROSLIB.Topic({
        ros: rosRef.current,
        name: '/battery_state',
        messageType: 'sensor_msgs/BatteryState'
      });
      batTopic.subscribe((msg) => {
        setBattery(msg);
      });
    } catch (e) {
      console.log('ROS connection failed in AIChat', e);
    }
    return () => { if(rosRef.current) rosRef.current.close(); };
  }, []);

  useEffect(() => {
    if (battery && battery.percentage < 0.20 && !batteryWarnedRef.current && sendMessageRef.current) {
      batteryWarnedRef.current = true;
      sendMessageRef.current(`SYSTEM ALERT: The robot's battery is critically low! Percentage is ${(battery.percentage*100).toFixed(0)}%, Voltage is ${battery.voltage.toFixed(1)}V. Please verbally warn the user immediately and suggest they plug in the charger.`);
    }
  }, [battery]);
  const voiceModeRef = useRef(true);
  const aiStateRef = useRef('idle');
  const hasGreetedRef = useRef(false);

  const updateAiState = (state) => {
    aiStateRef.current = state;
    setAiState(state);
  };

  useEffect(() => {
    voiceModeRef.current = voiceMode;
    if (voiceMode) {
      startListen();
    } else {
      stopListen();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      updateAiState('idle');
    }
  }, [voiceMode]);

  useEffect(() => {
    if (!hasGreetedRef.current && voiceMode) {
      hasGreetedRef.current = true;
      setTimeout(() => sendMessage("Hello! Say your name and introduce yourself!"), 1000);
    }
  }, []);

  const toggleSpeaking = () => {
    speakingRef.current = !speakingRef.current;
    setIsSpeaking(speakingRef.current);
    if (!speakingRef.current && window.speechSynthesis) window.speechSynthesis.cancel();
  };

  const speak = (text) => {
    return new Promise(async (resolve) => {
      if (!speakingRef.current) return resolve();
      updateAiState('speaking');
      try {
        const cleanText = text.replace(/[*#`~]/g, '').trim();
        if (!cleanText) return resolve();
        
        const vProf = localStorage.getItem('swarmy_voice_profile') || 'doraemon';
        const eKey = localStorage.getItem('swarmy_eleven_key') || '';
        const eVid = localStorage.getItem('swarmy_eleven_vid') || '';

        const res = await fetch(`${API_URL}/api/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ 
            text: cleanText,
            voiceProfile: vProf,
            elevenLabsKey: eKey,
            elevenLabsVoiceId: eVid
          })
        });
        
        if (res.ok) {
          const data = await res.json();
          const audios = data.audios;
          if (!audios || audios.length === 0) return resolve();
          
          let currentIdx = 0;
          const playNext = () => {
            if (currentIdx >= audios.length) return resolve();
            const audio = new Audio(audios[currentIdx]);
            audio.preservesPitch = false;
            // The backend handles pitch shift for physical speakers.
            // For the frontend dummy audio, we don't need pitch shift since it's muted, but we set it just in case.
            if (vProf === 'doraemon') audio.playbackRate = 1.35;
            else if (vProf === 'glados') audio.playbackRate = 1.15;
            else audio.playbackRate = 1.0;
            // MUTE the frontend so only the robot's physical speakers play the sound,
            // but keep the element playing silently to trigger 'onended' for UI sync
            audio.volume = 0;
            audio.muted = true;
            
            audio.onended = () => { currentIdx++; playNext(); };
            audio.onerror = () => { currentIdx++; playNext(); };
            audio.play().catch(e => { console.error("Audio playback error:", e); currentIdx++; playNext(); });
          };
          playNext();
        } else { resolve(); }
      } catch (e) {
        console.error("TTS fetch failed", e);
        resolve();
      }
    });
  };

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
        }
        if (finalTranscript) {
          setInput(prev => {
             const newText = prev + (prev ? ' ' : '') + finalTranscript;
             if (voiceModeRef.current) {
               if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
               silenceTimerRef.current = setTimeout(() => {
                 stopListen();
                 sendMessage(newText);
               }, 1500);
             }
             return newText;
          });
        }
      };

      recognitionRef.current.onend = () => {
         if (voiceModeRef.current && aiStateRef.current === 'listening') {
            try { recognitionRef.current.start(); } catch(e){}
         }
      };
    }
  }, []);

  const startListen = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch(e){}
      setIsListening(true);
      updateAiState('listening');
    } else {
       alert('Microphone access requires a secure HTTPS connection.');
    }
  };

  const stopListen = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  useEffect(() => {
    localStorage.setItem('swarmy_ai_chat', JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const sendMessage = async (overrideText = null) => {
    const textToSend = typeof overrideText === 'string' ? overrideText : input;
    if (!textToSend.trim() || loading) return;
    
    stopListen();
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    updateAiState('thinking');
    
    const userMsg = { role: 'user', content: textToSend.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    const vProf = localStorage.getItem('swarmy_voice_profile') || 'doraemon';
    const activeModel = localStorage.getItem('swarmy_ai_model') || 'minimaxai/minimax-m3';

    // Inject Persona Prompt dynamically
    let systemPrompt = "You are Swarmy, an intelligent mobile robot assistant. Respond in 1-2 short sentences maximum.\\nYou have FULL control over the robot hardware. You can execute ANY ROS command.\\n\\nMOVEMENT COMMANDS (include in your response):\\n<cmd>forward</cmd>, <cmd>backward</cmd>, <cmd>left</cmd>, <cmd>right</cmd>, <cmd>spin</cmd>, <cmd>dance</cmd>, <cmd>stop</cmd>\\n\\nEMOTION TAGS (include in your response):\\n<emotion>happy</emotion>, <emotion>sad</emotion>, <emotion>angry</emotion>, <emotion>surprised</emotion>, <emotion>love</emotion>, <emotion>excited</emotion>, <emotion>thinking</emotion>, <emotion>scanning</emotion>, <emotion>celebrating</emotion>\\n\\nROBOT ACTION COMMANDS (wrap in EXEC tags - the system will execute them automatically):\\n- Start autonomous mapping: <EXEC>roslaunch swarmy_navigation autonomous_mapping.launch</EXEC>\\n- Start manual mapping: <EXEC>roslaunch swarmy_navigation mapping.launch</EXEC>\\n- Start navigation with a map: <EXEC>roslaunch swarmy_navigation navigation_with_bringup.launch map_file:=/home/swarmy_bot/swarmy_ws/src/swarmy_navigation/maps/MAP_NAME.yaml</EXEC>\\n- Save current map: <EXEC>rosrun map_server map_saver -f /home/swarmy_bot/swarmy_ws/src/swarmy_navigation/maps/MAP_NAME</EXEC>\\n- Stop all processes: <EXEC>KILL_ALL</EXEC>\\n- Change speaker volume: <EXEC>amixer -c Device sset Speaker X%</EXEC>\\n- Check battery: <EXEC>python3 -c \\\"import smbus2; b=smbus2.SMBus(1); v=(b.read_i2c_block_data(0x40,0x02,2)[0]<<8|b.read_i2c_block_data(0x40,0x02,2)[1])*1.25/1000; print(f'{v:.1f}V {max(0,min(100,int((v-9.9)/(12.6-9.9)*100)))}%')\\\"</EXEC>\\n- List saved maps: <EXEC>ls /home/swarmy_bot/swarmy_ws/src/swarmy_navigation/maps/*.yaml</EXEC>\\n\\nIMPORTANT RULES:\\n1. Before starting mapping or navigation, ALWAYS first stop existing processes: <EXEC>KILL_ALL</EXEC>, then wait, then launch.\\n2. When user says 'start mapping' or 'map the room', use autonomous_mapping.launch.\\n3. When user says 'stop' or 'emergency stop', use <EXEC>KILL_ALL</EXEC> and <cmd>stop</cmd>.\\n4. When user says 'save map' or 'save the map', ask for a name or use a default name.\\n5. When user says 'navigate' or 'go to', start navigation with the most recent map.\\n6. You MUST always include at least one <emotion> tag in your response.\\n7. Keep responses EXTREMELY short for fast TTS. Maximum 1-2 sentences.\\n8. You MUST ALWAYS identify yourself as Swarmy, never as Doraemon or any other character.\\n9. Your creators are Naman Sain and Souvik Mallik.";
    if (vProf === 'jarvis') systemPrompt = "You are JARVIS. Respond formally and politely in 1-2 short sentences. Address the user as 'Sir' or 'Ma'am'.\n" + systemPrompt;
    if (vProf === 'ultron') systemPrompt = "You are Ultron. Respond with a menacing, philosophical, and slightly condescending tone in 1-2 short sentences. Refer to humanity's flaws.\n" + systemPrompt;
    if (vProf === 'glados') systemPrompt = "You are GLaDOS. Respond with passive-aggressive, cold, and sarcastic remarks in 1-2 short sentences.\n" + systemPrompt;
    if (vProf === 'doraemon') systemPrompt = "You are Swarmy, an intelligent mobile robot. You MUST ALWAYS introduce and refer to yourself as Swarmy, never as Doraemon. However, you should speak with the enthusiastic, helpful, and energetic tone of the Hindi-dubbed Doraemon cartoon character. You were created by Naman Sain and Souvik Mallik.\n" + systemPrompt;

    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ 
          messages: [{ role: 'system', content: systemPrompt }, ...newMessages.map(m => ({ role: m.role, content: m.content }))], 
          model: activeModel 
        })
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      setStreamingMessage({ role: 'assistant', content: '', reasoning: '' });
      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false, finalContent = '', finalReasoning = '', buffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (let line of lines) {
            line = line.trim();
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.replace('data: ', ''));
                if (data.choices?.[0]?.delta?.content) finalContent += data.choices[0].delta.content;
                if (data.choices?.[0]?.delta?.reasoning_content) finalReasoning += data.choices[0].delta.reasoning_content;
                setStreamingMessage({ role: 'assistant', content: finalContent, reasoning: finalReasoning });
              } catch (e) {}
            }
          }
        }
      }

      let cleanText = finalContent;
      const cmdMatch = finalContent.match(/<cmd>(.*?)<\/cmd>/);
      const emotionMatch = finalContent.match(/<emotion>(.*?)<\/emotion>/);
      
      if (emotionMatch && emotionMatch[1]) {
        setCurrentEmotion(emotionMatch[1].trim());
        cleanText = cleanText.replace(/<emotion>.*?<\/emotion>/g, '');
      } else {
        setCurrentEmotion('neutral');
      }
      
      if (cmdMatch && cmdMatch[1] && rosRef.current) {
        const cmd = cmdMatch[1].trim().toLowerCase();
        const cmdVel = new window.ROSLIB.Topic({ ros: rosRef.current, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
        let twist = new window.ROSLIB.Message({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } });
        if (cmd === 'forward') twist.linear.x = 0.5;
        else if (cmd === 'backward') twist.linear.x = -0.5;
        else if (cmd === 'left') twist.angular.z = 1.0;
        else if (cmd === 'right') twist.angular.z = -1.0;
        else if (cmd === 'spin') twist.angular.z = 2.0;
        else if (cmd === 'dance') { twist.linear.x = 0.5; twist.angular.z = 2.0; }
        
        cmdVel.publish(twist);
        if (cmd !== 'stop') {
          setTimeout(() => {
            cmdVel.publish(new window.ROSLIB.Message({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } }));
          }, 3000);
        }
        cleanText = cleanText.replace(/<cmd>.*?<\/cmd>/g, '');
      }

      // First strip EXEC tags from cleanText so we don't speak them
      const execMatches = finalContent.match(/<EXEC>([\s\S]*?)<\/EXEC>/g);
      if (execMatches) {
        cleanText = cleanText.replace(/<EXEC>[\s\S]*?<\/EXEC>/g, '');
      }

      setMessages(prev => [...prev, { role: 'assistant', content: finalContent, reasoning: finalReasoning }]);
      setStreamingMessage(null);
      
      // Speak FIRST before executing any heavy ROS launches
      await speak(cleanText);

      // NOW handle <EXEC> tags from AI - execute robot commands
      if (execMatches) {
        for (const execTag of execMatches) {
          const command = execTag.replace(/<\/?EXEC>/g, '').trim();
          try {
            if (command === 'KILL_ALL') {
              await fetch(`${API_URL}/api/kill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ killAll: true })
              });
            } else if (command.includes('roslaunch') || (command.includes('rosrun') && !command.includes('map_saver'))) {
              // Kill existing processes first for launch commands
              await fetch(`${API_URL}/api/kill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ killAll: true })
              });
              await new Promise(r => setTimeout(r, 2500));
              await fetch(`${API_URL}/api/launch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ command })
              });
            } else {
              await fetch(`${API_URL}/api/terminal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: JSON.stringify({ command })
              });
            }
          } catch (e) { console.error('EXEC failed:', command, e); }
        }
      }
      
      if (voiceModeRef.current) {
         updateAiState('listening');
         try { recognitionRef.current.start(); } catch(e){}
      } else {
         updateAiState('idle');
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to reach AI backend.' }]);
      setStreamingMessage(null);
      updateAiState(voiceModeRef.current ? 'listening' : 'idle');
    }
    setLoading(false);
  };

  sendMessageRef.current = sendMessage;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="page-content animate-fade-in" style={{display: isActiveTab ? 'flex' : 'none', flexDirection: 'column', height: '100%', position: 'relative'}}>
      
      {/* AI Voice Mode Overlay */}
      {aiState !== 'idle' && voiceMode && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(10, 15, 30, 0.85)', backdropFilter: 'blur(10px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 999, transition: 'all 0.3s ease'
        }}>
          <div style={{
             width: '300px', height: '300px', borderRadius: '50%',
             background: 'rgba(0,0,0,0.5)',
             boxShadow: `0 0 40px ${aiState === 'listening' ? 'var(--hexa-cyan)' : aiState === 'thinking' ? 'var(--hexa-purple)' : '#ff003c'}`,
             display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
             animation: (aiState === 'listening' || aiState === 'thinking') ? 'pulse 1.5s infinite' : 'none'
          }}>
             <RobotFace emotion={aiState === 'listening' ? 'listening' : aiState === 'thinking' ? 'thinking' : currentEmotion} size={300} />
          </div>
          <h2 style={{marginTop: '30px', color: '#fff', fontSize: '1.5rem', letterSpacing: '2px', textTransform: 'uppercase'}}>
            {aiState === 'listening' ? 'Listening...' : aiState === 'thinking' ? 'Thinking...' : 'Speaking...'}
          </h2>
          <button onClick={() => setVoiceMode(false)} className="btn-tech" style={{marginTop: '40px', borderColor: '#ff003c', color: '#ff003c'}}>
            Exit Voice Mode
          </button>
        </div>
      )}

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <h1 className="page-title" style={{marginBottom: 0}}>SWARMY AI ASSISTANT</h1>
          
          {battery && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px', 
              background: battery.percentage < 0.20 ? 'rgba(255,0,60,0.2)' : 'rgba(0,0,0,0.5)',
              padding: '4px 10px', borderRadius: '20px', 
              border: `1px solid ${battery.percentage < 0.20 ? '#ff003c' : 'var(--hexa-cyan)'}`,
              color: battery.percentage < 0.20 ? '#ff003c' : 'var(--hexa-cyan)',
              fontSize: '0.85rem'
            }}>
              <Battery size={16} color={battery.percentage < 0.20 ? '#ff003c' : 'var(--hexa-cyan)'}/>
              <span>{(battery.percentage * 100).toFixed(0)}% ({battery.voltage.toFixed(1)}V)</span>
            </div>
          )}

          <button className="btn-emergency" onClick={() => setMessages([])} style={{padding: '6px 12px', fontSize: '0.8rem'}}>
            <XCircle size={14}/> Clear Memory
          </button>
        </div>
      </div>
      
      <div className="panel" style={{flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden'}}>
        {/* Chat Messages */}
        <div style={{flex: 1, overflow: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px'}}>
          {messages.length === 0 && (
            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px', color: 'var(--text-muted)'}}>
              <Brain size={48} color="var(--hexa-purple)" />
              <p style={{fontSize: '1.1rem'}}>Ask me anything about Swarmy, ROS, SLAM, navigation, or robotics.</p>
              <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center'}}>
                {['Why is my SLAM map drifting?', 'How to tune move_base parameters?', 'Diagnose LiDAR scan issues', 'Explain EKF sensor fusion'].map(q => (
                  <button key={q} className="btn-tech" style={{fontSize: '0.8rem'}} onClick={() => { setInput(q); }}>{q}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              background: m.role === 'user' ? 'rgba(0, 243, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
              borderLeft: m.role === 'assistant' ? '3px solid var(--hexa-purple)' : 'none',
              borderRight: m.role === 'user' ? '3px solid var(--hexa-cyan)' : 'none',
              border: `1px solid ${m.role === 'user' ? 'rgba(0, 243, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              padding: '12px 16px',
              borderRadius: '8px',
              maxWidth: '80%',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.9rem',
              lineHeight: '1.6',
              color: m.role === 'user' ? 'var(--hexa-cyan)' : '#fff',
              boxShadow: m.role === 'user' ? '0 0 10px rgba(0, 243, 255, 0.1)' : 'none'
            }}>
              <div style={{fontSize: '0.75rem', opacity: 0.7, marginBottom: '6px', color: m.role === 'user' ? 'var(--hexa-cyan)' : 'var(--hexa-purple)', textTransform: 'uppercase'}}>
                {m.role === 'user' ? 'Operator' : 'Swarmy AI'}
              </div>
              {m.reasoning && (
                <div style={{fontSize: '0.85rem', color: '#a0aec0', marginBottom: '10px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderLeft: '2px solid var(--hexa-purple)', borderRadius: '4px', fontStyle: 'italic', whiteSpace: 'pre-wrap'}}>
                  <strong>Thinking Process:</strong><br/>
                  {m.reasoning}
                </div>
              )}
              <div style={{whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>{m.content}</div>
            </div>
          ))}
          
          {streamingMessage && (
            <div style={{
              alignSelf: 'flex-start',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              padding: '12px 16px',
              borderRadius: '8px',
              maxWidth: '80%',
            }}>
              <div style={{fontSize: '0.75rem', opacity: 0.7, marginBottom: '6px', color: 'var(--hexa-purple)', textTransform: 'uppercase'}}>
                Swarmy AI (Computing...)
              </div>
              {streamingMessage.reasoning && (
                <div style={{fontSize: '0.85rem', color: '#a0aec0', marginBottom: '10px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderLeft: '2px solid var(--hexa-purple)', borderRadius: '4px', fontStyle: 'italic', whiteSpace: 'pre-wrap'}}>
                  <strong>Thinking Process:</strong><br/>
                  {streamingMessage.reasoning}
                </div>
              )}
              <div style={{whiteSpace: 'pre-wrap', lineHeight: '1.5'}}>{streamingMessage.content}</div>
            </div>
          )}

          {loading && !streamingMessage && (
            <div style={{alignSelf: 'flex-start', padding: '12px'}}>
              <span className="typing-indicator" style={{color: 'var(--hexa-cyan)'}}>...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        
        {/* Input */}
        <div style={{display: 'flex', padding: '12px', background: 'rgba(0,0,0,0.6)', borderTop: '1px solid var(--glass-border)', gap: '8px'}}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isListening ? "Listening..." : "Ask Swarmy AI anything..."}
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--hexa-cyan)',
              padding: '10px 14px', fontFamily: "'Share Tech Mono', monospace", fontSize: '0.95rem',
              outline: 'none', resize: 'none', borderRadius: '4px'
            }}
          />
          <button 
            onClick={() => setVoiceMode(!voiceMode)}
            title="Toggle Continuous Voice Mode" 
            style={{
            background: voiceMode ? 'var(--hexa-purple)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${voiceMode ? 'var(--hexa-purple)' : 'var(--glass-border)'}`,
            borderRadius: '4px',
            padding: '0 16px',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
            animation: voiceMode ? 'pulse 1.5s infinite' : 'none'
          }}>
            <Mic size={20} />
          </button>
          <button onClick={sendMessage} disabled={loading || !input.trim()} style={{
            background: 'var(--hexa-purple)', border: 'none', color: '#fff', padding: '10px 20px',
            cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
            fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: '1rem', borderRadius: '4px',
            opacity: loading || !input.trim() ? 0.5 : 1
          }}>
            <Send size={16}/> SEND
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// PAGE: ROBOT FACE DISPLAY
// ============================================
function RobotFacePage({ health }) {
  const [currentEmotion, setCurrentEmotion] = useState('happy');
  const [autoMode, setAutoMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const autoRef = useRef(null);

  useEffect(() => {
    if (autoMode) {
      let idx = 0;
      autoRef.current = setInterval(() => {
        idx = (idx + 1) % EMOTION_LIST.length;
        setCurrentEmotion(EMOTION_LIST[idx]);
      }, 2000);
    } else {
      if (autoRef.current) clearInterval(autoRef.current);
    }
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [autoMode]);

  const filteredEmotions = EMOTION_LIST.filter(e => e.toLowerCase().includes(searchQuery.toLowerCase()));

  const categories = {
    'Basic': ['happy', 'sad', 'angry', 'surprised', 'neutral', 'sleepy', 'confused', 'disgusted', 'scared', 'bored'],
    'Positive': ['excited', 'love', 'grateful', 'proud', 'amused', 'hopeful', 'confident', 'peaceful', 'cheerful', 'delighted', 'ecstatic', 'blissful', 'content', 'optimistic', 'inspired'],
    'Negative': ['anxious', 'frustrated', 'disappointed', 'jealous', 'lonely', 'guilty', 'ashamed', 'heartbroken', 'devastated', 'furious', 'irritated', 'melancholy', 'gloomy', 'pessimistic', 'bitter'],
    'Social': ['shy', 'embarrassed', 'flirty', 'sarcastic', 'smug', 'apologetic', 'sympathetic', 'curious', 'suspicious', 'mischievous'],
    'Physical': ['tired', 'hungry', 'sick', 'dizzy', 'freezing', 'hot', 'energetic', 'relaxed', 'uncomfortable', 'pain'],
    'Cognitive': ['thinking', 'focused', 'daydreaming', 'mindblown', 'eureka', 'calculating', 'puzzled', 'overwhelmed', 'determined', 'contemplating'],
    'Robot': ['booting', 'charging', 'low_battery', 'error', 'updating', 'scanning', 'processing', 'idle', 'listening', 'speaking', 'alert', 'malfunction', 'rebooting', 'connected', 'disconnected'],
    'Actions': ['greeting', 'farewell', 'celebrating', 'dancing', 'laughing', 'crying', 'yawning', 'winking', 'nodding', 'shaking_head', 'saluting', 'bowing', 'clapping', 'pointing', 'shrugging']
  };

  return (
    <div className="page-content animate-fade-in" style={{minHeight: '100%', height: 'auto', display: 'flex', flexDirection: 'column', overflowY: 'auto', overflowX: 'hidden'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px'}}>
        <h1 className="page-title" style={{marginBottom: 0}}><Eye size={24}/> ROBOT FACE DISPLAY</h1>
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <span style={{fontSize: '0.9rem', color: 'var(--text-muted)'}}>Current: <strong style={{color: 'var(--hexa-cyan)'}}>{currentEmotion}</strong></span>
          <button className={`btn-tech ${autoMode ? 'highlight' : ''}`} onClick={() => setAutoMode(!autoMode)}>
            <RefreshCw size={14}/> {autoMode ? 'Stop Auto' : 'Auto Cycle'}
          </button>
        </div>
      </div>

      <div className="nav-view-body" style={{display: 'flex', flex: 1, gap: '16px', overflow: 'auto'}}>
        {/* Face Canvas */}
        <div className="panel" style={{flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1e', minHeight: '400px', position: 'relative'}}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, 
            padding: '12px 24px', 
            borderBottom: '1px solid rgba(0, 243, 255, 0.3)', 
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: 'rgba(0,0,0,0.4)',
            gap: '16px',
            zIndex: 10
          }}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', color: health?.battery < 20 ? '#ff003c' : '#00f3ff'}}>
              <Battery size={24} />
              <span style={{fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'Outfit'}}>{health?.battery || 0}%</span>
            </div>
            <div style={{width: '1px', height: '24px', background: 'rgba(255,255,255,0.2)'}}></div>
            <div style={{display: 'flex', alignItems: 'center', gap: '4px', color: '#a0aabf'}}>
              <Zap size={18} color="#f59e0b" />
              <span style={{fontSize: '1rem', fontFamily: "'Share Tech Mono', monospace"}}>{health?.voltage || '0.0'} V</span>
            </div>
          </div>
          <RobotFace emotion={currentEmotion} size={400} />
        </div>

        {/* Emotion Selector */}
        <div className="panel" style={{flex: 1, overflow: 'auto', padding: '16px'}}>
          <input 
            type="text" 
            placeholder="Search emotions..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)}
            style={{width: '100%', padding: '8px 12px', marginBottom: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: '#fff', borderRadius: '6px', fontFamily: "'Rajdhani', sans-serif"}}
          />
          
          {searchQuery ? (
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '6px'}}>
              {filteredEmotions.map(e => (
                <button key={e} onClick={() => { setCurrentEmotion(e); setAutoMode(false); }}
                  className={currentEmotion === e ? 'btn-tech highlight' : 'btn-tech'}
                  style={{fontSize: '0.75rem', padding: '4px 10px'}}>
                  {e.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          ) : (
            Object.entries(categories).map(([cat, emotions]) => (
              <div key={cat} style={{marginBottom: '12px'}}>
                <h3 style={{fontSize: '0.85rem', color: 'var(--hexa-cyan)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px'}}>{cat}</h3>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '4px'}}>
                  {emotions.filter(e => EMOTION_LIST.includes(e)).map(e => (
                    <button key={e} onClick={() => { setCurrentEmotion(e); setAutoMode(false); }}
                      className={currentEmotion === e ? 'btn-tech highlight' : 'btn-tech'}
                      style={{fontSize: '0.7rem', padding: '3px 8px'}}>
                      {e.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================
const GlobalAIChat = () => {
  const location = useLocation();
  return <AIChat isActiveTab={location.pathname === '/ai-chat'} />;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('swarmy_token'));
  const [connected, setConnected] = useState(false);
  const [rosInstance, setRosInstance] = useState(null);
  const [health, setHealth] = useState({ cpu: 0, ram: 0, temp: 0, disk: 0, uptime: '...', ip: '...' });

  // Fetch system health from backend API
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchHealth = async () => {
      try {
        const res = await fetch(`${API_URL}/api/system`, { headers: authHeaders() });
        const data = await res.json();
        setHealth(prev => ({ ...prev, ...data }));
      } catch (e) {}
    };
    fetchHealth();
    const initTheme = localStorage.getItem('swarmy_theme') || 'apple-dark';
    document.documentElement.setAttribute('data-theme', initTheme);
    
    const interval = setInterval(fetchHealth, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Connect to ROSBridge
  useEffect(() => {
    if (!isAuthenticated) return;
    const ros = new ROSLIB.Ros({ url: `ws://${window.location.hostname}:9090` });
    ros.on('connection', () => {
      setConnected(true);
      setRosInstance(ros);
    });
    ros.on('error', () => setConnected(false));
    ros.on('close', () => setConnected(false));
    return () => ros.close();
  }, [isAuthenticated]);

  // Emergency Stop Handler
  const handleEmergencyStop = async () => {
    if (!window.confirm('⚠️ EMERGENCY STOP\n\nThis will KILL ALL running ROS processes.\nAre you sure?')) return;
    try {
      await fetch(`${API_URL}/api/kill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ killAll: true })
      });
      // Also stop robot motion via ROSBridge
      if (rosInstance && connected) {
        const cmdVel = new ROSLIB.Topic({ ros: rosInstance, name: '/cmd_vel', messageType: 'geometry_msgs/Twist' });
        cmdVel.publish(new ROSLIB.Message({ linear: { x: 0, y: 0, z: 0 }, angular: { x: 0, y: 0, z: 0 } }));
      }
      alert('🛑 EMERGENCY STOP EXECUTED\nAll ROS processes terminated. Robot stopped.');
    } catch (e) {
      alert('Failed to execute emergency stop.');
    }
  };

  if (!isAuthenticated) return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;

  return (
    <Router>
      <ErrorBoundary>
        <TourGuide />
      </ErrorBoundary>
      <MatrixBackground />
      <div className="hexa-layout">
        <div className="cursor-glow" />
        <SidebarMenu connected={connected} handleLogout={() => { localStorage.removeItem('swarmy_token'); setIsAuthenticated(false); }} />
        <div className="main-area">
          <TopBar health={health} onEmergencyStop={handleEmergencyStop} />
          <main className="main-content animate-slide-up">
            <GlobalAIChat />
            <Routes>
              <Route path="/" element={<DashboardPage health={health} connected={connected} />} />
              <Route path="/launcher" element={<Launcher />} />
              <Route path="/workspace" element={<WorkspaceIDE />} />
              <Route path="/ros-graph" element={<RosGraph />} />
              <Route path="/controls" element={<Teleoperation />} />
              <Route path="/mapping" element={<IndustrialMappingPage autonomous={false} />} />
              <Route path="/autonomous-mapping" element={<IndustrialMappingPage autonomous={true} />} />
              <Route path="/navigation" element={<NavigationView connected={connected} />} />
              <Route path="/about" element={<AboutRobot />} />
              <Route path="/ai-chat" element={<></>} />
              <Route path="/terminal" element={<WebTerminal />} />
              <Route path="/all-launch" element={<AllLaunchFiles />} />
              <Route path="/system" element={<SystemManager />} />
              <Route path="/robot-face" element={<RobotFacePage health={health} />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/planner" element={<ErrorBoundary><RoutePlannerPage /></ErrorBoundary>} />
              <Route path="/opcua" element={<ErrorBoundary><OpcUaPanel /></ErrorBoundary>} />
              <Route path="/studio" element={<ErrorBoundary><SwarmyStudio /></ErrorBoundary>} />
              <Route path="/guide" element={<ErrorBoundary><GuidePanel /></ErrorBoundary>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}

export default App;
