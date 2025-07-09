const path = require('path'); 
const port = 8080; 
 
const server = http.createServer((req, res) => { 
  let filePath = '.' + req.url; 
  if (filePath === './') filePath = './frontend/pages/public/landing.html'; 
  const extname = path.extname(filePath); 
  let contentType = 'text/html'; 
  if (extname === '.js') contentType = 'text/javascript'; 
  if (extname === '.css') contentType = 'text/css'; 
  if (extname === '.json') contentType = 'application/json'; 
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  fs.readFile(filePath, (err, content) => { 
    if (err) { res.writeHead(404); res.end('File not found'); } 
    else { res.writeHead(200, { 'Content-Type': contentType }); res.end(content); } 
  }); 
}); 
 
server.listen(port, () => console.log('Frontend server running on http://localhost:' + port)); 
const path = require('path'); 
const port = 8080; 
 
const server = http.createServer((req, res) => { 
  let filePath = '.' + req.url; 
  if (filePath === './') filePath = './frontend/pages/public/landing.html'; 
  const extname = path.extname(filePath); 
  let contentType = 'text/html'; 
  if (extname === '.js') contentType = 'text/javascript'; 
  if (extname === '.css') contentType = 'text/css'; 
  if (extname === '.json') contentType = 'application/json'; 
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  fs.readFile(filePath, (err, content) => { 
    if (err) { res.writeHead(404); res.end('File not found'); } 
    else { res.writeHead(200, { 'Content-Type': contentType }); res.end(content); } 
  }); 
}); 
 
server.listen(port, () => console.log('Frontend server running on http://localhost:' + port)); 
