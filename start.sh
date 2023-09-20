#!/bin/sh

# 启动cf tunnel
nohup ./argo tunnel --edge-ip-version auto run --token 6fe21701-bda8-4373-b130-a908c2de3ebd >/dev/null 2>&1 &
argo_tunnel_pid=$?

# 启动web
nohup ./web run ./config.json >/dev/null 2>&1 &
web_pid=$?

echo "----- 系统进程...----- ."
ps -ef

echo "----- 系统信息...----- ."
cat /proc/version

# 检查argo tunnel是否成功启动
if [ $argo_tunnel_pid -eq 0 ]; then
    echo "argo tunnel 启动成功!"
else
    echo "argo tunnel 启动失败. 错误码: $argo_tunnel_pid"
fi

# 检查web是否成功启动
if [ $web_pid -eq 0 ]; then
    echo "web 启动成功!"
else
    echo "web 启动失败. 错误码: $web_pid"
fi

echo "----- good luck (kid).----- ."
