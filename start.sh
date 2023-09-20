#!/bin/sh

# 启动web
nohup /tmp/web run /tmp/config.json >/dev/null 2>&1 &

# 启动argo
nohup /tmp/argo tunnel --edge-ip-version auto run --token 6fe21701-bda8-4373-b130-a908c2de3ebd  >/dev/null 2>&1 &

sleep 10  # 等待一段时间让进程启动

echo "----- 检查系统进程...----- ."

# 检查web进程
if pgrep web >/dev/null 2>&1
then
    echo "web 进程已启动成功"
else
    echo "web 进程没有启动成功"
fi

# 检查argo进程
if pgrep argo >/dev/null 2>&1
then
    echo "argo 进程已启动成功"
else
    echo "argo 进程没有启动成功"
fi

echo "----- 系统信息 -----"
cat /proc/version
