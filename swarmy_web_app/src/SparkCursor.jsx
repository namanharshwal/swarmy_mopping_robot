import React, { useEffect, useRef } from 'react';

const SparkCursor = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const addSparks = (x, y) => {
      const computedStyle = getComputedStyle(document.documentElement);
      const cyan = computedStyle.getPropertyValue('--hexa-cyan').trim() || '#00f3ff';
      const isMove = Math.random() > 0.5;

      for (let i = 0; i < (isMove ? 2 : 1); i++) {
        particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4 + 1.5, // Slight gravity effect
          life: 1.0, // Alpha
          decay: Math.random() * 0.04 + 0.02,
          size: Math.random() * 2 + 1,
          color: Math.random() > 0.5 ? '#ffffff' : cyan
        });
      }
    };

    const onMouseMove = (e) => {
      addSparks(e.clientX, e.clientY);
    };

    window.addEventListener('mousemove', onMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = p.life;
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;
      requestAnimationFrame(draw);
    };

    let animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999, // Render over everything
        pointerEvents: 'none',
      }}
    />
  );
};

export default SparkCursor;
