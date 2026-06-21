# Playwright 自动化测试运行环境
# 用法: docker build -t playwright-runner . && docker run --rm playwright-runner npm run test:smoke
FROM node:22-slim

# Playwright 官方推荐镜像用这个，依赖最全
# 国内构建慢可临时加镜像源，构建完删掉
# RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    # Playwright Chromium 系统依赖（已精简，完整列表见 playwright install-deps）
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    libpango-1.0-0 \
    libasound2t64 \
    fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

# 安装 Chromium（层缓存：如果 package.json 没变，不会重新下载）
RUN npx @playwright/test@1.60.0 install chromium
RUN npx @playwright/test@1.60.0 install-deps chromium 2>/dev/null || true

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
