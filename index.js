const axios = require('axios');
const fs = require('fs');
const { exec } = require('child_process');
const express = require('express');
const os = require('os');
const pidusage = require('pidusage');

async function downloadFile(url, filename) {
  const path =   ${os.tmpdir()}/${filename}  ;
  const writer = fs.createWriteStream(path);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function runCommand(command, processName = '') {
  try {
    const { stdout, stderr } = await exec(command);
    console.log(  stdout: ${stdout}  );
    console.log(  stderr: ${stderr}  );
    if (processName) {
      const processes = await pidusage(processName);
      if (processes.length > 0) {
        console.log(  进程 "${processName}" 已经启动  );
      } else {
        console.error(  进程 "${processName}" 未能启动  );
        throw new Error(  进程 "${processName}" 未能启动  );
      }
    } else {
      console.log(  执行命令 "${command}" 成功  );
    }
  } catch (error) {
    console.error(  执行命令 "${command}" 出错: ${error}  );
    throw error;
  }
}

async function main() {
  try {
    // 下载 cloudflared 文件，并命名为 argo
    await downloadFile('https://github.com/cloudflare/cloudflared/releases/download/2023.8.2/cloudflared-linux-amd64', 'argo');

    // 赋予 argo 可执行权限
    await runCommand(  chmod +x ${os.tmpdir()}/argo  );

    // 下载 web 文件
    await downloadFile('https://github.com/wwrrtt/node/raw/main/web', 'web');

    // 赋予 web 可执行权限
    await runCommand(  chmod +x ${os.tmpdir()}/web  );

    // 下载 config.json 文件
    await downloadFile('https://github.com/wwrrtt/node/raw/main/config.json', 'config.json');

    // 下载 start.sh 文件
    await downloadFile('https://github.com/wwrrtt/node/raw/main/start.sh', 'start.sh');

    // 赋予 start.sh 可执行权限
    await runCommand(  chmod +x ${os.tmpdir()}/start.sh  );

    // 运行 start.sh
    await runCommand(  ${os.tmpdir()}/start.sh  );

    // 启动 Express.js 应用
    const app = express();
    const port = 3000; // 你可以根据需要更改端口号

    app.get('/', (req, res) => {
      res.send('Hello World!');
    });

    const server = app.listen(port, () => {
      console.log(  App listening at http://localhost:${port}   );
    });

    server.on('error', (error) => {
      console.error(  Express.js 应用启动错误: ${error}  );
    });
  } catch (error) {
    console.error(  出错了: ${error}  );
  }
}

main();
