import React, { useState } from 'react';
import { Joyride, STATUS } from 'react-joyride';

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

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: '#0f172a',
          backgroundColor: '#0f172a',
          overlayColor: 'rgba(0, 0, 0, 0.7)',
          primaryColor: '#22d3ee',
          textColor: '#f8fafc',
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: 'left',
          fontFamily: '"Rajdhani", sans-serif',
          fontSize: '16px',
        },
        buttonNext: {
          backgroundColor: '#22d3ee',
          color: '#0f172a',
          fontWeight: 'bold',
        }
      }}
    />
  );
}
