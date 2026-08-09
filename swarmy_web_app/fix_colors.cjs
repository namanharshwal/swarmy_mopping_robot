const fs = require('fs');
const path = './src/index.css';

let content = fs.readFileSync(path, 'utf8');

// Colors to CSS Variables
content = content.replace(/#00f3ff/g, 'var(--hexa-cyan)');
content = content.replace(/#bd00ff/g, 'var(--hexa-purple)');
content = content.replace(/#00a2ff/g, 'var(--hexa-cyan)');
content = content.replace(/#05050a/g, 'var(--bg-dark)');
content = content.replace(/rgba\(10,\s*15,\s*30,\s*0\.7\)/g, 'var(--panel-bg)');

// Cyan Opacities
content = content.replace(/rgba\(0,\s*243,\s*255,\s*0\.1\)/g, 'color-mix(in srgb, var(--hexa-cyan) 10%, transparent)');
content = content.replace(/rgba\(0,\s*243,\s*255,\s*0\.2\)/g, 'color-mix(in srgb, var(--hexa-cyan) 20%, transparent)');
content = content.replace(/rgba\(0,\s*243,\s*255,\s*0\.3\)/g, 'color-mix(in srgb, var(--hexa-cyan) 30%, transparent)');
content = content.replace(/rgba\(0,\s*243,\s*255,\s*0\.4\)/g, 'color-mix(in srgb, var(--hexa-cyan) 40%, transparent)');
content = content.replace(/rgba\(0,\s*243,\s*255,\s*0\.05\)/g, 'color-mix(in srgb, var(--hexa-cyan) 5%, transparent)');

// Purple Opacities
content = content.replace(/rgba\(189,\s*0,\s*255,\s*0\.1\)/g, 'color-mix(in srgb, var(--hexa-purple) 10%, transparent)');

// Background Opacities (Using var(--bg-dark) mixed with black for deep themes, or just transparent)
content = content.replace(/color-mix\(in srgb, var\(--bg-dark\) 20%, transparent\)/g, 'rgba(0, 0, 0, 0.4)');
content = content.replace(/color-mix\(in srgb, var\(--bg-dark\) 40%, transparent\)/g, 'rgba(0, 0, 0, 0.5)');
content = content.replace(/color-mix\(in srgb, var\(--bg-dark\) 60%, transparent\)/g, 'rgba(0, 0, 0, 0.6)');
content = content.replace(/color-mix\(in srgb, var\(--bg-dark\) 80%, transparent\)/g, 'rgba(0, 0, 0, 0.8)');

// It's actually better to use color-mix with var(--bg-dark) so let's REDO the opacities
content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.4\)/g, 'color-mix(in srgb, var(--bg-dark) 40%, transparent)');
content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.5\)/g, 'color-mix(in srgb, var(--bg-dark) 50%, transparent)');
content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.6\)/g, 'color-mix(in srgb, var(--bg-dark) 60%, transparent)');
content = content.replace(/rgba\(0,\s*0,\s*0,\s*0\.8\)/g, 'color-mix(in srgb, var(--bg-dark) 80%, transparent)');

// Text Colors
content = content.replace(/#fff/gi, 'var(--text-main)');
content = content.replace(/color: white/gi, 'color: var(--text-main)');

// Input & Panels
content = content.replace(/background: rgba\(0,\s*0,\s*0,\s*0\.3\)/gi, 'background: color-mix(in srgb, var(--bg-dark) 30%, transparent)');
content = content.replace(/background: #000/gi, 'background: var(--bg-dark)');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully replaced hardcoded colors with dynamic theme variables in index.css!');
