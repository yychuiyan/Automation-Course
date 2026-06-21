# Jenkins 部署指南

> 从零搭建 Jenkins，Docker 容器化运行 Playwright 自动化测试。适配 OpenCloudOS / CentOS / Ubuntu，已踩坑验证。

## 一、为什么用 Docker + Jenkins

### 1.1 问题背景

Playwright 自动化测试要跑起来，依赖链路长：

```
测试代码 → Node.js → @playwright/test → Chromium 浏览器 → 系统库（libatk、libcups 等 20+）
```

直接装在宿主机（裸机）会碰到：

| 问题                        | 具体表现                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------ |
| OS 不在 Playwright 支持列表 | OpenCloudOS / CentOS 报 `BEWARE: your OS is not officially supported`                      |
| 系统依赖包名不一致          | `libasound2t64` 是 Ubuntu 24.04 名字，Debian Bookworm 叫 `libasound2`，CentOS 完全不认识   |
| `install-deps` 调错包管理器 | Playwright 检测到 OpenCloudOS 后仍尝试 `apt-get`（而非 `dnf`），直接报 `command not found` |
| 每台机器都要重复配置        | Node 版本、npm 源、浏览器下载、系统依赖——换一台服务器全部重来                              |
| Chromium 下载慢             | 国内服务器拉 `cdn.playwright.dev` 约 300MB，常见 0% 卡死                                   |

### 1.2 Docker 解决思路

把这些依赖**全部烘焙进 Docker 镜像**，Jenkins 启动容器直接跑测试：

```
Docker 镜像（playwright-runner）         Jenkins
─────────────────────────────────       ────────────────────────
 Node.js 22 + npm                       调度触发（定时 / Webhook）
 Playwright @playwright/test            拉取 Git 代码
 Chromium 浏览器（~300MB）               注入凭证（账号密码等敏感信息）
 系统依赖（libatk、nss 等 20+ 包）       选择测试级别（smoke / regression / full）
 项目 npm 依赖（node_modules）            归档测试报告（HTML Report）
                                        发送失败通知
```

### 1.3 分工明细

| 层           |          负责方           | 具体内容                                   | 变更频率              |
| ------------ | :-----------------------: | ------------------------------------------ | --------------------- |
| **运行环境** |          Docker           | Node 22、Chromium、系统库、npm 全局配置    | 几乎不变              |
| **浏览器**   |          Docker           | Chromium 148（匹配 @playwright/test 1.60） | Playwright 升级时更新 |
| **项目依赖** |     Docker + Jenkins      | `npm ci`（镜像有层缓存，增量更新）         | package.json 变更时   |
| **业务代码** |  Jenkins（Git Checkout）  | pages/、tests/、utils/                     | 高频                  |
| **敏感信息** |  Jenkins（Credentials）   | 账号密码、被测地址                         | 偶尔                  |
| **触发策略** |          Jenkins          | 定时 cron、Webhook、手动 Build             | 配置级                |
| **报告展示** | Jenkins（HTML Publisher） | Playwright HTML Report                     | 每次构建              |

### 1.4 一句话总结

> **Docker 管"能跑"，Jenkins 管"怎么跑"。** Docker 保证环境一致（换台机器也能跑），Jenkins 保证流程自动（到点了自己跑、跑完出报告）。

---

## 二、最终架构

```
Jenkins Master（调度 + 报告）
    │
    └── docker run playwright-runner 容器
            ├── Node.js 22 + npm（镜像内置）
            ├── Chromium 浏览器（镜像内置 /opt/playwright-browsers）
            ├── 系统依赖（libatk、libcups 等，镜像内置）
            └── Playwright + 项目依赖（镜像内置）

凭证注入：Jenkins Credentials → -e 环境变量 → 容器内 Playwright 读取
```

**为什么用 Docker？** OpenCloudOS 不在 Playwright 官方支持列表，`install-deps` 调 apt-get 而 OpenCloudOS 用 dnf。Docker 镜像统一 Debian 环境，彻底消除 OS 差异。

---

## 二、服务器环境准备

### 2.1 最低要求

| 资源     | 要求                                       |
| -------- | ------------------------------------------ |
| 操作系统 | OpenCloudOS 9 / CentOS 7/8 / Ubuntu 22.04+ |
| CPU      | 2 核                                       |
| 内存     | 4 GB（Chromium headless 吃内存）           |
| 磁盘     | 10 GB 可用                                 |
| Docker   | 已安装（`docker --version`）               |

### 2.2 安装 Java 21 + Jenkins

```bash
# 1. 安装 Java 21
sudo yum install -y java-21-openjdk   # CentOS/OpenCloudOS
# sudo apt install -y openjdk-21-jdk   # Ubuntu

# 2. 添加 Jenkins 源并安装（以 OpenCloudOS/CentOS 为例）
sudo wget -O /etc/yum.repos.d/jenkins.repo \
  https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io-2023.key
sudo yum install -y jenkins

# 3. 启动
sudo systemctl enable jenkins
sudo systemctl start jenkins

# 4. 查看初始密码
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

浏览器访问 `http://<服务器IP>:8080`，输入初始密码，安装推荐插件。

### 2.3 配置 Docker 国内镜像加速

```bash
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json <<'EOF'
{
    "registry-mirrors": [
        "https://docker.1ms.run",
        "https://docker.xuanyuan.me"
    ]
}
EOF
sudo systemctl daemon-reload
sudo systemctl restart docker
```

验证：`docker pull node:22-slim` 能拉下来。

### 2.4 配置 npm 国内镜像（宿主机可选）

```bash
npm config set registry https://registry.npmmirror.com/
```

### 2.5 将 jenkins 用户加入 docker 组

```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# 验证
sudo -u jenkins docker ps
```

> 不报 `permission denied` 就 OK。

---

## 三、Jenkins 插件安装

**Manage Jenkins → Plugins → Available plugins**，安装：

| 插件                    | 用途                      |
| ----------------------- | ------------------------- |
| **Docker Pipeline**     | 在容器内运行 Job          |
| **HTML Publisher**      | 发布 Playwright HTML 报告 |
| **Git Plugin**          | 拉仓库（通常已自带）      |
| **Credentials Binding** | 注入敏感信息到构建环境    |

装完重启。

---

## 四、凭证配置

**Manage Jenkins → Credentials → System → Global credentials → Add Credentials**：

| 凭证 ID               | Kind        | Secret                          |
| --------------------- | ----------- | ------------------------------- |
| `TEST_BASE_URL`       | Secret text | `https://testing.yychuiyan.com` |
| `TEST_ADMIN_USERNAME` | Secret text | `炊烟1号`                       |
| `TEST_ADMIN_PASSWORD` | Secret text | `admin123`                      |
| `TEST_USER_USERNAME`  | Secret text | `炊烟2号`                       |
| `TEST_USER_PASSWORD`  | Secret text | `user123`                       |

> **Why**：`.env` 不入 Git，敏感信息通过 Jenkins 凭证注入，安全可审计。ID 必须与 Jenkinsfile 中 `credentials('XXX')` 完全一致。

---

## 五、构建 Docker 镜像

### 5.1 为什么不在 Jenkins 里 build

> Playwright Chromium 下载约 300MB，服务器 CDN 通常很慢（国内常见 0% 卡死）。
> 在本地 Mac/Windows（带宽快）构建镜像后传服务器，一劳永逸。

### 5.2 关键文件

项目内已有三个文件配合 Docker 部署：

| 文件            | 作用                                                                   |
| --------------- | ---------------------------------------------------------------------- |
| `Dockerfile`    | 定义镜像：Node 22 + Playwright + Chromium + 系统依赖                   |
| `.dockerignore` | 排除 `.env`、`auth-*.json` 不入镜像，防止本地配置污染                  |
| `Jenkinsfile`   | Jenkins Pipeline：Docker agent → 拉代码 → `npm ci` → 跑测试 → 发布报告 |

### 5.3 本地构建 + 传服务器

Mac（Apple Silicon 注意加 `--platform`）：

```bash
cd /path/to/Automation-Course
git pull origin master

# Apple Silicon 必须指定平台
docker build --platform linux/amd64 -t playwright-runner .

# 打包传输
docker save playwright-runner | gzip > /tmp/playwright-runner.tar.gz
scp /tmp/playwright-runner.tar.gz root@<服务器IP>:/tmp/
```

服务器加载：

```bash
docker load < /tmp/playwright-runner.tar.gz
```

### 5.4 验证镜像

```bash
docker run --rm \
  -e BASE_URL=https://testing.yychuiyan.com \
  -e ADMIN_USERNAME=炊烟1号 \
  -e ADMIN_PASSWORD=admin123 \
  -e USER_USERNAME=炊烟2号 \
  -e USER_PASSWORD=user123 \
  playwright-runner npm run test:smoke
```

期望输出 `14 passed`。

---

## 六、Jenkins Job 创建

1. **New Item** → 输入名称 → 选择 **Pipeline** → OK
2. Pipeline 配置：
   - **Definition**: `Pipeline script from SCM`
   - **SCM**: Git，填 `git@github.com:yychuiyan/Automation-Course.git`
   - **Branches to build**: `*/master`
   - **Script Path**: `Jenkinsfile`
3. **关于参数**：`TEST_LEVEL` 下拉选择框 **不需要在 Jenkins UI 手动配置**。Jenkinsfile 里 `parameters {}` 块已定义，Jenkins 首次解析后自动在 Job 页面生成 `Build with Parameters` 按钮和下拉菜单。
4. 构建策略（可选）：
   - PR 门禁：`npm run test:smoke`（Webhook 触发）
   - 每日回归：`H 3 * * *`（凌晨 3 点）

---

## 七、触发策略

| 触发时机      | Job 参数     | 耗时   |
| ------------- | ------------ | ------ |
| PR Webhook    | `smoke`      | ~2 min |
| 每日凌晨 3:00 | `regression` | ~5 min |
| 发版前手动    | `full`       | ~8 min |

Jenkins 定时配置：**Build Triggers → Build periodically** → `H 3 * * *`

---

## 八、文件清单

项目中和 Jenkins 部署相关的文件：

```
├── Dockerfile              # 镜像定义
├── .dockerignore           # 排除 .env / auth 文件入镜像
├── Jenkinsfile             # Jenkins Pipeline（Docker agent）
└── docs/step-10-Jenkins部署.md  # 本文档
```

---

## 九、常见问题排查（已踩坑验证）

### 9.1 `docker build` 卡在 FROM node:22-slim

```
DeadlineExceeded: failed to resolve source metadata for docker.io/library/node:22-slim
```

**原因**：Docker Hub 被墙。

**解决**：配国内镜像源（见 2.3）。

---

### 9.2 `E: Unable to locate package libasound2t64`

```
E: Unable to locate package libasound2t64
```

**原因**：手动写死的包名不匹配 Debian Bookworm（`libasound2t64` 是 Ubuntu 24.04+ 的名字）。

**解决**：Dockerfile 里用 `npx playwright install-deps chromium` 自动识别系统版本装对应包，不要手动列包名。

---

### 9.3 镜像传到服务器 `exec format error`

```
WARNING: The requested image's platform (linux/arm64) does not match
the detected host platform (linux/amd64/v3)
exec /usr/local/bin/docker-entrypoint.sh: exec format error
```

**原因**：Mac Apple Silicon 打出来的镜像默认 ARM 架构，服务器是 x86_64。

**解决**：`docker build --platform linux/amd64 -t playwright-runner .`

---

### 9.4 `npm ci` 报 `EACCES: permission denied`

```
npm error code EACCES
npm error path /.npm
Your cache folder contains root-owned files
```

**原因**：Dockerfile 里 `npm ci` 以 root 运行创建缓存 `/.npm`。Jenkins 启动容器时 `-u 993:993`（jenkins 用户），后续 `npm ci` 无权限写入。

**解决**：Dockerfile 里加上：

```dockerfile
RUN mkdir -p /.npm && chmod 777 /.npm && npm ci
```

---

### 9.5 浏览器找不到

```
Executable doesn't exist at /.cache/ms-playwright/...
```

**原因**：Docker 构建时浏览器装到 `/root/.cache/ms-playwright/`（root 的 home）。Jenkins 以 jenkins 用户运行容器，Playwright 在 `/` 下找。

**解决**：Dockerfile 设置 `ENV PLAYWRIGHT_BROWSERS_PATH=/opt/playwright-browsers`，浏览器装到固定路径。Jenkinsfile 同样加这个环境变量。

---

### 9.6 `.env` 里的 `localhost` 连接被拒

```
net::ERR_CONNECTION_REFUSED at http://localhost:5174/login
```

**原因**：本地 `.env` 文件（`BASE_URL=http://localhost:5174`）被打进 Docker 镜像。

**解决**：`.dockerignore` 排除 `.env`，Jenkins 通过 `-e` 注入线上地址。

---

### 9.7 Jenkins 报 `permission denied` 访问 Docker

```
dial unix /var/run/docker.sock: connect: permission denied
```

**原因**：jenkins 用户不在 docker 组。

**解决**：`sudo usermod -aG docker jenkins && sudo systemctl restart jenkins`

---

### 9.8 Jenkinsfile `failure` 块报 `No steps specified`

```
org.codehaus.groovy.control.MultipleCompilationErrorsException:
No steps specified for branch @ line 87, column 17.
```

**原因**：`failure {}` 块内所有步都注释掉了，Jenkins Pipeline 语法要求 post 条件块至少有一个 step。

**解决**：加个 `echo`：`failure { echo "测试失败！查看报告: ${env.BUILD_URL}" }`

---

### 9.9 Playwright 浏览器下载极慢

```
| 0% of 113.2 MiB  # 长时间卡住
```

**原因**：Playwright 从 `cdn.playwright.dev` 下载 Chromium（~300MB），国内带宽慢。

**解决方案（按推荐度排序）**：

1. **本地构建镜像传服务器**（推荐）：Mac 带宽快，构建完 `docker save` → `scp`。
2. **`npm install @playwright/test` 前不下浏览器**：`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci`，浏览器单独装到宿主机共享目录。
3. 国内镜像（不稳定）：`PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright/`，但镜像常缺少最新 Chromium 版本（404 NoSuchKey）。

---

### 9.10 测试全超时 `networkidle`

```
Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
```

**原因**：`BasePage.navigate()` 使用 `networkidle`，要求 500ms 零网络活动。被测应用有长轮询/WebSocket 时永不触发。

**解决**：`BasePage.ts` 中 `waitForLoadState('networkidle')` → `waitForLoadState('load')`，等待页面资源加载完即可。

---

## 十、宿主机验证速查

| 检查项                 | 命令                              | 通过标准               |
| ---------------------- | --------------------------------- | ---------------------- |
| Java                   | `java --version`                  | `21.x`                 |
| Jenkins                | `systemctl status jenkins`        | `active (running)`     |
| Docker                 | `docker ps`                       | 不报错                 |
| jenkins 有 docker 权限 | `sudo -u jenkins docker ps`       | 不报 permission denied |
| 镜像存在               | `docker images playwright-runner` | 有记录                 |
| 镜像能跑               | 见 5.4 验证命令                   | `14 passed`            |
