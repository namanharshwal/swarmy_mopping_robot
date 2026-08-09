const https = require('https');
const payload = JSON.stringify({
  model: "google/gemma-4-31b-it",
  messages: [{ role: "user", content: "Hello" }],
  stream: true,
  max_tokens: 100
});
const options = {
  hostname: 'integrate.api.nvidia.com',
  port: 443,
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer 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',
    'Accept': 'text/event-stream',
    'Content-Length': Buffer.byteLength(payload)
  }
};
const req = https.request(options, (res) => {
  res.on('data', (chunk) => console.log(chunk.toString()));
});
req.write(payload);
req.end();
