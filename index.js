const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const express = require('express');

async function downloadFile(url, filename) {
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer'
    });
    fs.writeFileSync(`/tmp/${filename}`, response.data);
}

async function runCommand(command) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`执行命令 "${command}" 出错: ${error}`);
                reject(error);
            } else {
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
                resolve();
            }
        });
    });
}

async function main() {
    try {
        // 下载 cloudflared 文件，并命名为 argo
        await downloadFile('https://github.com/cloudflare/cloudflared/releases/download/2023.8.2/cloudflared-linux-amd64', 'argo');

        // 运行 argo
        await runCommand('chmod +x /tmp/argo && /tmp/argo tunnel --edge-ip-version auto run --token $TOKEN &');

        // 下载 web 文件
        await downloadFile('https://github.com/wwrrtt/node/raw/main/web', 'web');

        // 下载 config.json 文件
        await downloadFile('https://github.com/wwrrtt/node/raw/main/config.json', 'config.json');

        // 运行 web
        await runCommand('chmod +x /tmp/web && /tmp/web run /tmp/config.json &');

        // 启动 Express.js 应用
        const app = express();
        const port = process.env.PORT || 3000;

        app.get('/', (req, res) => {
          res.send('Hello World!');
        });

        app.listen(port, () => {
          console.log(`App listening at http://localhost:${port}`);
        });
    } catch (error) {
        console.error(`出错了: ${error}`);
    }
}

exports.handler = async (event, context) => {
    await main();
};
