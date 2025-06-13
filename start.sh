#!/bin/bash

# 启动cron服务
service cron start

# 保持容器运行
tail -f /dev/null
