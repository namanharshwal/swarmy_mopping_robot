/**
 * ============================================================================
 * Project Handlers: Naman Sain & Souvik Mallik
 * 
 * Maintainers:
 * - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
 * - Souvik Mallik: Embedded Maintainer
 * ============================================================================
 */

import React, { useEffect, useState } from 'react';

const MatrixBackground = () => {
  const [theme, setTheme] = useState(localStorage.getItem('swarmy_theme') || 'cyber');

  useEffect(() => {
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('swarmy_theme') || 'cyber');
    };
    window.addEventListener('themeChanged', handleThemeChange);

    // Send mouse position to the iframe for parallax
    const onMouseMove = (e) => {
      const mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      
      const iframe = document.getElementById('robot-bg-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'mousemove', x: mouseX, y: mouseY }, '*');
      }
    };
    
    document.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <iframe
      id="robot-bg-iframe"
      src={`/robot.html?theme=${theme}`}
      title="Robot Background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        opacity: 0.9, 
        pointerEvents: 'none',
        border: 'none',
        background: 'transparent'
      }}
    />
  );
};

export default MatrixBackground;
