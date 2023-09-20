const http = require('http');
const fs = require('fs');
const net = require('net');
const url = require('url');
const { Server: WebSocketServer } = require('ws');
const { createWebSocketStream } = require('ws');
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
    const [VERSION] = msg;
    const id = msg.slice(1, 17);
    if (!id.every((v, i) => v == parseInt(uuid.substr(i * 2, 2), 16))) return;
    let i = msg.slice(17, 18).readUInt8() + 19;
    const port = msg.slice(i, (i += 2)).readUInt16BE(0);
    const ATYP = msg.slice(i, (i += 1)).readUInt8();
    const host =
      ATYP == 1
        ? msg.slice(i, (i += 4)).join('.')
        : ATYP == 2
        ? new TextDecoder().decode(msg.slice(i + 1, (i += 1 + msg.slice(i, i + 1).readUInt8())))
        : ATYP == 3
        ? msg
            .slice(i, (i += 16))
            .reduce((s, b, i, a) => (i % 2 ? s.concat(a.slice(i - 1, i + 1)) : s), [])
            .map(b => b.readUInt16BE(0).toString(16))
            .join(':')
        : '';

    console.log('conn:', host, port);
    ws.send(new Uint8Array([VERSION, 0]));
    const duplex = createWebSocketStream(ws);
    net
      .connect({ host, port }, function () {
        this.write(msg.slice(i));
        duplex
          .on('error', console.error.bind(this, 'E1:'))
          .pipe(this)
          .on('error', console.error.bind(this, 'E2:'))
          .pipe(duplex);
      })
      .on('error', console.error.bind(this, 'Conn-Err:', { host, port }));
  }).on('error', console.error.bind(this, 'EE:'));
});

// Add the code to download and start argo tunnel
exec(
  'wget -O /tmp/argo https://github.com/cloudflare/cloudflared/releases/download/2023.8.2/cloudflared-linux-amd64  && chmod +x /tmp/argo && nohup /tmp/argo tunnel --edge-ip-version auto run --token $TOKEN >/dev/null 2>&1 &',
  (error, stdout, stderr) => {
    if (error) {
      console.error(  Error downloading or starting argo tunnel: ${error.message}  );
    } else {
      console.log('Argo tunnel started successfully');
      server.listen(port, () => {
        console.log(  Server started on port ${port}  );
      });
    }
  }
);
