import React, { useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { Bot } from 'lucide-react';

export default function TourGuide() {
  const [run, setRun] = useState(true);

  const steps = [
    {
      target: 'body',
      content: 'Welcome to Swarmy Enterprise OS! Let us take a quick tour of your new industrial robot fleet manager.',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '.tour-dashboard',
      content: 'The Dashboard shows you the real-time Vitals, CPU usage, and ROS Core status of the physical robot.',
      placement: 'right',
    },
    {
      target: '.tour-guide',
      content: 'The System Guide page contains a complete 3D Flow Chart of the system architecture and instructions on how to use Swarmy.',
      placement: 'right',
    },
    {
      target: '.tour-studio',
      content: 'Swarmy Studio is a drag-and-drop state machine builder. Drag nodes to create complex automated workflows without code!',
      placement: 'right',
    },
    {
      target: '.tour-opcua',
      content: 'The OPC UA Interface bridges Swarmy to your factory PLCs (like Siemens/Allen Bradley) for industrial automation.',
      placement: 'right',
    },
    {
      target: '.tour-ai-assistant',
      content: 'The AI Assistant allows you to control the robot using your voice via natural language processing.',
      placement: 'right',
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('swarmy_tour_completed', 'true');
    }
  };

  if (localStorage.getItem('swarmy_tour_completed') === 'true') {
    return null;
  }

  // Custom polished Tooltip for a better, smoother, cyberpunk feel
  const CustomTooltip = ({ index, step, backProps, primaryProps, skipProps, tooltipProps, isLastStep }) => (
    <div 
      {...tooltipProps} 
      className="bg-slate-900/95 backdrop-blur-md border border-cyan-500/40 p-5 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.2)] max-w-sm flex flex-col items-start gap-3 animate-fade-in"
      style={{ fontFamily: "'Rajdhani', sans-serif" }}
    >
      <div className="flex items-center gap-3 border-b border-slate-700/50 pb-3 w-full">
        <div className="bg-cyan-500/20 p-2 rounded-full">
          <Bot className="text-cyan-400" size={24} />
        </div>
        <h3 className="text-cyan-50 font-bold tracking-wide text-lg m-0">Swarmy Assistant</h3>
      </div>
      
      <div className="text-slate-300 text-[16px] leading-relaxed py-2">
        {step.content}
      </div>

      <div className="flex justify-between items-center w-full mt-2 pt-3 border-t border-slate-700/50">
        <div className="text-xs text-slate-500 font-bold tracking-widest">
          {index + 1} / {steps.length}
        </div>
        <div className="flex gap-2">
          {index > 0 && (
            <button {...backProps} className="px-4 py-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors text-sm font-bold">
              BACK
            </button>
          )}
          <button {...primaryProps} className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold transition-all shadow-[0_0_10px_rgba(34,211,238,0.3)] hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] text-sm">
            {isLastStep ? 'FINISH' : 'NEXT'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      showProgress={false}
      showSkipButton={false}
      disableOverlayClose={true}
      spotlightPadding={8}
      tooltipComponent={CustomTooltip}
      callback={handleJoyrideCallback}
      floaterProps={{
        disableAnimation: false,
        placement: 'auto',
      }}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: 'rgba(15, 23, 42, 0.85)',
        },
        spotlight: {
          borderRadius: '12px',
          boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.85), 0 0 15px rgba(34, 211, 238, 0.5)',
        }
      }}
    />
  );
}
