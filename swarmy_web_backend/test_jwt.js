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
const token = jwt.sign({ id: 1, username: 'admin' }, 'swarmy_commercial_super_secret_key_99', { expiresIn: '1h' });
const https = require('http'); // it's on localhost HTTP
const payload = JSON.stringify({
  model: "google/gemma-4-31b-it",
  messages: [{ role: "user", content: "Hello" }]
});
const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token,
    'Content-Length': Buffer.byteLength(payload)
  }
};
const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  res.on('data', (chunk) => console.log(chunk.toString()));
});
req.write(payload);
req.end();
