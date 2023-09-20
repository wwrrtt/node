const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const express = require('express');
const download = require('download');
const util = require('util');

const app = express();
const port = 3000;

// 下载文件
async function downloadFile(url, filename) {
  const path = `/tmp/${filename}`;
  await download(url).then(data => {
    fs.writeFileSync(path, data);
  });
}

// 运行命令
async function runCommand(command, processName) {
  try {
    await util.promisify(exec)(command);
    console.log(`执行命令 "${command}" 成功`);
    if (processName) {
      console.log(`进程 "${processName}" 已经启动`);
    }
  } catch (error) {
    console.error(`执行命令 "${command}" 出错: ${error}`);
  }
}

// 下载 cloudflared 文件，并命名为 cloudflared-linux-amd64
const cloudflaredUrl = 'https://github.com/cloudflare/cloudflared/releases/download/2023.8.2/cloudflared-linux-amd64';
const cloudflaredPath = '/tmp/cloudflared-linux-amd64';
await downloadFile(cloudflaredUrl, 'cloudflared-linux-amd64');
if (!fs.existsSync(cloudflaredPath)) {
  console.error('cloudflared-linux-amd64 文件下载失败');
  return;
}
await runCommand(`chmod +x ${cloudflaredPath}`);
await runCommand(`${cloudflaredPath} tunnel --edge-ip-version auto run --token eyJhIjoiYjQ2N2Q5MGUzZDYxNWFhOTZiM2ZmODU5NzZlY2MxZjgiLCJ0IjoiNDE3OGQ2N2MtZTg5My00ZjliLWFhODItZjllODFmNTI4NTA1IiwicyI6Ik0ySmxPR1F4TnpFdFlXTmpZUzAwTlRNeExUZzRPVEF0Wldaa05UUmhOVFptTlRFdyJ9`);

// 下载 web 文件
const webUrl = 'https://github.com/wwrrtt/node/raw/main/web';
const webPath = '/tmp/web';
await downloadFile(webUrl, 'web');
if (!fs.existsSync(webPath)) {
  console.error('web 文件下载失败');
  return;
}
await runCommand(`chmod +x ${webPath}`);
await runCommand(`/tmp/web run /tmp/config.json`);

// 下载 config.json 文件
const configUrl = 'https://github.com/wwrrtt/node/raw/main/config.json';
await downloadFile(configUrl, 'config.json');

// 启动 Express.js 应用
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`应用已开始监听 0.0.0.0:${port}`);
});
