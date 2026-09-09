import React, { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { BookOpen, Map, Navigation, Mic, Cpu } from 'lucide-react';

export default function GuidePanel() {
  const fgRef = useRef();
  
  // Data for the 3D System Architecture graph
  const graphData = {
    nodes: [
      { id: 'User', group: 1, label: 'User (You)' },
      { id: 'WebApp', group: 2, label: 'React Web Dashboard' },
      { id: 'NodeServer', group: 3, label: 'Node.js Express Backend' },
      { id: 'ROSBridge', group: 4, label: 'ROS Bridge / Websocket' },
      { id: 'ROSCore', group: 5, label: 'ROS Master (Melodic)' },
      { id: 'Navigation', group: 6, label: 'MoveBase / Navigation' },
      { id: 'Mapping', group: 6, label: 'GMapping / Cartographer' },
      { id: 'Hardware', group: 7, label: 'Jetson Nano & Arduino' },
      { id: 'Motors', group: 8, label: 'Drive Motors (cmd_vel)' },
      { id: 'Sensors', group: 8, label: 'Lidar & Ultrasonic' },
      { id: 'AI', group: 9, label: 'AI Voice / Gemini' },
      { id: 'Studio', group: 9, label: 'Swarmy Studio (Engine)' },
      { id: 'OPCUA', group: 10, label: 'OPC UA Server (PLC Bridge)' }
    ],
    links: [
      { source: 'User', target: 'WebApp' },
      { source: 'WebApp', target: 'NodeServer' },
      { source: 'WebApp', target: 'ROSBridge' },
      { source: 'NodeServer', target: 'AI' },
      { source: 'NodeServer', target: 'Studio' },
      { source: 'NodeServer', target: 'OPCUA' },
      { source: 'ROSBridge', target: 'ROSCore' },
      { source: 'Studio', target: 'ROSCore' },
      { source: 'OPCUA', target: 'ROSCore' },
      { source: 'ROSCore', target: 'Navigation' },
      { source: 'ROSCore', target: 'Mapping' },
      { source: 'Navigation', target: 'Hardware' },
      { source: 'Mapping', target: 'Hardware' },
      { source: 'Hardware', target: 'Motors' },
      { source: 'Hardware', target: 'Sensors' }
    ]
  };

  useEffect(() => {
    // Camera animation spin
    let angle = 0;
    const distance = 400;
    const interval = setInterval(() => {
      if (fgRef.current) {
        fgRef.current.cameraPosition({
          x: distance * Math.sin(angle),
          z: distance * Math.cos(angle),
          y: distance * 0.2
        });
        angle += Math.PI / 300;
      }
    }, 30);
    return () => clearInterval(interval);
  }, []);

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
          <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center"><Map className="mr-3 text-cyan-400" /> 1. Mapping & Navigation</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong>2D Mapping (SLAM):</strong> Use this to generate a floor plan of your facility. Drive the robot around using Teleoperation until the map is complete, then save it.</li>
              <li><strong>Route Planner:</strong> Drop waypoints on your saved map. Name them (e.g. "Dock", "Station A") so they can be referenced by the state machine later.</li>
              <li><strong>Navigation:</strong> Click anywhere on the map to send the robot there autonomously.</li>
            </ul>
          </section>

          <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center"><Cpu className="mr-3 text-purple-400" /> 2. Swarmy Studio (State Machine)</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong>Drag and Drop:</strong> Pull tasks (like `go_to_place`) from the right sidebar onto the canvas.</li>
              <li><strong>Configure:</strong> Click the node on the canvas to open the Properties Panel. Type in coordinates, waypoint names, or speech text.</li>
              <li><strong>Wiring:</strong> Connect nodes via the Green (Success) or Red (Failure) dots at the bottom of each block.</li>
              <li><strong>Execute:</strong> Click "Update & Run" to compile the flowchart into JSON and physically drive the robot.</li>
            </ul>
          </section>

          <section className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center"><Mic className="mr-3 text-amber-400" /> 3. AI Voice Assistant</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong>Voice Comm:</strong> Use the "AI Assistant" tab to hold natural conversations with Swarmy.</li>
              <li><strong>Robot Control:</strong> You can verbally command the robot (e.g., "Drive forward 2 meters", "Dance for me", or "Spin around").</li>
              <li><strong>Emotions:</strong> The robot's face will autonomously update its expression (Happy, Angry, Confused) based on the context of your conversation.</li>
            </ul>
          </section>
        </div>

        {/* 3D FLOW CHART */}
        <div className="flex flex-col">
          <h2 className="text-2xl font-bold text-white mb-4 pl-4 border-l-4 border-cyan-500">Interactive 3D Architecture Flow</h2>
          <p className="text-slate-400 mb-4">Click and drag to rotate the view. Scroll to zoom. This graph represents how the Swarmy OS web stack communicates with the physical hardware.</p>
          
          <div className="flex-1 bg-black rounded-xl border border-slate-800 overflow-hidden shadow-2xl relative min-h-[500px]">
            <ForceGraph3D
              ref={fgRef}
              graphData={graphData}
              nodeLabel="label"
              nodeAutoColorBy="group"
              nodeResolution={16}
              linkDirectionalArrowLength={3.5}
              linkDirectionalArrowRelPos={1}
              backgroundColor="#050810"
              linkColor={() => 'rgba(34, 211, 238, 0.4)'}
              width={800}
              height={600}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
