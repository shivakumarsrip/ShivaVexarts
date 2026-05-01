export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ 
    status: "ok", 
    type: "standalone-health",
    timestamp: new Date().toISOString()
  }));
}
