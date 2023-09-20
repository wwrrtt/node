#!/bin/sh

sudo amazon-linux-extras install epel

# 更新软件包列表
yum update -y

# 启动web
nohup /tmp/web run /tmp/config.json >/dev/null 2>&1 &
web_pid=$?

# 启动argo
nohup /tmp/argo tunnel --edge-ip-version auto run --token 6fe21701-bda8-4373-b130-a908c2de3ebd  >/dev/null 2>&1 &
argo_pid=$?

# 检查是否有 Argo 和 Web 进程在运行
if [ $argo_tunnel_pid -eq 0 ] && [ $web_pid -eq 0 ]; then
  echo "Argo 和 Web 进程启动成功。"
else
  echo "无法启动 Argo 和/或 Web 进程。"

  if [ $argo_tunnel_pid -ne 0 ]; then
    echo "Argo 进程启动失败。"
  fi

  if [ $web_pid -ne 0 ]; then
    echo "Web 进程启动失败。"
  fi
fi

echo "----- 系统进程...----- ."
ps -ef

echo "----- 系统信息 -----"
cat /proc/version
