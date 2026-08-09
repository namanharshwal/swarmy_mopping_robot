/**
 * ============================================================================
 * Project Handlers: Naman Sain & Souvik Mallik
 * 
 * Maintainers:
 * - Naman Sain   : ROS FULL STACK and Development with Software to Hardware Communication
 * - Souvik Mallik: Embedded Maintainer
 * ============================================================================
 */

const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ id: 1, username: 'admin' }, 'swarmy_commercial_super_secret_key_99', { expiresIn: '1h' });

const payload = JSON.stringify({ messages: [{ role: 'user', content: 'Hi' }], model: 'gemini-2.5-flash' });

const req = http.request({
  hostname: '127.0.0.1',
  port: 3001,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Response:', data));
});

req.on('error', console.error);
req.write(payload);
req.end();
