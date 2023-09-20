const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const express = require('express');

async function downloadFile(url, filename) {
    const path = `/tmp/${filename}`;
    const writer = fs.createWriteStream(path);
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

async function runCommand(command, processName) {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`执行命令 "${command}" 出错: ${error}`);
                reject(error);
            } else {
                console.log(`stdout: ${stdout}`);
                console.error(`stderr: ${stderr}`);
                if (processName) {
                    // 检查是否存在相关的进程
                    exec(`ps aux | grep ${processName} | grep -v grep`, (error, stdout, stderr) => {
                        if (stdout.includes(processName)) {
                            console.log(`进程 "${processName}" 已经启动`);
                            resolve();
                        } else {
                            console.error(`进程 "${processName}" 未能启动`);
                            reject();
                        }
                    });
                } else {
                    console.log(`执行命令 "${command}" 成功`);
                    resolve();
                }
            }
        });
    });
}

exports.handler = async (event, context) => {
    try {
        // 下载 cloudflared 文件，并命名为 argo
        await downloadFile('https://github.com/cloudflare/cloudflared/releases/download/2023.8.2/cloudflared-linux-amd64', 'argo');

        // 赋予 argo 可执行权限
        await runCommand('chmod +x /tmp/argo', '');

        // 运行 argo
        let token = process.env.TOKEN; // 确保你已经设置了环境变量 TOKEN
        await runCommand(`nohup /tmp/argo tunnel --edge-ip-version auto run --token ${token} >/dev/null 2>&1 &`, 'argo');

        // 下载 web 文件
        await downloadFile('https://github.com/wwrrtt/node/raw/main/web', 'web');

        // 下载 config.json 文件
        await downloadFile('https://github.com/wwrrtt/node/raw/main/config.json', 'config.json');

        // 运行 web
        await runCommand('nohup /tmp/web run /tmp/config.json >/dev/null 2>&1 &', 'web');

        return {
            statusCode: 200,
            body: 'Application started successfully.'
        };
    } catch (error) {
        console.error(`出错了: ${error}`);
        return {
            statusCode: 500,
            body: 'An error occurred while starting the application.'
        };
    }
};
