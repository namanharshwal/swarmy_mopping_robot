import json

header = """// ============================================================================
// Project Handlers: Naman Sain & Souvik Mallik
// 
// Maintainers:
// - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
// - Souvik Mallik: Embedded Maintainer
// ============================================================================

import React, { useRef, useEffect } from 'react';

"""

emotions = {}

def add(name, eShape='circle', mShape='curve', eColor='#00ffff', eSize=1.0, pSize=0.5, mCurve=20, mWidth=40, extras=[]):
    emotions[name] = {
        'eShape': eShape, 'mShape': mShape, 'eColor': eColor,
        'eSize': eSize, 'pSize': pSize, 'mCurve': mCurve, 'mWidth': mWidth, 'extras': extras
    }

# Basic (10)
add('happy', mShape='curve', mCurve=25, eColor='#00ffaa')
add('sad', eShape='arch-down', mShape='curve', mCurve=-20, eColor='#4488ff', pSize=0.3, extras=['tears'])
add('angry', eShape='squint', mShape='curve', mCurve=-25, eColor='#ff3300', pSize=0.2)
add('surprised', eShape='circle', mShape='o', mCurve=10, mWidth=15, eColor='#ffff00', eSize=1.3, pSize=0.2)
add('neutral', mShape='line', mCurve=0, eColor='#00ffff')
add('sleepy', eShape='line', mShape='line', mCurve=0, eColor='#5555ff', eSize=0.8, extras=['z'])
add('confused', eShape='asym', mShape='zigzag', mCurve=0, eColor='#cc55ff', extras=['question'])
add('disgusted', eShape='squint', mShape='wavy', mCurve=-10, eColor='#88ff00')
add('scared', eShape='circle', mShape='zigzag', mCurve=-10, eColor='#ffffff', eSize=1.2, pSize=0.1, extras=['sweat'])
add('bored', eShape='half-closed', mShape='line', mCurve=0, eColor='#888888', eSize=0.9, pSize=0.4)

# Positive (15)
add('excited', eShape='star', mShape='open-smile', mCurve=30, mWidth=50, eColor='#ffff00', pSize=0.6, extras=['sparks'])
add('love', eShape='heart', mShape='curve', mCurve=20, eColor='#ff00aa', pSize=0.7, extras=['hearts'])
add('grateful', eShape='arch', mShape='curve', mCurve=15, eColor='#00ffaa', pSize=0.6, extras=['blush'])
add('proud', eShape='arch', mShape='open-smile', mCurve=20, eColor='#ffaa00', pSize=0.5)
add('amused', eShape='arch', mShape='curve', mCurve=25, eColor='#aaff00', pSize=0.5)
add('hopeful', eShape='circle', mShape='curve', mCurve=15, eColor='#00ffff', eSize=1.1, pSize=0.6, extras=['stars'])
add('confident', eShape='squint', mShape='curve', mCurve=15, eColor='#00ffaa')
add('peaceful', eShape='arch', mShape='curve', mCurve=10, eColor='#aaaaff', pSize=0.4)
add('cheerful', eShape='circle', mShape='open-smile', mCurve=25, eColor='#ffff00', pSize=0.5, extras=['blush'])
add('delighted', eShape='arch', mShape='open-smile', mCurve=30, eColor='#ff55aa', pSize=0.6)
add('ecstatic', eShape='star', mShape='open-smile', mCurve=35, eColor='#ffff00', eSize=1.2, pSize=0.7, extras=['sparks'])
add('blissful', eShape='arch', mShape='curve', mCurve=20, eColor='#ffaaff', pSize=0.5, extras=['blush'])
add('content', eShape='half-closed', mShape='curve', mCurve=15, eColor='#00ffff', pSize=0.4)
add('optimistic', eShape='circle', mShape='curve', mCurve=20, eColor='#aaff00', eSize=1.1, pSize=0.6)
add('inspired', eShape='circle', mShape='o', mCurve=10, mWidth=20, eColor='#ffff00', pSize=0.7, extras=['bulb'])

# Negative (15)
add('anxious', eShape='circle', mShape='wavy', mCurve=0, eColor='#ffaa00', eSize=1.1, pSize=0.2, extras=['sweat'])
add('frustrated', eShape='squint', mShape='zigzag', mCurve=-10, eColor='#ff5500', pSize=0.3)
add('disappointed', eShape='half-closed', mShape='curve', mCurve=-15, eColor='#5588ff', pSize=0.3)
add('jealous', eShape='squint', mShape='curve', mCurve=-10, eColor='#00ff00', pSize=0.2)
add('lonely', eShape='circle', mShape='curve', mCurve=-15, eColor='#4444ff', pSize=0.3)
add('guilty', eShape='arch-down', mShape='curve', mCurve=-10, eColor='#ffaa55', pSize=0.4, extras=['sweat'])
add('ashamed', eShape='arch-down', mShape='curve', mCurve=-15, eColor='#ff5555', pSize=0.3, extras=['blush'])
add('heartbroken', eShape='arch-down', mShape='curve', mCurve=-25, eColor='#ff0055', pSize=0.2, extras=['tears'])
add('devastated', eShape='circle', mShape='open-sad', mCurve=-30, eColor='#4444ff', pSize=0.1, extras=['tears'])
add('furious', eShape='x', mShape='zigzag', mCurve=-20, eColor='#ff0000', pSize=0.1, extras=['smoke'])
add('irritated', eShape='squint', mShape='line', mCurve=0, eColor='#ffaa00', pSize=0.2)
add('melancholy', eShape='half-closed', mShape='curve', mCurve=-10, eColor='#6666aa', pSize=0.3)
add('gloomy', eShape='arch-down', mShape='curve', mCurve=-15, eColor='#444488', pSize=0.3)
add('pessimistic', eShape='squint', mShape='curve', mCurve=-10, eColor='#555555', pSize=0.3)
add('bitter', eShape='squint', mShape='curve', mCurve=-15, eColor='#88aa55', pSize=0.2)

# Social (10)
add('shy', eShape='arch', mShape='curve', mCurve=10, eColor='#ffaaff', pSize=0.4, extras=['blush'])
add('embarrassed', eShape='circle', mShape='wavy', mCurve=0, eColor='#ff5555', pSize=0.3, extras=['blush', 'sweat'])
add('flirty', eShape='wink', mShape='curve', mCurve=20, eColor='#ff00aa', pSize=0.5, extras=['hearts'])
add('sarcastic', eShape='half-closed', mShape='asym-smile', mCurve=10, eColor='#00ffff', pSize=0.4)
add('smug', eShape='half-closed', mShape='asym-smile', mCurve=15, eColor='#aaff00', pSize=0.4)
add('apologetic', eShape='arch-down', mShape='wavy', mCurve=-5, eColor='#aaaaaa', pSize=0.4, extras=['sweat'])
add('sympathetic', eShape='arch-down', mShape='curve', mCurve=-5, eColor='#aaaaff', pSize=0.5)
add('curious', eShape='circle', mShape='o', mCurve=5, mWidth=15, eColor='#ffff00', eSize=1.1, pSize=0.5, extras=['question'])
add('suspicious', eShape='squint', mShape='line', mCurve=0, eColor='#ffaa00', pSize=0.2)
add('mischievous', eShape='arch', mShape='zigzag', mCurve=15, eColor='#cc55ff', pSize=0.4)

# Physical (10)
add('tired', eShape='half-closed', mShape='curve', mCurve=-10, eColor='#8888ff', pSize=0.3, extras=['bags'])
add('hungry', eShape='circle', mShape='open-smile', mCurve=10, mWidth=30, eColor='#ffaa00', pSize=0.5, extras=['drool'])
add('sick', eShape='squint', mShape='wavy', mCurve=-10, eColor='#55ff55', pSize=0.2, extras=['sweat'])
add('dizzy', eShape='spiral', mShape='wavy', mCurve=0, eColor='#ffff00', pSize=0.5, extras=['stars'])
add('freezing', eShape='squint', mShape='zigzag', mCurve=0, eColor='#88ffff', pSize=0.2, extras=['ice'])
add('hot', eShape='half-closed', mShape='open-sad', mCurve=-10, eColor='#ff5500', pSize=0.2, extras=['sweat'])
add('energetic', eShape='star', mShape='open-smile', mCurve=25, eColor='#ffff00', eSize=1.2, pSize=0.6, extras=['sparks'])
add('relaxed', eShape='arch', mShape='curve', mCurve=10, eColor='#00ffaa', pSize=0.4)
add('uncomfortable', eShape='circle', mShape='wavy', mCurve=0, eColor='#ffaaaa', pSize=0.2, extras=['sweat'])
add('pain', eShape='x', mShape='zigzag', mCurve=-15, eColor='#ff0000', pSize=0.1, extras=['tears'])

# Cognitive (10)
add('thinking', eShape='asym', mShape='line', mCurve=0, eColor='#ffff00', pSize=0.4, extras=['loading'])
add('focused', eShape='squint', mShape='line', mCurve=0, eColor='#00ffff', pSize=0.2)
add('daydreaming', eShape='arch', mShape='curve', mCurve=15, eColor='#ffaaff', pSize=0.5, extras=['bubbles'])
add('mindblown', eShape='circle', mShape='o', mCurve=20, mWidth=40, eColor='#ff00ff', eSize=1.3, pSize=0.1, extras=['sparks'])
add('eureka', eShape='star', mShape='open-smile', mCurve=25, eColor='#ffff00', eSize=1.2, pSize=0.6, extras=['bulb'])
add('calculating', eShape='spinner', mShape='line', mCurve=0, eColor='#00ff00', pSize=0.5, extras=['numbers'])
add('puzzled', eShape='asym', mShape='wavy', mCurve=0, eColor='#ffaa00', pSize=0.4, extras=['question'])
add('overwhelmed', eShape='spiral', mShape='zigzag', mCurve=-10, eColor='#ff5555', pSize=0.5, extras=['sweat'])
add('determined', eShape='squint', mShape='curve', mCurve=10, eColor='#ffaa00', pSize=0.2, extras=['fire'])
add('contemplating', eShape='half-closed', mShape='asym-smile', mCurve=5, eColor='#aaaaff', pSize=0.3)

# Robot-specific (15)
add('booting', eShape='line', mShape='line', mCurve=0, eColor='#00ff00', eSize=0.5, pSize=0.1, extras=['loading'])
add('charging', eShape='circle', mShape='curve', mCurve=10, eColor='#00ff00', pSize=0.5, extras=['bolt'])
add('low_battery', eShape='half-closed', mShape='curve', mCurve=-10, eColor='#ff0000', eSize=0.8, pSize=0.2, extras=['battery-low'])
add('error', eShape='x', mShape='zigzag', mCurve=-15, eColor='#ff0000', pSize=0.1, extras=['error-glitch'])
add('updating', eShape='spinner', mShape='line', mCurve=0, eColor='#00aaff', pSize=0.5, extras=['loading'])
add('scanning', eShape='line', mShape='line', mCurve=0, eColor='#00ff00', eSize=1.1, pSize=0.8, extras=['scan-line'])
add('processing', eShape='spinner', mShape='line', mCurve=0, eColor='#ffff00', pSize=0.5, extras=['loading'])
add('idle', eShape='circle', mShape='curve', mCurve=5, eColor='#00ffff', pSize=0.5)
add('listening', eShape='circle', mShape='o', mCurve=5, mWidth=10, eColor='#00ffaa', eSize=1.1, pSize=0.5, extras=['waves'])
add('speaking', eShape='circle', mShape='wavy', mCurve=10, eColor='#00ffff', pSize=0.5, extras=['waves'])
add('alert', eShape='circle', mShape='open-sad', mCurve=-10, eColor='#ff0000', eSize=1.2, pSize=0.2, extras=['exclamation'])
add('malfunction', eShape='asym', mShape='zigzag', mCurve=-20, eColor='#ff00ff', pSize=0.2, extras=['sparks', 'error-glitch'])
add('rebooting', eShape='spinner', mShape='line', mCurve=0, eColor='#00ff00', pSize=0.5, extras=['loading'])
add('connected', eShape='circle', mShape='curve', mCurve=20, eColor='#00ff00', pSize=0.6, extras=['wifi'])
add('disconnected', eShape='x', mShape='curve', mCurve=-15, eColor='#ff5555', pSize=0.2, extras=['wifi-off'])

# Situational (15)
add('greeting', eShape='arch', mShape='open-smile', mCurve=25, eColor='#00ffaa', pSize=0.5, extras=['wave'])
add('farewell', eShape='arch-down', mShape='curve', mCurve=-10, eColor='#aaaaff', pSize=0.4, extras=['wave'])
add('celebrating', eShape='star', mShape='open-smile', mCurve=30, eColor='#ffff00', pSize=0.6, extras=['confetti'])
add('dancing', eShape='arch', mShape='curve', mCurve=20, eColor='#ff00ff', pSize=0.5, extras=['music'])
add('laughing', eShape='arch', mShape='open-smile', mCurve=35, eColor='#00ffaa', pSize=0.5, extras=['tears'])
add('crying', eShape='arch-down', mShape='open-sad', mCurve=-25, eColor='#4488ff', pSize=0.2, extras=['tears'])
add('yawning', eShape='half-closed', mShape='o', mCurve=20, mWidth=30, eColor='#8888ff', pSize=0.3, extras=['z'])
add('winking', eShape='wink', mShape='curve', mCurve=20, eColor='#00ffff', pSize=0.5)
add('nodding', eShape='circle', mShape='curve', mCurve=15, eColor='#00ff00', pSize=0.5)
add('shaking_head', eShape='half-closed', mShape='curve', mCurve=-5, eColor='#ffaa00', pSize=0.3)
add('saluting', eShape='squint', mShape='line', mCurve=0, eColor='#00ffff', pSize=0.4)
add('bowing', eShape='arch-down', mShape='curve', mCurve=10, eColor='#00ffaa', pSize=0.3)
add('clapping', eShape='arch', mShape='open-smile', mCurve=25, eColor='#ffff00', pSize=0.5, extras=['sparks'])
add('pointing', eShape='circle', mShape='o', mCurve=10, mWidth=15, eColor='#00ffff', pSize=0.6)
add('shrugging', eShape='asym', mShape='line', mCurve=0, eColor='#aaaaaa', pSize=0.4)

component = """
export const EMOTIONS = """ + json.dumps(emotions, indent=2) + """;

export const EMOTION_LIST = Object.keys(EMOTIONS);

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 255, b: 255 };
};

const lerp = (start, end, amt) => (1 - amt) * start + amt * end;

export default function RobotFace({ emotion = 'happy', size = 300 }) {
  const canvasRef = useRef(null);
  
  const stateRef = useRef({
    currentEmote: EMOTIONS['happy'] || EMOTIONS[Object.keys(EMOTIONS)[0]],
    targetEmote: EMOTIONS['happy'] || EMOTIONS[Object.keys(EMOTIONS)[0]],
    lerpColor: hexToRgb(EMOTIONS['happy']?.eColor || '#00ffff'),
    blinkTimer: 0,
    isBlinking: false,
    time: 0
  });

  useEffect(() => {
    if (EMOTIONS[emotion]) {
      stateRef.current.targetEmote = EMOTIONS[emotion];
    } else {
      stateRef.current.targetEmote = EMOTIONS['neutral'];
    }
  }, [emotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      stateRef.current.time += 0.016; // Approx 60fps
      const state = stateRef.current;
      
      // Lerp properties
      const target = state.targetEmote;
      const current = state.currentEmote;
      
      const lerpSpeed = 0.1;
      current.eSize = lerp(current.eSize, target.eSize, lerpSpeed);
      current.pSize = lerp(current.pSize, target.pSize, lerpSpeed);
      current.mCurve = lerp(current.mCurve, target.mCurve, lerpSpeed);
      current.mWidth = lerp(current.mWidth, target.mWidth, lerpSpeed);
      
      const tColor = hexToRgb(target.eColor);
      state.lerpColor.r = lerp(state.lerpColor.r, tColor.r, lerpSpeed);
      state.lerpColor.g = lerp(state.lerpColor.g, tColor.g, lerpSpeed);
      state.lerpColor.b = lerp(state.lerpColor.b, tColor.b, lerpSpeed);
      
      // Update blink
      if (!state.isBlinking) {
        state.blinkTimer += 1;
        if (state.blinkTimer > 180 + Math.random() * 120) { // Blink every 3-5s
          state.isBlinking = true;
          state.blinkTimer = 0;
        }
      } else {
        state.blinkTimer += 1;
        if (state.blinkTimer > 10) { // Blink duration
          state.isBlinking = false;
          state.blinkTimer = 0;
        }
      }

      // Base dims
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      
      // Clear
      ctx.clearRect(0, 0, width, height);
      
      // Background
      ctx.fillStyle = '#0a0f1e';
      ctx.fillRect(0, 0, width, height);
      
      // Idle animation breathing scale
      const breatheScale = 1.0 + Math.sin(state.time * 2) * 0.02;
      
      // Pupil tracking movement
      const lookX = Math.sin(state.time) * 10;
      const lookY = Math.cos(state.time * 0.8) * 5;
      
      const rgbStr = `rgb(${Math.round(state.lerpColor.r)}, ${Math.round(state.lerpColor.g)}, ${Math.round(state.lerpColor.b)})`;
      
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(breatheScale, breatheScale);
      
      // Draw Eyes
      const eyeSpacing = width * 0.25;
      const eyeY = -height * 0.1;
      const baseEyeRadius = width * 0.12 * current.eSize;
      
      ctx.shadowColor = rgbStr;
      ctx.shadowBlur = 20;
      ctx.strokeStyle = rgbStr;
      ctx.fillStyle = rgbStr;
      ctx.lineWidth = width * 0.02;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const drawEye = (x, y, shape, isRight) => {
        ctx.save();
        ctx.translate(x, y);
        
        let blinkScale = state.isBlinking ? 0.1 : 1.0;
        ctx.scale(1, blinkScale);
        
        const r = baseEyeRadius;
        
        if (shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        } else if (shape === 'arch') {
          ctx.beginPath();
          ctx.arc(0, r/2, r, Math.PI, 0);
          ctx.stroke();
        } else if (shape === 'arch-down') {
          ctx.beginPath();
          ctx.arc(0, -r/2, r, 0, Math.PI);
          ctx.stroke();
        } else if (shape === 'line') {
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.lineTo(r, 0);
          ctx.stroke();
        } else if (shape === 'x') {
          ctx.beginPath();
          ctx.moveTo(-r, -r); ctx.lineTo(r, r);
          ctx.moveTo(r, -r); ctx.lineTo(-r, r);
          ctx.stroke();
        } else if (shape === 'heart') {
          ctx.beginPath();
          ctx.moveTo(0, r*0.5);
          ctx.bezierCurveTo(-r, -r*0.2, -r*0.5, -r, 0, -r*0.5);
          ctx.bezierCurveTo(r*0.5, -r, r, -r*0.2, 0, r*0.5);
          ctx.fill();
        } else if (shape === 'star') {
          ctx.beginPath();
          for(let i=0; i<5; i++){
            ctx.lineTo(Math.cos(i*4*Math.PI/5)*r, Math.sin(i*4*Math.PI/5)*r);
          }
          ctx.closePath();
          ctx.stroke();
        } else if (shape === 'squint') {
          ctx.beginPath();
          ctx.moveTo(-r, isRight ? -r/2 : r/2);
          ctx.lineTo(r, isRight ? r/2 : -r/2);
          ctx.stroke();
        } else if (shape === 'wink') {
          if (isRight) {
             ctx.beginPath();
             ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
             ctx.stroke();
          } else {
             ctx.beginPath();
             ctx.arc(0, 0, r, 0, Math.PI * 2);
             ctx.stroke();
          }
        } else if (shape === 'half-closed') {
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI);
          ctx.closePath();
          ctx.fill();
        } else if (shape === 'asym') {
          if (isRight) {
             ctx.beginPath();
             ctx.arc(0, 0, r, 0, Math.PI * 2);
             ctx.stroke();
          } else {
             ctx.beginPath();
             ctx.moveTo(-r, -r/2); ctx.lineTo(r, r/2);
             ctx.stroke();
          }
        } else if (shape === 'spiral') {
          ctx.beginPath();
          for(let i=0; i<30; i++){
            const angle = 0.5 * i;
            const sx = (1 + angle) * Math.cos(angle + state.time*5) * (r/15);
            const sy = (1 + angle) * Math.sin(angle + state.time*5) * (r/15);
            if(i===0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.stroke();
        } else if (shape === 'spinner') {
          ctx.beginPath();
          ctx.arc(0, 0, r, state.time*5, state.time*5 + Math.PI*1.5);
          ctx.stroke();
        } else {
          // Fallback circle
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // Draw Pupil if applicable
        if (!state.isBlinking && ['circle', 'wink', 'asym'].includes(shape)) {
           // simple condition to avoid drawing pupil if the eye is closed or x
           if (shape !== 'wink' || !isRight) {
               if (shape !== 'asym' || isRight) {
                   ctx.beginPath();
                   ctx.arc(lookX, lookY, r * current.pSize, 0, Math.PI * 2);
                   ctx.fill();
               }
           }
        }
        
        ctx.restore();
      };
      
      const eShape = target.eShape || 'circle';
      drawEye(-eyeSpacing, eyeY, eShape, false);
      drawEye(eyeSpacing, eyeY, eShape, true);
      
      // Draw Mouth
      ctx.shadowBlur = 10;
      const mouthY = height * 0.15;
      const mWidth = (width * 0.01 * current.mWidth);
      const mCurve = (height * 0.005 * current.mCurve);
      
      ctx.save();
      ctx.translate(0, mouthY);
      
      const mShape = target.mShape || 'curve';
      
      ctx.beginPath();
      if (mShape === 'curve') {
        ctx.moveTo(-mWidth, 0);
        ctx.quadraticCurveTo(0, mCurve, mWidth, 0);
        ctx.stroke();
      } else if (mShape === 'line') {
        ctx.moveTo(-mWidth, 0);
        ctx.lineTo(mWidth, 0);
        ctx.stroke();
      } else if (mShape === 'o') {
        ctx.arc(0, mCurve/2, Math.abs(mWidth/2), 0, Math.PI * 2);
        ctx.stroke();
      } else if (mShape === 'open-smile') {
        ctx.moveTo(-mWidth, 0);
        ctx.quadraticCurveTo(0, mCurve*1.5, mWidth, 0);
        ctx.lineTo(-mWidth, 0);
        ctx.fill();
      } else if (mShape === 'open-sad') {
        ctx.moveTo(-mWidth, mCurve*1.5);
        ctx.quadraticCurveTo(0, 0, mWidth, mCurve*1.5);
        ctx.lineTo(-mWidth, mCurve*1.5);
        ctx.fill();
      } else if (mShape === 'wavy') {
        ctx.moveTo(-mWidth, 0);
        ctx.quadraticCurveTo(-mWidth/2, -10, 0, 0);
        ctx.quadraticCurveTo(mWidth/2, 10, mWidth, 0);
        ctx.stroke();
      } else if (mShape === 'zigzag') {
        ctx.moveTo(-mWidth, 0);
        ctx.lineTo(-mWidth/2, -10);
        ctx.lineTo(0, 10);
        ctx.lineTo(mWidth/2, -10);
        ctx.lineTo(mWidth, 0);
        ctx.stroke();
      } else if (mShape === 'asym-smile') {
        ctx.moveTo(-mWidth, 0);
        ctx.quadraticCurveTo(0, mCurve, mWidth, -mCurve);
        ctx.stroke();
      } else {
        ctx.moveTo(-mWidth, 0);
        ctx.quadraticCurveTo(0, mCurve, mWidth, 0);
        ctx.stroke();
      }
      ctx.restore();
      
      // Extras
      const extras = target.extras || [];
      ctx.fillStyle = rgbStr;
      ctx.font = `${width*0.1}px Arial`;
      ctx.textAlign = 'center';
      
      const t = state.time;
      extras.forEach(extra => {
         if (extra === 'tears') {
            const ty = (t * 50) % 50;
            ctx.beginPath();
            ctx.arc(-eyeSpacing, eyeY + baseEyeRadius + ty, 5, 0, Math.PI*2);
            ctx.arc(eyeSpacing, eyeY + baseEyeRadius + ty, 5, 0, Math.PI*2);
            ctx.fill();
         }
         if (extra === 'sweat') {
            ctx.beginPath();
            ctx.arc(eyeSpacing + 30, eyeY - baseEyeRadius + Math.sin(t*2)*5, 8, 0, Math.PI*2);
            ctx.fill();
         }
         if (extra === 'blush') {
            ctx.fillStyle = 'rgba(255, 100, 150, 0.5)';
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(-eyeSpacing*1.2, eyeY + baseEyeRadius*1.5, 20, 0, Math.PI*2);
            ctx.arc(eyeSpacing*1.2, eyeY + baseEyeRadius*1.5, 20, 0, Math.PI*2);
            ctx.fill();
            ctx.fillStyle = rgbStr;
            ctx.shadowBlur = 20;
         }
         if (extra === 'z') {
            ctx.fillText('Z', eyeSpacing + 40 + Math.sin(t)*10, eyeY - 20 - (t*20)%40);
         }
         if (extra === 'hearts') {
            ctx.fillText('❤', -eyeSpacing - 40, eyeY - 20 + Math.sin(t*3)*10);
            ctx.fillText('❤', eyeSpacing + 40, eyeY - 20 + Math.sin(t*3+1)*10);
         }
         if (extra === 'question') {
            ctx.fillText('?', eyeSpacing + 30, eyeY - 30);
         }
         if (extra === 'exclamation') {
            ctx.fillText('!', 0, eyeY - 40);
         }
         if (extra === 'loading') {
            ctx.save();
            ctx.translate(0, -height*0.3);
            ctx.rotate(t * 3);
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI*1.5);
            ctx.stroke();
            ctx.restore();
         }
      });
      
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'block',
        backgroundColor: 'transparent'
      }}
    />
  );
}
"""

with open('/home/swarmy_bot/swarmy_ws/src/swarmy_web_app/src/RobotFace.jsx', 'w') as f:
    f.write(header + component)
