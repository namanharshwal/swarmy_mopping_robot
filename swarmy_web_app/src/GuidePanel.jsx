import React from 'react';
import { BookOpen, Map, Navigation, Mic, Cpu, Server, Network, ShieldCheck, Database, HardDrive, MonitorSmartphone } from 'lucide-react';

export default function GuidePanel() {
  return (
    <div className="flex flex-col h-full bg-[#0a0f1e] text-slate-300 font-['Rajdhani'] overflow-y-auto">
      <div className="p-8 border-b border-slate-800">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2 flex items-center">
          <BookOpen className="mr-4" size={40} /> Swarmy OS Operations Guide
        </h1>
        <p className="text-slate-400 text-lg">Welcome to your complete industrial AMR fleet manager.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 p-8">
        {/* TEXT GUIDE */}
        <div className="space-y-8">
          <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-cyan-500/50 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 group-hover:shadow-[0_0_15px_#22d3ee]"></div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center"><Map className="mr-3 text-cyan-400" /> 1. Mapping & Navigation</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong>2D Mapping (SLAM):</strong> Use this to generate a floor plan of your facility. Drive the robot around using Teleoperation until the map is complete, then save it.</li>
              <li><strong>Route Planner:</strong> Drop waypoints on your saved map. Name them (e.g. &quot;Dock&quot;, &quot;Station A&quot;) so they can be referenced by the state machine later.</li>
              <li><strong>Navigation:</strong> Click anywhere on the map to send the robot there autonomously.</li>
            </ul>
          </section>

          <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 group-hover:shadow-[0_0_15px_#a855f7]"></div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center"><Cpu className="mr-3 text-purple-400" /> 2. Swarmy Studio (State Machine)</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong>Drag and Drop:</strong> Pull tasks (like `go_to_place`) from the right sidebar onto the canvas.</li>
              <li><strong>Configure:</strong> Click the node on the canvas to open the Properties Panel. Type in coordinates, waypoint names, or speech text.</li>
              <li><strong>Wiring:</strong> Connect nodes via the Green (Success) or Red (Failure) dots at the bottom of each block.</li>
              <li><strong>Execute:</strong> Click &quot;Update &amp; Run&quot; to compile the flowchart into JSON and physically drive the robot.</li>
            </ul>
          </section>

          <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 group-hover:shadow-[0_0_15px_#f59e0b]"></div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center"><Mic className="mr-3 text-amber-400" /> 3. AI Voice Assistant</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong>Voice Comm:</strong> Use the &quot;AI Assistant&quot; tab to hold natural conversations with Swarmy.</li>
              <li><strong>Robot Control:</strong> You can verbally command the robot (e.g., &quot;Drive forward 2 meters&quot;, &quot;Dance for me&quot;, or &quot;Spin around&quot;).</li>
              <li><strong>Emotions:</strong> The robot&apos;s face will autonomously update its expression based on the context of your conversation.</li>
            </ul>
          </section>
        </div>

        {/* 3D CSS ARCHITECTURE DIAGRAM */}
        <div className="flex flex-col h-full min-h-[600px]">
          <h2 className="text-2xl font-bold text-white mb-4 pl-4 border-l-4 border-cyan-500">Interactive 3D Architecture Flow</h2>
          <p className="text-slate-400 mb-6">This isometric map represents the software and hardware stack running inside Swarmy OS.</p>
          
          <div className="flex-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-[#050810] rounded-xl border border-slate-700 overflow-hidden shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] relative flex items-center justify-center perspective-[1200px]">
            
            {/* ISOMETRIC CONTAINER */}
            <div className="relative w-[300px] h-[400px] transition-transform duration-1000 ease-in-out hover:rotate-x-[55deg] hover:rotate-z-[-35deg] rotate-x-[60deg] rotate-z-[-45deg] transform-style-preserve-3d" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(60deg) rotateZ(-45deg)' }}>
              
              {/* Layer 4: Client App */}
              <div className="absolute top-0 left-0 w-full h-[120px] bg-cyan-950/60 backdrop-blur-sm border-2 border-cyan-500/80 rounded-xl shadow-[0_0_30px_rgba(34,211,238,0.3)] flex items-center justify-center flex-col translate-z-[150px] transition-all hover:-translate-y-4 hover:translate-z-[180px] hover:shadow-[0_0_50px_rgba(34,211,238,0.6)] cursor-pointer group">
                <MonitorSmartphone size={32} className="text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-cyan-50 tracking-wider">Web Dashboard</span>
                <span className="text-xs text-cyan-300/70 mt-1">React + Tailwind</span>
              </div>
              
              {/* Vertical Wire 4->3 */}
              <div className="absolute left-1/2 top-[120px] w-1 h-[40px] bg-gradient-to-b from-cyan-500 to-purple-500 -translate-x-1/2 translate-z-[110px]"></div>

              {/* Layer 3: Backend Node.js */}
              <div className="absolute top-[160px] left-[-20px] w-[340px] h-[120px] bg-purple-950/60 backdrop-blur-sm border-2 border-purple-500/80 rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center justify-center flex-col translate-z-[75px] transition-all hover:-translate-y-4 hover:translate-z-[105px] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] cursor-pointer group">
                <div className="flex gap-6 mb-2">
                  <div className="flex flex-col items-center"><Server size={24} className="text-purple-400 group-hover:scale-110 transition-transform" /><span className="text-[10px] mt-1 text-purple-200">Express API</span></div>
                  <div className="flex flex-col items-center"><Network size={24} className="text-purple-400 group-hover:scale-110 transition-transform" /><span className="text-[10px] mt-1 text-purple-200">OPC UA Server</span></div>
                  <div className="flex flex-col items-center"><Cpu size={24} className="text-purple-400 group-hover:scale-110 transition-transform" /><span className="text-[10px] mt-1 text-purple-200">Workflow Engine</span></div>
                </div>
                <span className="font-bold text-purple-50 tracking-wider">Node.js Middleware</span>
              </div>

              {/* Vertical Wire 3->2 */}
              <div className="absolute left-1/2 top-[280px] w-1 h-[40px] bg-gradient-to-b from-purple-500 to-green-500 -translate-x-1/2 translate-z-[35px]"></div>

              {/* Layer 2: ROS Core */}
              <div className="absolute top-[320px] left-0 w-full h-[120px] bg-green-950/60 backdrop-blur-sm border-2 border-green-500/80 rounded-xl shadow-[0_0_30px_rgba(34,197,94,0.3)] flex items-center justify-center flex-col translate-z-[0px] transition-all hover:-translate-y-4 hover:translate-z-[30px] hover:shadow-[0_0_50px_rgba(34,197,94,0.6)] cursor-pointer group">
                <Database size={32} className="text-green-400 mb-2 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-green-50 tracking-wider">ROS Melodic Core</span>
                <span className="text-xs text-green-300/70 mt-1">roscore / rosbridge</span>
              </div>

              {/* Vertical Wire 2->1 */}
              <div className="absolute left-1/2 top-[440px] w-1 h-[40px] bg-gradient-to-b from-green-500 to-slate-500 -translate-x-1/2 translate-z-[-40px]"></div>

              {/* Layer 1: Hardware Base */}
              <div className="absolute top-[480px] left-[-40px] w-[380px] h-[140px] bg-slate-900/80 border-2 border-slate-600 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center justify-center flex-col translate-z-[-75px] transition-all hover:-translate-y-4 hover:translate-z-[-45px] hover:shadow-[0_0_50px_rgba(100,116,139,0.5)] cursor-pointer group">
                <div className="flex gap-8 mb-2">
                  <div className="flex flex-col items-center"><HardDrive size={28} className="text-slate-400 group-hover:text-cyan-400 transition-colors" /><span className="text-xs mt-1 text-slate-300">Jetson Nano</span></div>
                  <div className="flex flex-col items-center"><Cpu size={28} className="text-slate-400 group-hover:text-cyan-400 transition-colors" /><span className="text-xs mt-1 text-slate-300">Arduino Mega</span></div>
                  <div className="flex flex-col items-center"><ShieldCheck size={28} className="text-slate-400 group-hover:text-cyan-400 transition-colors" /><span className="text-xs mt-1 text-slate-300">Sensors / Lidar</span></div>
                </div>
                <span className="font-bold text-slate-50 tracking-wider mt-2">Physical Hardware Layer</span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
