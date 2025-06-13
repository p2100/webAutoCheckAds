# 使用包含Python 3.8的Node.js镜像作为基础镜像
FROM node:18-slim

# 设置工作目录
WORKDIR /app

# 更新包列表并安装必要的工具
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    python3.8 \
    python3.8-dev \
    python3-pip \
    cron \
    && rm -rf /var/lib/apt/lists/*

# 添加Google Chrome的官方APT仓库
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list'

# 更新包列表并安装Chrome和所有必要的依赖
RUN apt-get update && apt-get install -y \
    google-chrome-stable \
    fonts-liberation \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 创建非root用户来运行应用（安全最佳实践）
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser \
    && chown -R pptruser:pptruser /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装Node.js依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 更改文件所有权
RUN chown -R pptruser:pptruser /app

# 切换到非root用户
USER pptruser

# 设置环境变量
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PYTHON=/usr/bin/python3.8
ENV PATH="/usr/local/bin:${PATH}"

# 创建启动脚本
RUN echo '#!/bin/bash\nservice cron start\ntail -f /dev/null' > /app/start.sh && \
    chmod +x /app/start.sh

# 暴露端口（如果你的应用需要）
# EXPOSE 3000

# 启动命令
CMD ["/app/start.sh"]