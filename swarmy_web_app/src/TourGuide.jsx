import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './TourGuide.css';

export default function TourGuide() {
  useEffect(() => {
    // Only run the tour if they haven't completed it
    if (localStorage.getItem('swarmy_tour_completed_v2') === 'true') {
      return;
    }

    const driverObj = driver({
      showProgress: true,
      animate: true,
      smoothScroll: true,
      allowClose: false,
      overlayColor: 'rgba(10, 15, 30, 0.85)',
      popoverClass: 'swarmy-driver-popover',
      doneBtnText: 'Finish',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      onDestroyed: () => {
        localStorage.setItem('swarmy_tour_completed_v2', 'true');
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
            side: "top",
            align: 'end'
          }
        }
      ]
    });

    // Small delay to ensure the DOM elements (like the sidebar) are fully rendered before driving
    setTimeout(() => {
      driverObj.drive();
    }, 1000);

  }, []);

  return null;
}
