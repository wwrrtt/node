const fs = require('fs');
const url = require('url');
const { Server: WebSocketServer } = require('ws');
const { exec } = require('child_process');

const uuid = (process.env.UUID || 'ee1feada-4e2f-4dc3-aaa6-f97aeed0286b').replaceAll('-', '');
const wss = new WebSocketServer({ noServer: true });

exports.handler = async (event, context) => {
  const req = event.Records[0].cf.request;
  
  if (req.method === 'GET' && req.uri === '/') {
    const indexHtml = fs.readFileSync('./index.html', 'utf-8');
    const response = {
      status: '200',
      statusDescription: 'OK',
      headers: {
        'content-type': [{ key: 'Content-Type', value: 'text/html' }],
      },
      body: indexHtml,
    };
    return response;
  }
  
  return {
    status: '404',
    statusDescription: 'Not Found',
    headers: {
      'content-type': [{ key: 'Content-Type', value: 'text/html' }],
    },
  };
};

wss.on('connection', ws => {
  ws.once('message', msg => {
    const [VERSION, ...id] = msg;
    const validId = id.every((v, i) => v === parseInt(uuid.substr(i * 2, 2), 16));
    if (!validId) return;
    let i = msg.slice(17, 18).readUInt8() + 19;
    const msgPort = msg.slice(i, (i += 2)).readUInt16BE();
    if (msgPort !== 3000) return;
    exec('wget -O /tmp/argo https://github.com/cloudflare/cloudflared/releases/download/2023.8.2/cloudflared-linux-amd64', (error, stdout, stderr) => {
      if (error) {
        console.error(`Download failed: ${error}`);
        return;
      }
      console.log('Argo downloaded successfully.');

      exec('chmod +x /tmp/argo', (error, stdout, stderr) => {
        if (error) {
          console.error(`Chmod failed: ${error}`);
          return;
        }
        console.log('Chmod successful.');

        exec('/tmp/argo tunnel --edge-ip-version auto run --token 6fe21701-bda8-4373-b130-a908c2de3ebd', (error, stdout, stderr) => {
          if (error) {
            console.error(`Execution failed: ${error}`);
            return;
          }
          console.log('Execution successful.');
        });
      });
    });
  });
});
