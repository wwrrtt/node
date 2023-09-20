const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const express = require('express');

async function downloadFile(url, filename) {
    const writer = fs.createWriteStream(filename);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}

async function runCommand(command) {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`执行命令出错: ${error}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
    });
}

async function main() {
    // 下载 cloudflared 文件，并命名为 argo
    await downloadFile('https://github.com/cloudflare/cloudflared/releases/download/2023.8.2/cloudflared-linux-amd64', 'argo');

    // 赋予 argo 可执行权限
    await runCommand('chmod +x argo');

    // 运行 argo
    let token = process.env.TOKEN; // 确保你已经设置了环境变量 TOKEN
    await runCommand(`nohup ./argo tunnel --edge-ip-version auto run --token ${token} >/dev/null 2>&1 &`);

    // 下载 web 文件
    await downloadFile('https://github.com/wwrrtt/node/raw/main/web', 'web');

    // 下载 config.json 文件
    await downloadFile('https://github.com/wwrrtt/node/raw/main/config.json', 'config.json');

    // 运行 web
    await runCommand('nohup ./web run ./config.json >/dev/null 2>&1 &');

    // 启动 Express.js 应用
    const app = express();
    const port = 3000; //你可以根据需要更改端口号

    app.get('/', (req, res) => {
      res.send('Hello World!');
    });

    app.listen(port, () => {
      console.log(`App listening at http://localhost:${port}`);
    });
}

main();
