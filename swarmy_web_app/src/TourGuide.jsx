import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, ChevronRight, X, LayoutDashboard, Map, Network, Server, Brain, Sparkles, MoveRight } from 'lucide-react';

const STEPS = [
  {
    id: 'intro',
    title: 'SYSTEM INITIALIZED',
    content: 'Welcome to Swarmy OS. The ultimate industrial fleet management system is now online. Let us configure your neural link and explore the interface.',
    icon: <Sparkles className="text-cyan-400 mb-4" size={48} />,
    color: 'from-cyan-500/20 to-blue-500/20'
  },
  {
    id: 'dashboard',
    title: 'MISSION CONTROL',
    content: 'The Dashboard gives you real-time telemetry. Monitor CPU, RAM, battery voltage, and the ROS Core connection status of your physical robot instantly.',
    icon: <LayoutDashboard className="text-blue-400 mb-4" size={48} />,
    color: 'from-blue-500/20 to-indigo-500/20'
  },
  {
    id: 'studio',
    title: 'SWARMY STUDIO',
    content: 'Our flagship robotics engine. Drag and drop state nodes to visually program complex, autonomous robot behaviors without writing a single line of code.',
    icon: <Network className="text-purple-400 mb-4" size={48} />,
    color: 'from-purple-500/20 to-pink-500/20'
  },
  {
    id: 'opcua',
    title: 'OPC UA INTEGRATION',
    content: 'Bridge the gap between modern robotics and legacy PLCs. Swarmy seamlessly communicates with Siemens, Allen Bradley, and industrial factory servers.',
    icon: <Server className="text-emerald-400 mb-4" size={48} />,
    color: 'from-emerald-500/20 to-green-500/20'
  },
  {
    id: 'ai',
    title: 'AI NEURAL CORE',
    content: 'Speak naturally to your fleet. Command Swarmy to execute missions, dance, or navigate using an advanced embedded Large Language Model.',
    icon: <Brain className="text-amber-400 mb-4" size={48} />,
    color: 'from-amber-500/20 to-orange-500/20'
  },
  {
    id: 'guide',
    title: 'ARCHITECTURE MAP',
    content: 'Lost? Access the System Guide anytime for a fully interactive 3D isometric blueprint of the hardware and software stack.',
    icon: <Map className="text-rose-400 mb-4" size={48} />,
    color: 'from-rose-500/20 to-red-500/20'
  }
];

export default function TourGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if they need the tour
    if (localStorage.getItem('swarmy_tour_completed_v3') !== 'true') {
      setTimeout(() => setIsOpen(true), 1500); // Small delay on load for dramatic effect
    }
  }, []);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('swarmy_tour_completed_v3', 'true');
  };

  if (!isOpen) return null;

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center pointer-events-auto">
      {/* Dark Blur Overlay */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Floating Hologram Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.1, y: -20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl mx-4"
        >
          {/* Glowing Border Wrapper */}
          <div className="absolute -inset-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500 rounded-3xl opacity-50 blur-lg animate-pulse" />
          
          <div className={`relative bg-slate-900 border border-slate-700/50 rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br ${step.color}`}>
            
            {/* Top Bar */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-700/50 bg-slate-950/50">
              <div className="flex items-center gap-3">
                <div className="bg-cyan-500/20 p-2 rounded-lg">
                  <Bot className="text-cyan-400" size={20} />
                </div>
                <span className="text-cyan-50 font-['Rajdhani'] font-bold tracking-widest text-lg">SWARMY ASSISTANT</span>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-rose-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-10 flex flex-col items-center text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                {step.icon}
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-white font-['Rajdhani'] tracking-widest mb-4"
              >
                {step.title}
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-slate-300 text-lg leading-relaxed max-w-lg"
              >
                {step.content}
              </motion.p>
            </div>

            {/* Footer Controls */}
            <div className="flex items-center justify-between px-8 py-6 bg-slate-950/50 border-t border-slate-700/50">
              {/* Progress Indicators */}
              <div className="flex gap-2">
                {STEPS.map((s, idx) => (
                  <div 
                    key={idx} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentStep ? 'w-8 bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'w-2 bg-slate-700'}`}
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                {currentStep > 0 && (
                  <button 
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-6 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-bold tracking-wider text-sm"
                  >
                    BACK
                  </button>
                )}
                
                <button 
                  onClick={handleNext}
                  className="group relative px-8 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold tracking-widest text-sm overflow-hidden flex items-center gap-2 hover:bg-cyan-400 transition-all shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                >
                  <span className="relative z-10">{currentStep === STEPS.length - 1 ? 'START MISSION' : 'NEXT'}</span>
                  <MoveRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                </button>
              </div>
            </div>

          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
