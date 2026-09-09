import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonitorSmartphone, Server, Database, Cpu, Activity, ArrowRight, Zap, Network, ShieldCheck } from 'lucide-react';

const FLOW_STAGES = [
  {
    id: 0,
    title: 'COMMAND INTERFACE',
    subtitle: 'React UI & AI Voice Core',
    desc: 'The human entry point. You interact via the Swarmy Dashboard, dragging visual nodes in Swarmy Studio, or speaking naturally to the AI. This layer parses your intent into structured JSON payloads.',
    icon: <MonitorSmartphone size={32} />,
    color: 'cyan',
    glow: 'shadow-[0_0_40px_rgba(34,211,238,0.6)]',
    text: 'text-cyan-400',
    border: 'border-cyan-500',
    gradient: 'from-cyan-950/80 to-slate-900',
    layerZ: 150
  },
  {
    id: 1,
    title: 'MIDDLEWARE ENGINE',
    subtitle: 'Node.js & OPC UA',
    desc: 'The nervous system. It receives JSON payloads via WebSocket, translates them into industrial OPC UA tags for PLCs, and bridges the data directly into the ROS environment at high frequency.',
    icon: <Server size={32} />,
    color: 'purple',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.6)]',
    text: 'text-purple-400',
    border: 'border-purple-500',
    gradient: 'from-purple-950/80 to-slate-900',
    layerZ: 75
  },
  {
    id: 2,
    title: 'ROS CORE ENGINE',
    subtitle: 'ROS Melodic Navigation Stack',
    desc: 'The algorithmic center. ROS computes inverse kinematics, generates localized costmaps using SLAM (LiDAR + Ultrasonic), and charts a collision-free path for the robot chassis.',
    icon: <Database size={32} />,
    color: 'green',
    glow: 'shadow-[0_0_40px_rgba(34,197,94,0.6)]',
    text: 'text-green-400',
    border: 'border-green-500',
    gradient: 'from-green-950/80 to-slate-900',
    layerZ: 0
  },
  {
    id: 3,
    title: 'PHYSICAL ACTUATION',
    subtitle: 'Jetson Nano + Motor Controllers',
    desc: 'The physical edge. The Jetson Nano processes LiDAR point clouds in real-time and transmits velocity vectors (cmd_vel) via serial to the Arduino, which physically spins the motor encoders.',
    icon: <Cpu size={32} />,
    color: 'amber',
    glow: 'shadow-[0_0_40px_rgba(245,158,11,0.6)]',
    text: 'text-amber-400',
    border: 'border-amber-500',
    gradient: 'from-amber-950/80 to-slate-900',
    layerZ: -75
  }
];

export default function GuidePanel() {
  const [activeLayer, setActiveLayer] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // Auto-play the data flow animation
  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setActiveLayer((prev) => (prev + 1) % FLOW_STAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  return (
    <div className="flex flex-col h-full bg-[#050810] text-slate-300 font-['Rajdhani'] overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80 bg-slate-950/50 flex justify-between items-center z-10 relative">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center tracking-widest">
            <Zap className="mr-3 text-cyan-400" size={28} /> SWARMY OS <span className="text-slate-500 ml-2">|| DATA PIPELINE</span>
          </h1>
          <p className="text-slate-400 text-sm uppercase tracking-widest">Interactive Robotic Data Flow & Architecture Simulator</p>
        </div>
        <button 
          onClick={() => setAutoPlay(!autoPlay)}
          className={`px-4 py-2 border rounded-lg text-sm font-bold tracking-widest transition-all ${autoPlay ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]' : 'border-slate-600 text-slate-500'}`}
        >
          {autoPlay ? 'AUTOPLAY: ON' : 'AUTOPLAY: OFF'}
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-0 relative">
        
        {/* LEFT PANEL: Interactive Data Flow Timeline */}
        <div className="p-8 flex flex-col justify-center border-r border-slate-800/50 bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-slate-900 to-[#050810]">
          <div className="space-y-6 relative max-w-xl mx-auto w-full">
            
            {/* Connecting Vertical Line */}
            <div className="absolute left-[39px] top-10 bottom-10 w-1 bg-slate-800 rounded-full">
              {/* Animated Data Packet */}
              <motion.div 
                className={`absolute left-0 w-full bg-${FLOW_STAGES[activeLayer].color}-500 shadow-[0_0_10px_currentColor]`}
                animate={{ 
                  top: `${(activeLayer / (FLOW_STAGES.length - 1)) * 100}%`,
                  height: activeLayer === FLOW_STAGES.length - 1 ? '0%' : '20%'
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>

            {FLOW_STAGES.map((stage, idx) => {
              const isActive = activeLayer === idx;
              return (
                <div 
                  key={stage.id}
                  onClick={() => { setActiveLayer(idx); setAutoPlay(false); }}
                  className={`relative flex items-start gap-6 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${isActive ? `bg-gradient-to-r ${stage.gradient} border ${stage.border}` : 'hover:bg-slate-900/50 border border-transparent'}`}
                >
                  {/* Icon Node */}
                  <div className={`relative z-10 w-12 h-12 flex items-center justify-center rounded-xl bg-slate-900 border transition-all duration-500 ${isActive ? `${stage.border} ${stage.text} ${stage.glow} scale-110` : 'border-slate-700 text-slate-500'}`}>
                    {stage.icon}
                  </div>

                  {/* Text Content */}
                  <div className="flex-1">
                    <h3 className={`text-xl font-bold tracking-widest transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-500'}`}>
                      {stage.title}
                    </h3>
                    <h4 className={`text-sm tracking-widest uppercase mb-2 ${isActive ? stage.text : 'text-slate-600'}`}>
                      {stage.subtitle}
                    </h4>
                    
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <p className="text-slate-300 text-[15px] leading-relaxed mt-2 border-l-2 border-slate-700 pl-4 py-1">
                            {stage.desc}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Exploded 3D Isometric View */}
        <div className="relative flex items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-[#020408] overflow-hidden perspective-[1200px]">
          
          {/* Animated Background Grid */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          {/* ISOMETRIC CONTAINER */}
          <div className="relative w-[340px] h-[450px] transform-style-preserve-3d transition-transform duration-700 ease-out" 
               style={{ transformStyle: 'preserve-3d', transform: 'rotateX(55deg) rotateZ(-40deg)' }}>
            
            {/* Layer 4: Client App */}
            <div className={`absolute top-0 left-0 w-full h-[120px] backdrop-blur-md rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-700
              ${activeLayer === 0 ? 'bg-cyan-900/60 border-2 border-cyan-400 shadow-[0_0_60px_rgba(34,211,238,0.5)] opacity-100 z-50' : 'bg-cyan-950/20 border border-cyan-800/50 opacity-40 z-10'}`}
              style={{ transform: `translateZ(${activeLayer === 0 ? 180 : 150}px)` }}
              onClick={() => { setActiveLayer(0); setAutoPlay(false); }}
            >
              <MonitorSmartphone size={32} className={`mb-2 ${activeLayer === 0 ? 'text-cyan-300' : 'text-cyan-700'}`} />
              <span className={`font-bold tracking-widest ${activeLayer === 0 ? 'text-cyan-50' : 'text-cyan-800'}`}>WEB & AI</span>
            </div>
            
            {/* Data Stream Wire 1 */}
            <div className={`absolute left-1/2 top-[120px] w-1.5 h-[40px] -translate-x-1/2 transition-colors duration-500
              ${activeLayer === 0 || activeLayer === 1 ? 'bg-gradient-to-b from-cyan-400 to-purple-500 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-800'}`} 
              style={{ transform: 'translateZ(110px)' }}></div>

            {/* Layer 3: Backend Node.js */}
            <div className={`absolute top-[160px] left-[-20px] w-[380px] h-[120px] backdrop-blur-md rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-700
              ${activeLayer === 1 ? 'bg-purple-900/60 border-2 border-purple-400 shadow-[0_0_60px_rgba(168,85,247,0.5)] opacity-100 z-40' : 'bg-purple-950/20 border border-purple-800/50 opacity-40 z-20'}`}
              style={{ transform: `translateZ(${activeLayer === 1 ? 105 : 75}px)` }}
              onClick={() => { setActiveLayer(1); setAutoPlay(false); }}
            >
              <div className="flex gap-8 mb-2">
                <Server size={28} className={activeLayer === 1 ? 'text-purple-300' : 'text-purple-700'} />
                <Network size={28} className={activeLayer === 1 ? 'text-purple-300' : 'text-purple-700'} />
              </div>
              <span className={`font-bold tracking-widest ${activeLayer === 1 ? 'text-purple-50' : 'text-purple-800'}`}>MIDDLEWARE (NODE.JS)</span>
            </div>

            {/* Data Stream Wire 2 */}
            <div className={`absolute left-1/2 top-[280px] w-1.5 h-[40px] -translate-x-1/2 transition-colors duration-500
              ${activeLayer === 1 || activeLayer === 2 ? 'bg-gradient-to-b from-purple-400 to-green-500 shadow-[0_0_10px_#a855f7]' : 'bg-slate-800'}`} 
              style={{ transform: 'translateZ(35px)' }}></div>

            {/* Layer 2: ROS Core */}
            <div className={`absolute top-[320px] left-0 w-full h-[120px] backdrop-blur-md rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-700
              ${activeLayer === 2 ? 'bg-green-900/60 border-2 border-green-400 shadow-[0_0_60px_rgba(34,197,94,0.5)] opacity-100 z-30' : 'bg-green-950/20 border border-green-800/50 opacity-40 z-30'}`}
              style={{ transform: `translateZ(${activeLayer === 2 ? 30 : 0}px)` }}
              onClick={() => { setActiveLayer(2); setAutoPlay(false); }}
            >
              <Database size={32} className={`mb-2 ${activeLayer === 2 ? 'text-green-300' : 'text-green-700'}`} />
              <span className={`font-bold tracking-widest ${activeLayer === 2 ? 'text-green-50' : 'text-green-800'}`}>ROS CORE</span>
            </div>

            {/* Data Stream Wire 3 */}
            <div className={`absolute left-1/2 top-[440px] w-1.5 h-[40px] -translate-x-1/2 transition-colors duration-500
              ${activeLayer === 2 || activeLayer === 3 ? 'bg-gradient-to-b from-green-400 to-amber-500 shadow-[0_0_10px_#22c55e]' : 'bg-slate-800'}`} 
              style={{ transform: 'translateZ(-40px)' }}></div>

            {/* Layer 1: Hardware Base */}
            <div className={`absolute top-[480px] left-[-40px] w-[420px] h-[140px] bg-slate-900/80 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-700
              ${activeLayer === 3 ? 'border-2 border-amber-400 shadow-[0_20px_70px_rgba(245,158,11,0.5)] opacity-100 z-20' : 'border border-slate-700 opacity-60 z-40'}`}
              style={{ transform: `translateZ(${activeLayer === 3 ? -45 : -75}px)` }}
              onClick={() => { setActiveLayer(3); setAutoPlay(false); }}
            >
              <div className="flex gap-10 mb-2">
                <Cpu size={32} className={activeLayer === 3 ? 'text-amber-300' : 'text-slate-600'} />
                <Activity size={32} className={activeLayer === 3 ? 'text-amber-300' : 'text-slate-600'} />
                <ShieldCheck size={32} className={activeLayer === 3 ? 'text-amber-300' : 'text-slate-600'} />
              </div>
              <span className={`font-bold tracking-widest mt-2 ${activeLayer === 3 ? 'text-amber-50' : 'text-slate-500'}`}>PHYSICAL HARDWARE</span>
            </div>

          </div>
          
          {/* Action indicator at bottom */}
          <div className="absolute bottom-8 text-center animate-bounce text-slate-500 text-sm tracking-widest">
            CLICK ANY LAYER TO EXPLORE
          </div>
        </div>

      </div>
    </div>
  );
}
