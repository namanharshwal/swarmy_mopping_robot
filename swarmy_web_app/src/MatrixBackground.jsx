import React, { useEffect, useState } from 'react';

const MatrixBackground = () => {
  const [theme, setTheme] = useState(localStorage.getItem('swarmy_theme') || 'cyber');
  
  // Detect touch devices (tablets, phones) perfectly regardless of screen size
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Check if device uses a touch screen (coarse pointer)
    const checkTouch = () => {
      setIsTouchDevice(window.matchMedia("(pointer: coarse)").matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    
    const handleThemeChange = () => {
      setTheme(localStorage.getItem('swarmy_theme') || 'cyber');
    };
    
    window.addEventListener('themeChanged', handleThemeChange);

    // Throttled mouse position to the iframe for parallax
    let lastTime = 0;
    const onMouseMove = (e) => {
      if (isTouchDevice) return;
      const now = Date.now();
      if (now - lastTime < 50) return; // Throttle to max 20 fps
      lastTime = now;
      
      const mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
      const mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);
      
      const iframe = document.getElementById('robot-bg-iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'mousemove', x: mouseX, y: mouseY }, '*');
      }
    };
    
    // Only add mousemove on non-touch devices to save CPU
    if (!isTouchDevice) {
      document.addEventListener('mousemove', onMouseMove);
    }
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
      document.removeEventListener('mousemove', onMouseMove);
    };
  }, [isTouchDevice]);

  // Completely disable the heavy 3D WebGL background on ANY touch device to eliminate all lag
  if (isTouchDevice) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0,
        background: theme === 'light' ? '#f0f0f0' : '#050a15',
        backgroundImage: theme === 'light' ? 'linear-gradient(to right, #ddd 1px, transparent 1px), linear-gradient(to bottom, #ddd 1px, transparent 1px)' : 'linear-gradient(to right, #111 1px, transparent 1px), linear-gradient(to bottom, #111 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        opacity: 0.8
      }} />
    );
  }

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
