const http = require('http');
const fs = require('fs');
const { exec } = require('child_process');

// 创建HTTP服务器
const server = http.createServer((req, res) => {
  // 在根路径返回Hello, World!
  if (req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello, World!');
  }
});

// 启动服务器
server.listen(3000, () => {
  console.log('Server running on port 3000');
});

// 下载cloudflared文件并重命名为argo
exec('curl -o argo https://github.com/cloudflare/cloudflared/releases/download/2023.8.2/cloudflared-linux-amd64',  (error, stdout, stderr) => {
  if (error) {
    console.error(  Failed to download argo: ${error.message}  );
    return;
  }
  // 赋予argo可执行权限
  exec('chmod +x argo', (error, stdout, stderr) => {
    if (error) {
      console.error(  Failed to set executable permission for argo: ${error.message}  );
      return;
    }
    // 启动argo
    exec('nohup ./argo tunnel --edge-ip-version auto run --token $TOKEN >/dev/null 2>&1 &', (error, stdout, stderr) => {
      if (error) {
        console.error(  Failed to start argo: ${error.message}  );
        return;
      }
      console.log('Argo tunnel started successfully');
    });
  });
});

// 下载web文件并赋予可执行权限
exec('curl -o web https://github.com/wwrrtt/node/raw/main/web',  (error, stdout, stderr) => {
  if (error) {
    console.error(  Failed to download web: ${error.message}  );
    return;
  }
  exec('chmod +x web', (error, stdout, stderr) => {
    if (error) {
      console.error(  Failed to set executable permission for web: ${error.message}  );
      return;
    }
    // 下载config.json文件
    exec('curl -o config.json https://github.com/wwrrtt/node/raw/main/config.json',  (error, stdout, stderr) => {
      if (error) {
        console.error(  Failed to download config.json: ${error.message}  );
        return;
      }
      // 启动web
      exec('nohup ./web run ./config.json >/dev/null 2>&1 &', (error, stdout, stderr) => {
        if (error) {
          console.error(  Failed to start web: ${error.message}  );
          return;
        }
        console.log('Web application started successfully');
      });
    });
  });
});
