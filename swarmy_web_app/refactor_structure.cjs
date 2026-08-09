const fs = require('fs');
const path = './src/index.css';

let content = fs.readFileSync(path, 'utf8');

// 1. Remove the @import url for fonts from index.css since it's now in themes.css
content = content.replace(/@import url\('https:\/\/fonts\.googleapis\.com[^']+'\);\n/g, '');

// 2. Body background and fonts
content = content.replace(/font-family:\s*'Rajdhani',\s*sans-serif;/g, 'font-family: var(--font-main);');
content = content.replace(/font-family:\s*'Share Tech Mono',\s*monospace;/g, 'font-family: var(--font-mono);');

// The hexagon pattern is complex, let's just replace the whole body background-image block
content = content.replace(/\/\* Hexagon Pattern Background \*\/[\s\S]*?overflow:\s*hidden;/g, 'background: var(--theme-bg);\n  overflow: hidden;');

// 3. Border Radius
content = content.replace(/border-radius:\s*[0-9]+px;/g, 'border-radius: var(--theme-radius);');

// 4. Clip Path
content = content.replace(/clip-path:\s*polygon[^;]+;/g, 'clip-path: var(--theme-btn-clip);');

// 5. Box Shadow & Glows
// We'll replace the main auth-box and button shadows
content = content.replace(/box-shadow:\s*0\s*0\s*20px\s*color-mix\(in\s*srgb,\s*var\(--hexa-cyan\)\s*20%,\s*transparent\),\s*inset\s*0\s*0\s*20px\s*color-mix\(in\s*srgb,\s*var\(--hexa-cyan\)\s*10%,\s*transparent\);/g, 'box-shadow: var(--theme-shadow-glow);');
content = content.replace(/box-shadow:\s*0\s*0\s*20px\s*var\(--hexa-cyan\);/g, 'box-shadow: var(--theme-shadow-glow);');
content = content.replace(/box-shadow:\s*0\s*0\s*10px\s*color-mix\(in\s*srgb,\s*var\(--hexa-cyan\)\s*30%,\s*transparent\);/g, 'box-shadow: var(--theme-shadow-glow);');

// 6. Backdrop Blur
content = content.replace(/backdrop-filter:\s*blur\([0-9]+px\);/g, 'backdrop-filter: var(--theme-blur);');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully refactored structural CSS to use dynamic variables!');
