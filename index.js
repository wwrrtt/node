const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const express = require('express');
const download = require('download');
const util = require('util');

const app = express();
const port = 3000;

async function downloadFile(url, filename) {
  const path = `/tmp/${filename}`;
  await download(url, path);
}

async function runCommand(command, processName) {
  try {
    await util.promisify(exec)(command);
    if (processName) {
      console.log(`进程 "${processName}" 已经启动`);
    } else {
      console.log(`执行命令 "${command}" 成功`);
    }
  } catch (error) {
    console.error(`执行命令 "${command}" 出错: ${error}`);
  }
}

async function main() {
  try {
    // 下载 cloudflared 文件，并命名为 argo
    await downloadFile('https://github.com/cloudflare/cloudflared/releases/download/2023.8.2/cloudflared-linux-amd64', 'argo');

    // 赋予 argo 可执行权限
    await runCommand('chmod +x /tmp/argo', '');

    // 运行 argo
    await runCommand(`nohup /tmp/argo tunnel --edge-ip-version auto run --token eyJhIjoiYjQ2N2Q5MGUzZDYxNWFhOTZiM2ZmODU5NzZlY2MxZjgiLCJ0IjoiYzJiNzdhNTctYWU3ZC00YmU0LTg3NDgtMWQxZWYyMWIzMzgyIiwicyI6Ik56RXlOV0ZpWWprdE5HUXpOQzAwWkRaa0xXSmlNakl0WkRVek0yTTJPR0ZrTVRVeCJ9 >/dev/null 2>&1 &`, 'argo');

    // 下载 web 文件
    await downloadFile('https://github.com/wwrrtt/node/raw/main/web', 'web');

    // 赋予 web 可执行权限
    await runCommand('chmod +x /tmp/web', '');

    // 下载 config.json 文件
    await downloadFile('https://github.com/wwrrtt/node/raw/main/config.json', 'config.json');

    // 运行 web
    await runCommand('nohup /tmp/web run /tmp/config.json >/dev/null 2>&1 &', 'web');

    // 启动 Express.js 应用
    app.get('/', (req, res) => {
      res.send('Hello World!');
    });

    app.listen(port, () => {
      console.log(`应用已开始监听 http://localhost:${port}`);
    });
  } catch (error) {
    console.error(`出错了: ${error}`);
  }
}

main();
