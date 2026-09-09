import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './TourGuide.css';

export default function TourGuide() {
  useEffect(() => {
    const startTour = () => {
      // Create fresh driver instance every time to avoid stale DOM refs
      const driverObj = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: false,
        overlayColor: 'rgba(10, 15, 30, 0.85)',
        popoverClass: 'swarmy-driver-popover',
        doneBtnText: 'FINISH',
        nextBtnText: 'NEXT',
        prevBtnText: 'BACK',
        onDestroyed: () => {
          localStorage.setItem('swarmy_tour_completed_v4', 'true');
        },
        steps: [
          {
            popover: {
              title: 'Welcome to Swarmy OS! 🤖',
              description: 'Let us take a quick tour of your new industrial robot fleet manager. This dashboard is your central command.',
              side: "center",
              align: 'start'
            }
          },
          {
            element: '.tour-dashboard',
            popover: {
              title: 'Real-Time Dashboard 📊',
              description: 'Monitor robot vitals, CPU usage, voltage, and the ROS Core status in real-time.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-system-guide',
            popover: {
              title: '3D Architecture Map 🗺️',
              description: 'Lost? Check out the System Guide for a full 3D interactive flowchart of the entire hardware/software stack.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-swarmy-studio',
            popover: {
              title: 'Swarmy Studio ⚙️',
              description: 'Build complex automation routines using our Drag-and-Drop state machine editor. No coding required!',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-opc-ua-interface',
            popover: {
              title: 'OPC UA Integration 🏭',
              description: 'Seamlessly connect Swarmy to your factory PLCs (Siemens, Allen Bradley) for deep industrial integration.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-ai-assistant',
            popover: {
              title: 'AI Voice Control 🎙️',
              description: 'Speak directly to your robot using natural language. Command it to move, dance, or just chat with the onboard LLM.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-help-button',
            popover: {
              title: 'Need Help Again? 🆘',
              description: 'You can always click this Help button to replay this tour at any time!',
              side: "bottom",
              align: 'end'
            }
          }
        ]
      });
      driverObj.drive();
    };

    const handleStartTour = () => startTour();
    window.addEventListener('start-tour', handleStartTour);

    if (localStorage.getItem('swarmy_tour_completed_v4') !== 'true') {
      setTimeout(() => startTour(), 1500);
    }

    return () => window.removeEventListener('start-tour', handleStartTour);
  }, []);

  return null;
}
