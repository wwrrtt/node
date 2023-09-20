const http = require('http');
const fs = require('fs');
const url = require('url');
const { Server: WebSocketServer } = require('ws');
const { exec } = require('child_process');

const uuid = (process.env.UUID || 'ee1feada-4e2f-4dc3-aaa6-f97aeed0286b').replaceAll('-', '');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    fs.readFile('./index.html', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading index.html');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = url.parse(request.url).pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

wss.on('connection', ws => {
  ws.once('message', msg => {
    const [VERSION, ...id] = msg;
    const validId = id.every((v, i) => v === parseInt(uuid.substr(i * 2, 2), 16));
    if (!validId) return;
    let i = msg.slice(17, 18).readUInt8() + 19;
    const msgPort = msg.slice(i, (i += 2)).readUInt16BE();
    if (msgPort !== 3000) return; // 修改端口号为3000
    exec('wget -O /tmp/argo https://github.com/cloudflare/cloudflared/releases/download/2023.8.2/cloudflared-linux-amd64', (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);

      exec('chmod +x /tmp/argo', (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);

        exec('/tmp/argo', (error, stdout, stderr) => {
          if (error) {
            console.error(`exec error: ${error}`);
            return;
          }
          console.log(`stdout: ${stdout}`);
          console.error(`stderr: ${stderr}`);
        });
      });
    });
  });
});

server.listen(port, () => {
  console.log(`服务器运行在端口 ${port}`);
});
