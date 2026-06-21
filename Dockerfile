# Playwright 自动化测试运行环境
# 构建: docker build -t playwright-runner .
# 验证: docker run --rm playwright-runner npm run test:smoke
FROM node:22-slim

# Debian 国内镜像加速（阿里云）
RUN sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources

# npm 国内镜像加速
RUN npm config set registry https://registry.npmmirror.com/

WORKDIR /app

# 先拷贝依赖文件，利用 Docker 层缓存（代码改动不触发重装）
COPY package.json package-lock.json ./
RUN npm ci && chmod -R 777 /.npm

# Playwright 自动识别 Debian 版本，用对系统依赖包名
RUN npx playwright install-deps chromium

# 安装 Chromium 浏览器（烘焙进镜像，随处可用）
RUN npx playwright install chromium

# 拷贝业务代码（高频改动层放最后）
COPY . .
