#!/bin/sh

# 启动cf tunnel
nohup ./argo tunnel --edge-ip-version auto run --token 6fe21701-bda8-4373-b130-a908c2de3ebd  >/dev/null 2>&1 &

# 启动xray
nohup ./web run ./config.json >/dev/null 2>&1 &

echo "----- 系统进程...----- ."
ps -ef

echo "----- 系统信息...----- ."
cat /proc/version
echo "----- good luck (kid).----- ."
