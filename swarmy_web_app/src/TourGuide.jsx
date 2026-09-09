import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import './TourGuide.css';

export default function TourGuide() {
  useEffect(() => {
    const startTour = () => {
      // Force open mobile menu if on mobile
      window.dispatchEvent(new Event('toggleMobileMenu-force-open'));
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
              description: 'Let us take a comprehensive tour of your new industrial robot fleet manager. We will go through every single panel step by step.',
              side: "center",
              align: 'start'
            }
          },
          {
            element: '.tour-dashboard',
            popover: {
              title: '1. Dashboard 📊',
              description: 'Your central mission control. Monitor ROS Core status, battery voltage, telemetry, and trigger Emergency Stops from here.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-mission-launcher',
            popover: {
              title: '2. Mission Launcher 🚀',
              description: 'Select your saved floor maps and compiled autonomous scripts to deploy Swarmy into action instantly.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-swarmy-studio',
            popover: {
              title: '3. Swarmy Studio 🛠️',
              description: 'Our proprietary No-Code IDE. Drag and drop action nodes to program complex autonomous workflows without writing any code.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-2d-mapping--slam-',
            popover: {
              title: '4. 2D Mapping (SLAM) 🗺️',
              description: 'Manually drive the robot while the LiDAR sensor actively scans and builds a live 2D floor plan of your facility.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-auto-mapping',
            popover: {
              title: '5. Auto Mapping 🧭',
              description: 'Let Swarmy map the building automatically using Frontier Exploration algorithms to seek out unknown areas.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-auto-navigation',
            popover: {
              title: '6. Auto Navigation 🎯',
              description: 'Click anywhere on the map and the ROS Navigation Stack will autonomously drive the robot there, avoiding obstacles.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-route-planner',
            popover: {
              title: '7. Route Planner 📍',
              description: 'Drop coordinate pins on your map to create named Waypoints (e.g., "Dock") that can be referenced in your Studio missions.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-opc-ua-interface',
            popover: {
              title: '8. OPC UA Interface 🏭',
              description: 'Bridge Swarmy to your factory. Connect Siemens or Allen Bradley PLCs to read robot states or trigger missions over the network.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-workspace-ide',
            popover: {
              title: '9. Workspace IDE 💻',
              description: 'A full browser-based code editor for advanced developers to modify underlying Python and ROS scripts.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-web-terminal',
            popover: {
              title: '10. Web Terminal ⌨️',
              description: 'Direct SSH root access to the Swarmy Jetson Nano hardware for system administration.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-ros-rqt-graph',
            popover: {
              title: '11. ROS RQT Graph 🕸️',
              description: 'Visualize the live architecture of the Robot Operating System. Verify sensors and active node connections.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-all-launch-files',
            popover: {
              title: '12. Launch Files 📁',
              description: 'Manage and restart specific ROS launch configurations directly from the web interface.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-teleoperation',
            popover: {
              title: '13. Teleoperation 🎮',
              description: 'Take manual physical control of the robot chassis using the on-screen joystick or your keyboard (WASD).',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-ai-assistant',
            popover: {
              title: '14. AI Assistant 🎙️',
              description: 'Talk to your robot! Give natural language voice commands to move the robot or query its status using the onboard LLM.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-robot-face',
            popover: {
              title: '15. Robot Face 😃',
              description: 'View and control the emotional expressions of Swarmy. Highly responsive eyes that react to situations.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-system-manager',
            popover: {
              title: '16. System Manager ⚙️',
              description: 'View backend Node.js logs, restart core services, or execute a complete safe reboot of the ROS Core.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-settings',
            popover: {
              title: '17. Settings 🛠️',
              description: 'Configure network IP addresses, adjust physical velocity limits, and tune AI voice synthesis parameters.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-system-guide',
            popover: {
              title: '18. System Guide 📖',
              description: 'Access the massive animated cyberpunk flowchart mapping out this exact workflow in a beautiful interactive format.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '.tour-about-swarmy',
            popover: {
              title: '19. About ℹ️',
              description: 'View licensing, version information, and software acknowledgments for Swarmy OS.',
              side: "right",
              align: 'start'
            }
          },
          {
            popover: {
              title: 'Tour Complete! 🎉',
              description: 'You are now ready to take full control of the Swarmy industrial automation platform. Click FINISH to begin.',
              side: "center",
              align: 'start'
            }
          }
        ]
      });
      driverObj.drive();
    };

    const handleStartTour = () => setTimeout(() => startTour(), 400);

    window.addEventListener('start-tour', handleStartTour);
    return () => {
      window.removeEventListener('start-tour', handleStartTour);
    };
  }, []);

  return null;
}
