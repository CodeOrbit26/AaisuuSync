import http from 'http';

const req = http.request({
  hostname: 'localhost',
  port: 5173,
  path: '/api/generate-viral-reel',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
});
req.on('error', e => console.error(e));
req.write(JSON.stringify({ apiKey: "AQ.Ab8RN6LVG1UBt0ARe0Iyvm0lwzkj4jFqIc2a8FuVDNZGkEJxOg" }));
req.end();
