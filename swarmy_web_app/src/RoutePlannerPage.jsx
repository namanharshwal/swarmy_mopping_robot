import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Save, Play, ChevronLeft, ChevronRight, RefreshCw, Trash2, Link as LinkIcon, Crosshair, Map as MapIcon, Navigation, XCircle, Route, StopCircle, Radio, RotateCw, Clock, Compass, Pencil, ChevronDown, ChevronUp, Layers, Settings2, Zap } from 'lucide-react';

const API_URL = `http://${window.location.hostname}:3001`;
const authHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('swarmy_token')}`
});

// ================================================
// COMPASS PAD COMPONENT — visual angle selector
// ================================================
function CompassPad({ angle, onChange, size = 120 }) {
  const canvasRef = useRef(null);
  const pointers = useRef({});
  const initialPinchDist = useRef(null);

  const dragging = useRef(false);

  const getAngleFromEvent = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - rect.left - cx;
    const dy = -(clientY - rect.top - cy);
    let a = Math.atan2(dy, dx) * 180 / Math.PI;
    if (a < 0) a += 360;
    return Math.round(a);
  };

  const handleStart = (e) => {
    e.preventDefault();
    dragging.current = true;
    onChange(getAngleFromEvent(e, canvasRef.current));
  };
  const handleMove = (e) => {
    if (!dragging.current) return;
    e.preventDefault();
    onChange(getAngleFromEvent(e, canvasRef.current));
  };
  const handleEnd = () => { dragging.current = false; };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const cx = w / 2, cy = h / 2;
    const r = Math.min(cx, cy) - 8;
    
    ctx.clearRect(0, 0, w, h);
    
    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Tick marks every 45 degrees
    const labels = ['0°', '45°', '90°', '135°', '180°', '225°', '270°', '315°'];
    for (let i = 0; i < 8; i++) {
      const a = (i * 45) * Math.PI / 180;
      const x1 = cx + Math.cos(a) * (r - 6);
      const y1 = cy - Math.sin(a) * (r - 6);
      const x2 = cx + Math.cos(a) * r;
      const y2 = cy - Math.sin(a) * r;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      const lx = cx + Math.cos(a) * (r - 16);
      const ly = cy - Math.sin(a) * (r - 16);
      ctx.fillStyle = '#888';
      ctx.font = '9px Rajdhani';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(labels[i], lx, ly);
    }
    
    // Arrow indicating angle
    const rad = angle * Math.PI / 180;
    const ax = cx + Math.cos(rad) * (r - 24);
    const ay = cy - Math.sin(rad) * (r - 24);
    
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Arrow head
    const headLen = 10;
    const headAngle = 0.4;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(
      ax - headLen * Math.cos(rad - headAngle),
      ay + headLen * Math.sin(rad - headAngle)
    );
    ctx.moveTo(ax, ay);
    ctx.lineTo(
      ax - headLen * Math.cos(rad + headAngle),
      ay + headLen * Math.sin(rad + headAngle)
    );
    ctx.strokeStyle = '#22d3ee';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#22d3ee';
    ctx.fill();
    
  }, [angle, size]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} height={size}
      style={{ cursor: 'pointer', touchAction: 'none' }}
      onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
      onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
    />
  );
}

// ================================================
// CUSTOM PATH DRAWING PAD
// ================================================
function PathDrawingPad({ onPathComplete, size = 200 }) {
  const canvasRef = useRef(null);
  const pointers = useRef({});
  const initialPinchDist = useRef(null);

  const drawing = useRef(false);
  const points = useRef([]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleStart = (e) => {
    e.preventDefault();
    drawing.current = true;
    points.current = [getPos(e)];
    redraw();
  };

  const handleMove = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = getPos(e);
    const last = points.current[points.current.length - 1];
    if (Math.hypot(p.x - last.x, p.y - last.y) > 5) {
      points.current.push(p);
      redraw();
    }
  };

  const handleEnd = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (points.current.length > 3) {
      // Downsample to max 30 points
      const pts = points.current;
      const step = Math.max(1, Math.floor(pts.length / 30));
      const sampled = [];
      for (let i = 0; i < pts.length; i += step) sampled.push(pts[i]);
      if (sampled[sampled.length - 1] !== pts[pts.length - 1]) sampled.push(pts[pts.length - 1]);
      onPathComplete(sampled, size);
    }
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }
    
    // Center crosshair
    const cx = canvas.width / 2, cy = canvas.height / 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, canvas.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(canvas.width, cy); ctx.stroke();
    ctx.setLineDash([]);
    
    // "Robot" label at center
    ctx.fillStyle = 'rgba(59,130,246,0.3)';
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#3b82f6';
    ctx.font = '9px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText('ROBOT', cx, cy + 20);
    
    // Draw path
    if (points.current.length > 1) {
      ctx.beginPath();
      ctx.moveTo(points.current[0].x, points.current[0].y);
      for (let i = 1; i < points.current.length; i++) {
        ctx.lineTo(points.current[i].x, points.current[i].y);
      }
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // End marker
      const last = points.current[points.current.length - 1];
      ctx.beginPath(); ctx.arc(last.x, last.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
    }
  };

  useEffect(() => { redraw(); }, []);

  const clearPad = () => {
    points.current = [];
    redraw();
  };

  return (
    <div>
      <canvas
        ref={canvasRef} width={size} height={size}
        style={{ cursor: 'crosshair', touchAction: 'none', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: '1px solid #333', width: '100%', height: 'auto' }}
        onMouseDown={handleStart} onMouseMove={handleMove} onMouseUp={handleEnd} onMouseLeave={handleEnd}
        onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}
      />
      <button className="btn-tech" onClick={clearPad} style={{ width: '100%', marginTop: '4px', fontSize: '11px', padding: '4px' }}>
        <Trash2 size={12} /> Clear Path
      </button>
    </div>
  );
}


// ================================================
// MAIN ROUTE PLANNER PAGE
// ================================================
export default function RoutePlannerPage() {
  const [maps, setMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState('');
  const [mapData, setMapData] = useState(null);
  const [mapImage, setMapImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Graph state
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [mode, setMode] = useState('add_node');
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);
  
  // Viewport
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Robot state
  const robotPoseRef = useRef(null);
  const [robotPoseUI, setRobotPoseUI] = useState(null);
  const lastUiUpdate = useRef(0);
  
  const [rosStatus, setRosStatus] = useState('disconnected');
  const [navRunning, setNavRunning] = useState(false);
  const [routeStatus, setRouteStatus] = useState('');
  const [navLaunching, setNavLaunching] = useState(false);
  const rosRef = useRef(null);
  const canvasRef = useRef(null);
  const pointers = useRef({});
  const initialPinchDist = useRef(null);

  
  // UI panels
  const [showProps, setShowProps] = useState(true);
  const [showPathPad, setShowPathPad] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ROS Connection
  const connectROS = useCallback(() => {
    if (!window.ROSLIB) return;
    if (rosRef.current) { try { rosRef.current.close(); } catch(e) {} }

    const ros = new window.ROSLIB.Ros({ url: `ws://${window.location.hostname}:9090` });
    rosRef.current = ros;

    ros.on('connection', () => {
      setRosStatus('connected');
      
      // robot_map_pose from TF bridge
      new window.ROSLIB.Topic({ ros, name: '/robot_map_pose', messageType: 'geometry_msgs/PoseStamped' })
        .subscribe((msg) => {
          const q = msg.pose.orientation;
          const theta = Math.atan2(2*(q.w*q.z+q.x*q.y), 1-2*(q.y*q.y+q.z*q.z));
          const p = { x: msg.pose.position.x, y: msg.pose.position.y, theta };
          robotPoseRef.current = p;
          const now = Date.now();
          if (now - lastUiUpdate.current > 1000) {
            setRobotPoseUI(p);
            lastUiUpdate.current = now;
          }
        });
      
      // amcl fallback
      new window.ROSLIB.Topic({ ros, name: '/amcl_pose', messageType: 'geometry_msgs/PoseWithCovarianceStamped' })
        .subscribe((msg) => {
          const q = msg.pose.pose.orientation;
          const theta = Math.atan2(2*(q.w*q.z+q.x*q.y), 1-2*(q.y*q.y+q.z*q.z));
          const p = { x: msg.pose.pose.position.x, y: msg.pose.pose.position.y, theta };
          robotPoseRef.current = p;
          const now = Date.now();
          if (now - lastUiUpdate.current > 1000) {
            setRobotPoseUI(p);
            lastUiUpdate.current = now;
          }
        });

      // Route status
      new window.ROSLIB.Topic({ ros, name: '/swarmy_route_status', messageType: 'std_msgs/String' })
        .subscribe((msg) => setRouteStatus(msg.data));
      
      // move_base alive check
      new window.ROSLIB.Topic({ ros, name: '/move_base/status', messageType: 'actionlib_msgs/GoalStatusArray' })
        .subscribe(() => setNavRunning(true));
    });
    
    ros.on('error', () => setRosStatus('error'));
    ros.on('close', () => { setRosStatus('disconnected'); setNavRunning(false); });
  }, []);

  useEffect(() => {
    fetchMaps(); loadGraph(); connectROS();
    
    const navPoll = setInterval(() => {
      fetch(`${API_URL}/api/processes`, { headers: authHeaders() })
        .then(r => r.json())
        .then(data => {
          const procs = Object.values(data.processes || {});
          if (procs.some(p => p.command && p.command.includes('navigation'))) setNavRunning(true);
        }).catch(() => {});
    }, 5000);
    
    const handleResize = () => {
      const c = canvasRef.current;
      if (c && c.parentElement) { c.width = c.parentElement.clientWidth; c.height = c.parentElement.clientHeight; }
    };
    window.addEventListener('resize', handleResize);
    setTimeout(handleResize, 100);
    
    return () => { window.removeEventListener('resize', handleResize); clearInterval(navPoll); if (rosRef.current) rosRef.current.close(); };
  }, []);

  // --- DATA ---
  const fetchMaps = async () => {
    try {
      const res = await fetch(`${API_URL}/api/workspace?path=src/swarmy_navigation/maps`, { headers: authHeaders() });
      const data = await res.json();
      if(data.files) {
        const mf = data.files.filter(f => f.name.endsWith('.yaml')).map(f => f.name.replace('.yaml', ''));
        setMaps(mf);
        if(mf.length > 0 && !selectedMap) loadMap(mf[0]);
      }
    } catch(e) {}
  };

  const loadMap = async (mapName) => {
    setSelectedMap(mapName); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/map/data?name=${mapName}`, { headers: authHeaders() });
      const data = await res.json();
      setMapData(data);
      const token = localStorage.getItem('swarmy_token');
      const img = new Image();
      img.src = `${API_URL}/api/map/image?name=${mapName}&token=${token}`;
      img.onload = () => {
        setMapImage(img); setLoading(false);
        const canvas = canvasRef.current;
        if(canvas) {
          const tmp = document.createElement('canvas');
          tmp.width = img.width; tmp.height = img.height;
          const ctx = tmp.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const id = ctx.getImageData(0, 0, img.width, img.height).data;
          let mnX=img.width, mnY=img.height, mxX=0, mxY=0;
          for(let y=0;y<img.height;y+=4) for(let x=0;x<img.width;x+=4) {
            const idx=(y*img.width+x)*4;
            const r=id[idx],g=id[idx+1],b=id[idx+2];
            if(r<200||r>210||g<200||g>210||b<200||b>210){ if(x<mnX)mnX=x; if(x>mxX)mxX=x; if(y<mnY)mnY=y; if(y>mxY)mxY=y; }
          }
          if(mnX>mxX){mnX=0;mnY=0;mxX=img.width;mxY=img.height;}
          const m=30;
          mnX=Math.max(0,mnX-m); mnY=Math.max(0,mnY-m);
          mxX=Math.min(img.width,mxX+m); mxY=Math.min(img.height,mxY+m);
          const bW=mxX-mnX, bH=mxY-mnY;
          const sc=Math.min(canvas.width/bW, canvas.height/bH)*0.95;
          setScale(sc);
          setOffset({ x:(canvas.width-bW*sc)/2-mnX*sc, y:(canvas.height-bH*sc)/2-mnY*sc });
        }
      };
      img.onerror = () => { setLoading(false); };
    } catch(e) { setLoading(false); }
  };

  const pixelToWorld = (px, py) => {
    if (!mapData || !mapImage) return null;
    return { x: mapData.origin[0]+(px*mapData.resolution), y: mapData.origin[1]+((mapImage.height-py)*mapData.resolution) };
  };

  // --- NAVIGATION ---
  const launchNavigation = async () => {
    if (!selectedMap) return alert('Select a map first!');
    setNavLaunching(true); setRouteStatus('Launching navigation...');
    try {
      await fetch(`${API_URL}/api/launch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ command: `roslaunch swarmy_navigation navigation_with_bringup.launch map_file:=/home/swarmy_bot/swarmy_ws/src/swarmy_navigation/maps/${selectedMap}.yaml` })
      });
      let attempts = 0;
      const check = setInterval(() => {
        attempts++;
        if (attempts > 40) { clearInterval(check); setNavLaunching(false); setRouteStatus('Launch timeout.'); return; }
        if (rosRef.current && !rosRef.current.isConnected) connectROS();
        fetch(`${API_URL}/api/processes`, { headers: authHeaders() }).then(r=>r.json()).then(d => {
          if (Object.values(d.processes||{}).some(p=>p.command&&p.command.includes('navigation'))) {
            clearInterval(check); setNavRunning(true); setNavLaunching(false);
            setRouteStatus('Navigation ready!'); setTimeout(()=>setRouteStatus(''),5000);
          }
        }).catch(()=>{});
      }, 1000);
    } catch(e) { setNavLaunching(false); setRouteStatus('Launch failed.'); }
  };

  const killNavigation = async () => {
    await fetch(`${API_URL}/api/kill`, { method:'POST', headers:{'Content-Type':'application/json',...authHeaders()}, body:JSON.stringify({killAll:true}) }).catch(()=>{});
    setNavRunning(false); setRouteStatus('Navigation stopped.');
    setTimeout(()=>setRouteStatus(''),3000);
  };

  const cancelGoal = () => {
    if (!rosRef.current || !rosRef.current.isConnected) return;
    const t = new window.ROSLIB.Topic({ ros:rosRef.current, name:'/move_base/cancel', messageType:'actionlib_msgs/GoalID' });
    t.publish(new window.ROSLIB.Message({ id:'' }));
    setRouteStatus('Navigation cancelled.'); setTimeout(()=>setRouteStatus(''),3000);
  };

  // --- GRAPH ---
  const saveGraph = () => {
    localStorage.setItem('swarmy_topological_graph', JSON.stringify({ nodes, edges, mapName: selectedMap }));
    setRouteStatus('Graph saved!'); setTimeout(()=>setRouteStatus(''),3000);
  };
  const loadGraph = () => {
    try { const s=localStorage.getItem('swarmy_topological_graph'); if(s){const p=JSON.parse(s); setNodes(p.nodes||[]); setEdges(p.edges||[]);} } catch(e){}
  };

  const updateNodeProp = (id, key, value) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, [key]: value } : n));
  };

  const selectedNodeObj = nodes.find(n => n.id === selectedNode);

  // --- CANVAS INTERACTION ---
  const getImgCoords = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left - offset.x) / scale, y: (clientY - rect.top - offset.y) / scale };
  };

  const handlePointerDown = (e) => {
    e.target.setPointerCapture(e.pointerId);
    pointers.current[e.pointerId] = e;
    if (Object.keys(pointers.current).length === 2) {
      const pts = Object.values(pointers.current);
      initialPinchDist.current = Math.hypot(pts[0].clientX - pts[1].clientX, pts[0].clientY - pts[1].clientY);
      return; // Skip other interactions when pinching
    }
    const coords = getImgCoords(e);
    const clicked = nodes.find(n => Math.hypot(n.x-coords.x, n.y-coords.y) < 15/scale);
    
    if (mode === 'move') {
      setIsDragging(true);
      if (clicked) { setSelectedNode(clicked.id); } 
      else { setDragStart({ x: (e.clientX||e.touches[0].clientX)-offset.x, y: (e.clientY||e.touches[0].clientY)-offset.y }); setSelectedNode(null); }
    } else if (mode === 'add_node') {
      if (!clicked) {
        const name = prompt('Station name (blank for waypoint):','');
        if (name !== null) {
          setNodes([...nodes, { id: Date.now(), x: coords.x, y: coords.y, name, angle: 0, dwellTime: 0 }]);
        }
      }
    } else if (mode === 'select') {
      setSelectedNode(clicked ? clicked.id : null);
    } else if (mode === 'connect') {
      if (clicked) {
        if (!selectedNode) { setSelectedNode(clicked.id); }
        else if (selectedNode !== clicked.id) {
          if (!edges.some(e=>(e.from===selectedNode&&e.to===clicked.id)||(e.to===selectedNode&&e.from===clicked.id))) {
            setEdges([...edges, { id: Date.now(), from: selectedNode, to: clicked.id }]);
          }
          setSelectedNode(null);
        }
      } else { setSelectedNode(null); }
    } else if (mode === 'delete') {
      if (clicked) { setNodes(nodes.filter(n=>n.id!==clicked.id)); setEdges(edges.filter(e=>e.from!==clicked.id&&e.to!==clicked.id)); }
      else {
        const ed = edges.find(edge => {
          const n1=nodes.find(n=>n.id===edge.from), n2=nodes.find(n=>n.id===edge.to);
          if(!n1||!n2) return false;
          const A=coords.x-n1.x,B=coords.y-n1.y,C=n2.x-n1.x,D=n2.y-n1.y;
          const dot=A*C+B*D, ls=C*C+D*D; let pm=ls?dot/ls:-1;
          let xx,yy;
          if(pm<0){xx=n1.x;yy=n1.y;}else if(pm>1){xx=n2.x;yy=n2.y;}else{xx=n1.x+pm*C;yy=n1.y+pm*D;}
          return Math.hypot(coords.x-xx,coords.y-yy)<10/scale;
        });
        if (ed) setEdges(edges.filter(e=>e.id!==ed.id));
      }
    }
  };

  const handlePointerMove = (e) => {
    if (pointers.current[e.pointerId]) pointers.current[e.pointerId] = e;
    const activePointers = Object.values(pointers.current);
    if (activePointers.length === 2 && initialPinchDist.current) {
      const dist = Math.hypot(activePointers[0].clientX - activePointers[1].clientX, activePointers[0].clientY - activePointers[1].clientY);
      const zoomAmount = dist / initialPinchDist.current;
      initialPinchDist.current = dist;
      
      const cx = (activePointers[0].clientX + activePointers[1].clientX) / 2;
      const cy = (activePointers[0].clientY + activePointers[1].clientY) / 2;
      const rect = canvasRef.current.getBoundingClientRect();
      const imgX = (cx - rect.left - offset.x) / scale;
      const imgY = (cy - rect.top - offset.y) / scale;
      
      setScale(s => Math.min(Math.max(s * zoomAmount, 0.2), 10));
      setOffset(o => ({ x: o.x - imgX * (zoomAmount - 1) * scale, y: o.y - imgY * (zoomAmount - 1) * scale }));
      return;
    }
    const coords = getImgCoords(e);
    const h = nodes.find(n=>Math.hypot(n.x-coords.x,n.y-coords.y)<15/scale);
    setHoverNode(h ? h.id : null);
    if (isDragging) {
      const cx = e.clientX || (e.touches && e.touches[0].clientX);
      const cy = e.clientY || (e.touches && e.touches[0].clientY);
      if (selectedNode && mode === 'move') {
        setNodes(nodes.map(n=>n.id===selectedNode?{...n,x:coords.x,y:coords.y}:n));
      } else if (cx !== undefined) {
        setOffset({ x: cx-dragStart.x, y: cy-dragStart.y });
      }
    }
  };

    const handlePointerUp = (e) => { 
    if (e && e.pointerId) delete pointers.current[e.pointerId];
    if (Object.keys(pointers.current).length < 2) initialPinchDist.current = null;
    setIsDragging(false); 
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const f=1.1, d=e.deltaY>0?-1:1;
    const ns=d>0?scale*f:scale/f;
    const rect=canvasRef.current.getBoundingClientRect();
    const mx=e.clientX-rect.left, my=e.clientY-rect.top;
    const dx=(mx-offset.x)/scale, dy=(my-offset.y)/scale;
    setOffset({x:mx-dx*ns,y:my-dy*ns}); setScale(ns);
  };


  // State refs for rAF drawing
  const stateRef = useRef({});
  useEffect(() => {
    stateRef.current = { mapImage, offset, scale, nodes, edges, mode, selectedNode, hoverNode, mapData };
  }, [mapImage, offset, scale, nodes, edges, mode, selectedNode, hoverNode, mapData]);

  // --- CANVAS DRAW LOOP ---
  useEffect(() => {
    let reqId;
    const draw = () => {
      const { mapImage, offset, scale, nodes, edges, mode, selectedNode, hoverNode, mapData } = stateRef.current;
      if (!offset) { reqId = requestAnimationFrame(draw); return; }
      const robotPose = robotPoseRef.current;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(scale, scale);
    
    if (mapImage) ctx.drawImage(mapImage, 0, 0);
    
    // Edges
    edges.forEach(edge => {
      const n1=nodes.find(n=>n.id===edge.from), n2=nodes.find(n=>n.id===edge.to);
      if (n1 && n2) {
        ctx.beginPath(); ctx.moveTo(n1.x,n1.y); ctx.lineTo(n2.x,n2.y);
        ctx.strokeStyle='#6ee7b7'; ctx.lineWidth=4/scale; ctx.stroke();
        if (mapData && mapData.resolution) {
          const dm=(Math.hypot(n2.x-n1.x,n2.y-n1.y)*mapData.resolution).toFixed(2);
          ctx.fillStyle='#000'; ctx.font=`${12/scale}px Rajdhani`; ctx.textAlign='center';
          ctx.fillText(`${dm}m`,(n1.x+n2.x)/2,(n1.y+n2.y)/2-5/scale);
        }
      }
    });
    
    // Nodes
    nodes.forEach(node => {
      const isSel = node.id===selectedNode;
      const isHov = node.id===hoverNode;
      
      // Selected glow
      if (isSel) {
        ctx.beginPath(); ctx.arc(node.x,node.y,20/scale,0,2*Math.PI);
        ctx.strokeStyle='#22d3ee'; ctx.lineWidth=3/scale; ctx.stroke();
      }
      
      // Circle
      ctx.beginPath(); ctx.arc(node.x,node.y,12/scale,0,2*Math.PI);
      ctx.fillStyle = isSel?'#22d3ee':isHov?'#34d399':'#a7f3d0'; ctx.fill();
      
      // Center dot
      ctx.beginPath(); ctx.arc(node.x,node.y,3/scale,0,2*Math.PI);
      ctx.fillStyle='#ef4444'; ctx.fill();
      
      // Angle arrow
      const ang = (node.angle || 0) * Math.PI / 180;
      const arrowLen = 25 / scale;
      ctx.beginPath();
      ctx.moveTo(node.x, node.y);
      ctx.lineTo(node.x + Math.cos(ang)*arrowLen, node.y - Math.sin(ang)*arrowLen);
      ctx.strokeStyle = isSel ? '#f59e0b' : 'rgba(245,158,11,0.5)';
      ctx.lineWidth = 2/scale;
      ctx.stroke();
      
      // Name + dwell
      if (node.name) {
        ctx.fillStyle='#000'; ctx.font=`bold ${13/scale}px Rajdhani`; ctx.textAlign='center';
        ctx.fillText(node.name, node.x, node.y-20/scale);
        if (node.dwellTime > 0) {
          ctx.fillStyle='#6366f1'; ctx.font=`${10/scale}px Rajdhani`;
          ctx.fillText(`⏱${node.dwellTime}s`, node.x, node.y+22/scale);
        }
      }
    });
    
    // Connect preview
    if (mode==='connect'&&selectedNode&&hoverNode&&hoverNode!==selectedNode) {
      const n1=nodes.find(n=>n.id===selectedNode), n2=nodes.find(n=>n.id===hoverNode);
      if(n1&&n2){ctx.beginPath();ctx.moveTo(n1.x,n1.y);ctx.lineTo(n2.x,n2.y);ctx.strokeStyle='rgba(110,231,183,0.5)';ctx.lineWidth=4/scale;ctx.stroke();}
    }
    
    // Robot
    if (robotPose && mapData && mapImage) {
      const px=(robotPoseRef.current.x-mapData.origin[0])/mapData.resolution;
      const py=mapImage.height-((robotPoseRef.current.y-mapData.origin[1])/mapData.resolution);
      ctx.save(); ctx.translate(px,py); ctx.rotate(-robotPoseRef.current.theta);
      ctx.beginPath(); ctx.moveTo(16/scale,0); ctx.lineTo(-12/scale,10/scale); ctx.lineTo(-12/scale,-10/scale); ctx.closePath();
      ctx.fillStyle='#3b82f6'; ctx.fill(); ctx.strokeStyle='#fff'; ctx.lineWidth=2/scale; ctx.stroke();
      ctx.beginPath(); ctx.arc(0,0,22/scale,0,2*Math.PI);
      ctx.strokeStyle='rgba(59,130,246,0.4)'; ctx.lineWidth=3/scale; ctx.stroke();
      ctx.restore();
    }
    
    ctx.restore();
      reqId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(reqId);
  }, []);

  // --- EXECUTE ---
  const executeSelected = () => {
    if (!selectedNode) return alert("Use 'Select Target' to pick a station!");
    if (!navRunning) return alert("Click 'Start Navigation' first!");
    const t = nodes.find(n=>n.id===selectedNode);
    if (!t||!mapData||!mapImage) return;
    const w = pixelToWorld(t.x,t.y);
    if (!w) return;
    
    const ang = (t.angle || 0) * Math.PI / 180;
    const qz = Math.sin(ang / 2), qw = Math.cos(ang / 2);
    
    if (rosRef.current && rosRef.current.isConnected) {
      new window.ROSLIB.Topic({ ros:rosRef.current, name:'/move_base_simple/goal', messageType:'geometry_msgs/PoseStamped' })
        .publish(new window.ROSLIB.Message({
          header:{frame_id:'map',stamp:{secs:0,nsecs:0}},
          pose:{position:{x:w.x,y:w.y,z:0},orientation:{x:0,y:0,z:qz,w:qw}}
        }));
      setRouteStatus(`Goal → ${t.name||'WP'} (${w.x.toFixed(1)},${w.y.toFixed(1)}) @${t.angle||0}°`);
    } else alert("ROSBridge not connected!");
  };

  const executeFullTour = () => {
    if (nodes.length===0) return alert("Add stations first!");
    if (!navRunning) return alert("Click 'Start Navigation' first!");
    if (!rosRef.current||!rosRef.current.isConnected) return alert("ROSBridge not connected!");
    
    const poses = nodes.map(n => {
      const w = pixelToWorld(n.x,n.y);
      const ang = (n.angle||0)*Math.PI/180;
      return { header:{frame_id:'map',stamp:{secs:0,nsecs:0}}, pose:{position:{x:w.x,y:w.y,z:0},orientation:{x:0,y:0,z:Math.sin(ang/2),w:Math.cos(ang/2)}} };
    });
    
    // Send metadata (dwell times + names)
    new window.ROSLIB.Topic({ ros:rosRef.current, name:'/swarmy_route_meta', messageType:'std_msgs/String' })
      .publish(new window.ROSLIB.Message({ data: JSON.stringify({ dwellTimes: nodes.map(n=>n.dwellTime||0), names: nodes.map(n=>n.name||'WP') }) }));
    
    // Send route
    new window.ROSLIB.Topic({ ros:rosRef.current, name:'/swarmy_route', messageType:'nav_msgs/Path' })
      .publish(new window.ROSLIB.Message({ header:{frame_id:'map',stamp:{secs:0,nsecs:0}}, poses }));
    
    setRouteStatus(`Full Tour: ${nodes.length} stations`);
  };

  const executeCustomPath = (pathPoints, padSize) => {
    if (!navRunning) return alert("Click 'Start Navigation' first!");
    if (!rosRef.current||!rosRef.current.isConnected||!robotPoseRef.current) return alert("ROSBridge not connected or no robot pose!");
    
    // Convert pad coords (relative to center = robot position) to world coords
    const centerX = padSize / 2, centerY = padSize / 2;
    const padScale = 3.0 / padSize; // 3 meters across the pad
    
    const poses = pathPoints.map(pt => {
      const dx = (pt.x - centerX) * padScale;
      const dy = -(pt.y - centerY) * padScale;
      // Rotate by robot heading and add to robot position
      const cos = Math.cos(robotPoseRef.current.theta), sin = Math.sin(robotPoseRef.current.theta);
      const wx = robotPoseRef.current.x + dx * cos - dy * sin;
      const wy = robotPoseRef.current.y + dx * sin + dy * cos;
      return { header:{frame_id:'map',stamp:{secs:0,nsecs:0}}, pose:{position:{x:wx,y:wy,z:0},orientation:{x:0,y:0,z:0,w:1}} };
    });
    
    new window.ROSLIB.Topic({ ros:rosRef.current, name:'/swarmy_custom_path', messageType:'nav_msgs/Path' })
      .publish(new window.ROSLIB.Message({ header:{frame_id:'map',stamp:{secs:0,nsecs:0}}, poses }));
    
    setRouteStatus(`Custom path: ${pathPoints.length} waypoints`);
  };

  // Status
  const stColor = rosStatus==='connected'?(navRunning?'#10b981':'#f59e0b'):'#ef4444';
  const stText = rosStatus==='connected'?(navRunning?'NAV READY':'ROS OK · NAV OFF'):'DISCONNECTED';

  return (
    <div className="rp-root">
      {/* TOP BAR */}
      <div className="rp-topbar">
        <div className="rp-topbar-left">
          <button className="rp-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{padding: "4px", marginRight: "4px"}}>
            {sidebarOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
          </button>
          <h1 className="rp-title">ROUTE PLANNER</h1>
          <div className="rp-status-badge" style={{borderColor:stColor}}>
            <Radio size={10} color={stColor}/> <span style={{color:stColor}}>{stText}</span>
          </div>
        </div>
        <div className="rp-topbar-right">
          <select value={selectedMap} onChange={e=>loadMap(e.target.value)} className="rp-select">
            {maps.length===0?<option value="">No maps</option>:maps.map(m=><option key={m} value={m}>{m}</option>)}
          </select>
          <button className="rp-btn" onClick={fetchMaps} title="Refresh"><RefreshCw size={14}/></button>
          <button className="rp-btn rp-btn-cyan" onClick={saveGraph}><Save size={14}/><span className="rp-btn-label">Save</span></button>
          
          {!navRunning ? (
            <button className="rp-btn rp-btn-green" onClick={launchNavigation} disabled={navLaunching}>
              <Navigation size={14}/><span className="rp-btn-label">{navLaunching?'Launching...':'Start Nav'}</span>
            </button>
          ) : (
            <button className="rp-btn rp-btn-red" onClick={killNavigation}><XCircle size={14}/><span className="rp-btn-label">Kill Nav</span></button>
          )}
          
          <button className="rp-btn rp-btn-purple" onClick={executeFullTour} disabled={!navRunning}><Route size={14}/><span className="rp-btn-label">Full Tour</span></button>
          <button className="rp-btn rp-btn-blue" onClick={executeSelected} disabled={!navRunning}><Play size={14}/><span className="rp-btn-label">Go To</span></button>
          <button className="rp-btn rp-btn-red" onClick={cancelGoal} disabled={!navRunning}><StopCircle size={14}/><span className="rp-btn-label">Cancel</span></button>
          {isMobile && <button className="rp-btn" onClick={()=>setSidebarOpen(!sidebarOpen)}><Layers size={14}/></button>}
        </div>
      </div>
      
      {routeStatus && <div className="rp-status-bar">{routeStatus}</div>}
      
      {/* MAIN BODY */}
      <div className="rp-body">
        {/* LEFT SIDEBAR */}
         
        {sidebarOpen && (
        <div className="rp-sidebar">
          <div className="rp-section-title">TOOLS</div>
          {[
            {id:'move',icon:<Crosshair size={15}/>,label:'Pan / Move'},
            {id:'select',icon:<Navigation size={15}/>,label:'Select Target'},
            {id:'add_node',icon:<MapIcon size={15}/>,label:'Add Station'},
            {id:'connect',icon:<LinkIcon size={15}/>,label:'Connect'},
            {id:'delete',icon:<Trash2 size={15}/>,label:'Delete',danger:true},
          ].map(t=>(
            <button key={t.id} className={`rp-tool ${mode===t.id?'active':''} ${t.danger?'danger':''}`} onClick={()=>{setMode(t.id);if(t.id!=='select'&&t.id!=='connect')setSelectedNode(null);}}>
              {t.icon} {t.label}
            </button>
          ))}
          
          {/* STATION PROPERTIES */}
          <div className="rp-section-title" style={{cursor:'pointer'}} onClick={()=>setShowProps(!showProps)}>
            <Settings2 size={12}/> STATION PROPERTIES {showProps?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
          </div>
          {showProps && selectedNodeObj ? (
            <div className="rp-props-panel">
              <div className="rp-prop-label">Station: <strong style={{color:'#22d3ee'}}>{selectedNodeObj.name||'(unnamed)'}</strong></div>
              
              <div className="rp-prop-label"><Compass size={12}/> Heading Angle</div>
              <div style={{display:'flex',justifyContent:'center'}}>
                <CompassPad angle={selectedNodeObj.angle||0} onChange={v=>updateNodeProp(selectedNode,'angle',v)} size={isMobile?100:120}/>
              </div>
              <div className="rp-prop-row">
                <input type="number" min="0" max="360" value={selectedNodeObj.angle||0} onChange={e=>updateNodeProp(selectedNode,'angle',parseInt(e.target.value)||0)} className="rp-input"/>
                <span className="rp-prop-unit">°</span>
              </div>
              
              <div className="rp-prop-label"><Clock size={12}/> Dwell Time</div>
              <div className="rp-prop-row">
                <input type="number" min="0" max="600" value={selectedNodeObj.dwellTime||0} onChange={e=>updateNodeProp(selectedNode,'dwellTime',parseInt(e.target.value)||0)} className="rp-input"/>
                <span className="rp-prop-unit">sec</span>
              </div>
              
              {(() => { const w = pixelToWorld(selectedNodeObj.x, selectedNodeObj.y); return w ? (
                <div style={{fontSize:'10px',color:'#666',marginTop:'4px'}}>World: ({w.x.toFixed(2)}, {w.y.toFixed(2)})</div>
              ) : null; })()}
            </div>
          ) : showProps ? (
            <div className="rp-props-empty">Select a station to edit properties</div>
          ) : null}
          
          {/* CUSTOM PATH PAD */}
          <div className="rp-section-title" style={{cursor:'pointer'}} onClick={()=>setShowPathPad(!showPathPad)}>
            <Pencil size={12}/> DRAW PATH {showPathPad?<ChevronUp size={12}/>:<ChevronDown size={12}/>}
          </div>
          {showPathPad && (
            <div>
              <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>Draw a custom path for the robot. Center = robot position. Range: ±1.5m</div>
              <PathDrawingPad onPathComplete={executeCustomPath} size={isMobile?160:200}/>
            </div>
          )}
          
          {/* STATION LIST */}
          <div className="rp-section-title"><Layers size={12}/> STATIONS ({nodes.length})</div>
          <div className="rp-station-list">
            {nodes.filter(n=>n.name).map(n => {
              const w = pixelToWorld(n.x,n.y);
              return (
                <div key={n.id} className={`rp-station-item ${selectedNode===n.id?'active':''}`}
                  onClick={()=>{setSelectedNode(n.id);setMode('select');}}>
                  <div className="rp-station-name">{n.name}</div>
                  <div className="rp-station-meta">
                    {w&&`(${w.x.toFixed(1)},${w.y.toFixed(1)})`} · {n.angle||0}° · {n.dwellTime||0}s
                  </div>
                </div>
              );
            })}
            {nodes.filter(n=>n.name).length===0 && <div className="rp-props-empty">No stations yet</div>}
          </div>
          
          {/* ROBOT INFO */}
          {robotPoseUI && (
            <div className="rp-robot-info">
              <Zap size={12} color="#3b82f6"/> Robot: ({robotPoseUI.x.toFixed(2)}, {robotPoseUI.y.toFixed(2)}) {(robotPoseUI.theta*180/Math.PI).toFixed(0)}°
            </div>
          )}
        </div>
        )}
        <div className="rp-canvas-wrap" style={{ position: 'relative' }}>
          {/* Zoom Controls Overlay */}
          <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', background: 'rgba(0,0,0,0.85)', borderRadius: '6px', overflow: 'hidden', border: '1px solid #444', boxShadow: '0 4px 12px rgba(0,0,0,0.6)', zIndex: 100 }}>
            <button onClick={() => setScale(s => Math.max(s - 0.2, 0.2))} style={{ background: 'transparent', border: 'none', padding: '8px 14px', cursor: 'pointer', color: '#22d3ee', fontSize: '18px', fontWeight: 'bold' }}>-</button>
            <button onClick={() => { setScale(1); setOffset({x:0, y:0}); }} style={{ background: 'transparent', borderLeft: '1px solid #444', borderRight: '1px solid #444', borderTop: 'none', borderBottom: 'none', padding: '8px 14px', cursor: 'pointer', color: '#aaa', fontSize: '12px' }}>RESET</button>
            <button onClick={() => setScale(s => Math.min(s + 0.2, 10))} style={{ background: 'transparent', border: 'none', padding: '8px 14px', cursor: 'pointer', color: '#22d3ee', fontSize: '18px', fontWeight: 'bold' }}>+</button>
          </div>
          <canvas ref={canvasRef} width={800} height={600}
            style={{width:'100%',height:'100%',display:'block',touchAction:'none'}}
            onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
          />
          <div className="rp-mode-badge">
            {mode==='move'?'🖐 PAN':mode==='select'?'🎯 SELECT':mode==='add_node'?'📍 ADD':mode==='connect'?'🔗 CONNECT':'🗑 DELETE'}
          </div>
        </div>
      </div>
      
      <style>{`
        .rp-root { min-height:100%; height:auto; display:flex; flex-direction:column; font-family:'Rajdhani',sans-serif; overflow:auto; }
        .rp-topbar { display:flex; justify-content:space-between; align-items:center; padding:8px 0; gap:8px; flex-wrap:wrap; min-height:fit-content; }
        .rp-topbar-left { display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .rp-topbar-right { display:flex; gap:4px; flex-wrap:wrap; align-items:center; }
        .rp-title { font-size:1.1rem; font-weight:bold; color:#fff; white-space:nowrap; margin:0; }
        .rp-status-badge { display:flex; align-items:center; gap:4px; padding:2px 10px; border-radius:20px; background:rgba(0,0,0,0.4); border:1px solid; font-size:10px; font-weight:bold; letter-spacing:1px; }
        .rp-select { padding:5px 8px; border-radius:4px; background:#111; color:#00f3ff; border:1px solid #333; font-family:'Rajdhani',sans-serif; font-weight:600; font-size:13px; outline:none; max-width:120px; }
        .rp-btn { display:flex; align-items:center; gap:4px; padding:5px 8px; border-radius:4px; background:rgba(255,255,255,0.08); border:1px solid #444; color:#ccc; cursor:pointer; font-family:'Rajdhani',sans-serif; font-weight:600; font-size:12px; white-space:nowrap; transition:all .15s; }
        .rp-btn:hover { background:rgba(255,255,255,0.15); }
        .rp-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .rp-btn-cyan { background:rgba(34,211,238,0.15); border-color:#22d3ee; color:#22d3ee; }
        .rp-btn-green { background:rgba(16,185,129,0.15); border-color:#10b981; color:#10b981; }
        .rp-btn-red { background:rgba(239,68,68,0.15); border-color:#ef4444; color:#ef4444; }
        .rp-btn-purple { background:rgba(139,92,246,0.15); border-color:#8b5cf6; color:#8b5cf6; }
        .rp-btn-blue { background:rgba(59,130,246,0.15); border-color:#3b82f6; color:#3b82f6; }
        .rp-status-bar { padding:6px 12px; border-radius:6px; background:rgba(0,0,0,0.5); border:1px solid #333; font-size:12px; color:#22d3ee; font-weight:bold; margin-bottom:6px; }
        .rp-body { display:flex; gap:10px; flex:1; overflow:hidden; min-height:0; }
        .rp-sidebar { width:220px; min-width:220px; background:rgba(0,0,0,0.5); border:1px solid #333; border-radius:8px; padding:10px; display:flex; flex-direction:column; gap:6px; overflow-y:auto; -webkit-overflow-scrolling:touch; }
        .rp-section-title { color:#00f3ff; font-size:11px; font-weight:bold; letter-spacing:1px; border-bottom:1px solid #222; padding-bottom:4px; display:flex; align-items:center; gap:4px; }
        .rp-tool { width:100%; display:flex; align-items:center; gap:6px; padding:6px 8px; border-radius:4px; background:rgba(255,255,255,0.04); border:1px solid #333; color:#aaa; cursor:pointer; font-family:'Rajdhani',sans-serif; font-size:12px; font-weight:600; transition:all .15s; }
        .rp-tool:hover { background:rgba(255,255,255,0.1); }
        .rp-tool.active { background:rgba(34,211,238,0.15); border-color:#22d3ee; color:#22d3ee; }
        .rp-tool.danger { color:#ff4444; }
        .rp-tool.danger.active { border-color:#ff4444; background:rgba(255,68,68,0.15); }
        .rp-props-panel { display:flex; flex-direction:column; gap:6px; padding:6px; background:rgba(0,0,0,0.3); border-radius:6px; border:1px solid #222; }
        .rp-props-empty { font-size:11px; color:#555; padding:4px; }
        .rp-prop-label { font-size:11px; color:#888; display:flex; align-items:center; gap:4px; }
        .rp-prop-row { display:flex; align-items:center; gap:4px; }
        .rp-input { flex:1; padding:4px 6px; background:rgba(0,0,0,0.4); border:1px solid #444; border-radius:4px; color:#fff; font-family:'Rajdhani',sans-serif; font-size:13px; outline:none; width:100%; box-sizing:border-box; }
        .rp-input:focus { border-color:#22d3ee; }
        .rp-prop-unit { font-size:11px; color:#888; min-width:20px; }
        .rp-station-list { max-height:150px; overflow-y:auto; -webkit-overflow-scrolling:touch; }
        .rp-station-item { padding:4px 8px; margin-bottom:3px; border-radius:4px; cursor:pointer; background:rgba(255,255,255,0.03); border:1px solid transparent; transition:all .15s; }
        .rp-station-item:hover { background:rgba(255,255,255,0.08); }
        .rp-station-item.active { background:rgba(34,211,238,0.12); border-color:#22d3ee; }
        .rp-station-name { font-size:12px; font-weight:bold; color:#ccc; }
        .rp-station-item.active .rp-station-name { color:#22d3ee; }
        .rp-station-meta { font-size:10px; color:#666; }
        .rp-robot-info { font-size:10px; color:#3b82f6; padding:4px 6px; background:rgba(59,130,246,0.1); border-radius:4px; display:flex; align-items:center; gap:4px; margin-top:auto; }
        .rp-canvas-wrap { flex:1; border:1px solid #333; border-radius:8px; background:#e5e5e5; overflow:hidden; position:relative; min-height:200px; }
        .rp-mode-badge { position:absolute; top:6px; left:6px; padding:3px 10px; border-radius:4px; background:rgba(0,0,0,0.7); color:#22d3ee; font-size:11px; font-weight:bold; letter-spacing:1px; pointer-events:none; }
        
        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .rp-btn-label { display:none; }
          .rp-sidebar { width:180px; min-width:180px; }
        }
        @media (max-width: 1024px) {
          .rp-body { flex-direction:column; overflow-y:auto; }
          .rp-sidebar { width:100%; min-width:100%; max-height:45vh; flex:none; }
          .rp-canvas-wrap { min-height:400px; flex:none; }
          .rp-title { font-size:0.9rem; }
          .rp-topbar { padding:4px 0; }
          .rp-btn { padding:4px 6px; }
          .rp-select { max-width:90px; font-size:12px; }
        }
        @media (max-width: 480px) {
          .rp-sidebar { max-height:40vh; padding:6px; }
          .rp-topbar-right { gap:2px; }
          .rp-btn { padding:3px 5px; font-size:11px; }
          .rp-status-badge { font-size:9px; padding:2px 6px; }
        }
      `}</style>
    </div>
  );
}
