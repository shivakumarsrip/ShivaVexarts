export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;
  res.end(JSON.stringify({ 
    status: "ok", 
    message: "Native Vercel Function is alive",
    timestamp: new Date().toISOString()
  }));
}
