# Jenkins 部署指南

> 从零搭建 Jenkins，运行 Playwright 自动化测试项目。

## 一、整体架构

```
Jenkins Master（调度 + 报告）
    │
    └── Jenkins Agent / 本机执行器（运行 Playwright 测试）
            │
            ├── Node.js 22 LTS
            ├── Playwright + Chromium
            └── 系统依赖（libatk、libcups 等）
```

Jenkins Master 负责拉代码、调度任务、展示报告；实际测试在 Agent 节点上跑（也可以是 Master 本机）。

---

## 二、服务器环境准备

### 2.1 操作系统选择

| 系统                     | 推荐场景                          |
| ------------------------ | --------------------------------- |
| Ubuntu 22.04 / 24.04 LTS | 生产环境首选，Playwright 支持最好 |
| CentOS 7/8 / Rocky 9     | 公司指定时使用                    |
| macOS                    | 本地调试 / 小团队                 |

以下以 **Ubuntu 24.04** 为例，其他系统思路一致。

### 2.2 安装 Jenkins

```bash
# 1. 安装 Java 21（Jenkins 要求）
sudo apt update
sudo apt install -y openjdk-21-jdk

# 2. 添加 Jenkins 官方源
sudo wget -O /usr/share/keyrings/jenkins-keyring.asc \
  https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] \
  https://pkg.jenkins.io/debian-stable binary/" | \
  sudo tee /etc/apt/sources.list.d/jenkins.list

# 3. 安装 Jenkins
sudo apt update
sudo apt install -y jenkins

# 4. 启动并设为开机自启
sudo systemctl enable jenkins
sudo systemctl start jenkins

# 5. 查看初始密码
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

浏览器访问 `http://<服务器IP>:8080`，输入初始密码，按向导安装推荐插件即可。

### 2.3 安装 Node.js 22（通过 nvm）

```bash
# 切换到 jenkins 用户（或用 root 装到全局）
sudo -u jenkins -i

# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc

# 安装 Node 22 LTS
nvm install 22
nvm alias default 22

# 验证
node --version   # v22.x.x
npm --version    # 10.x.x
```

> **生产环境也可以用 apt 直接装**：`curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs`。nvm 的优势是版本切换灵活，但 CI 环境通常固定一个版本就够了。

### 2.4 设置 npm 国内镜像（国内服务器）

```bash
npm config set registry https://registry.npmmirror.com/
```

### 2.5 安装 Playwright 系统依赖

Chromium 在 headless 模式下需要大量系统库，漏装会报奇怪的错误（`error while loading shared libraries`）。

```bash
# 一键安装 Playwright 所需的全部系统依赖
npx playwright install-deps chromium

# 如果上面命令不可用，手动安装常用依赖：
sudo apt install -y \
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
  fonts-noto-color-emoji \
  libxshmfence1
```

> **重点**：这一步是踩坑重灾区。如果 Jenkins 跑测试时报 `host system is missing dependencies`，就是系统依赖没装全。

### 2.6 安装 Chromium 浏览器

```bash
# 在项目目录下执行（或全局安装）
npx playwright install chromium
```

---

## 三、Jenkins 插件安装

进入 **Manage Jenkins → Plugins → Available plugins**，搜索安装以下插件：

| 插件                    | 用途                                 |
| ----------------------- | ------------------------------------ |
| **NodeJS Plugin**       | 管理 Node.js 版本，自动注入 PATH     |
| **HTML Publisher**      | 发布 Playwright HTML 报告            |
| **Git Plugin**          | 拉取 Git 仓库（通常已自带）          |
| **Credentials Binding** | 注入敏感信息（账号密码等）到构建环境 |
| **Build Timestamp**     | 给构建加时间戳                       |

装完重启 Jenkins。

---

## 四、配置 Node.js 工具

**Manage Jenkins → Tools → NodeJS installations → Add NodeJS**：

- Name: `Node 22`
- 勾选 "Install automatically"
- Version: 选择 `Node.js 22.x LTS`
- 保存

这样每个 Job 配置时引用 "Node 22"，Jenkins 会自动下载和管理该版本。

---

## 五、凭证配置

**Manage Jenkins → Credentials → System → Global credentials → Add Credentials**：

### 5.1 Git 仓库凭证（如私有仓库需要）

- Kind: `Username with password` / `SSH Username with private key`
- Scope: Global
- ID: `git-repo-credential`

### 5.2 测试账号凭证

把 `.env` 里的敏感信息创建为 Secret Text：

- Kind: `Secret text`
- ID: `TEST_ADMIN_USERNAME`
- Secret: `炊烟1号`

依此类推创建：

- `TEST_ADMIN_PASSWORD` → `admin123`
- `TEST_USER_USERNAME` → `炊烟2号`
- `TEST_USER_PASSWORD` → `user123`
- `TEST_BASE_URL` → `https://testing.yychuiyan.com`

> **Why**：`.env` 文件不入 Git（已在 `.gitignore` 中），敏感信息通过 Jenkins 凭证注入，安全且可审计。

---

## 六、Jenkins Pipeline（声明式）

在项目根目录新建 `Jenkinsfile`，直接放仓库里：

```groovy
pipeline {
    agent any

    // 环境变量：在构建时从 Jenkins 凭证注入
    environment {
        BASE_URL = credentials('TEST_BASE_URL')
        ADMIN_USERNAME = credentials('TEST_ADMIN_USERNAME')
        ADMIN_PASSWORD = credentials('TEST_ADMIN_PASSWORD')
        USER_USERNAME = credentials('TEST_USER_USERNAME')
        USER_PASSWORD = credentials('TEST_USER_PASSWORD')
        // 标记 CI 环境，playwright.config.ts 会读取
        CI = 'true'
    }

    // 可手动选择测试级别
    parameters {
        choice(
            name: 'TEST_LEVEL',
            choices: ['smoke', 'regression', 'full'],
            description: 'smoke=P0冒烟(2min) | regression=P0+P1回归(5min) | full=全量(8min)'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                // NodeJS 插件自动将 node/npm 加入 PATH
                sh 'node --version'
                sh 'npm --version'
                sh 'npm ci'  // ci 比 install 更快更严格（要求 lock 文件一致）
            }
        }

        stage('Install Playwright Browser') {
            steps {
                sh 'npx playwright install chromium'
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // 根据参数选择测试命令
                    def testCmd = ''
                    switch (params.TEST_LEVEL) {
                        case 'smoke':
                            testCmd = 'npm run test:smoke'
                            break
                        case 'regression':
                            testCmd = 'npm run test:regression'
                            break
                        case 'full':
                            testCmd = 'npm test'
                            break
                    }
                    sh testCmd
                }
            }
        }
    }

    post {
        always {
            // 无论成功失败，都归档报告
            archiveArtifacts artifacts: 'test-results/**, reports/**', allowEmptyArchive: true

            // 发布 HTML 报告
            publishHTML(
                target: [
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'reports/playwright-report',
                    reportFiles: 'index.html',
                    reportName: 'Playwright Test Report'
                ]
            )
        }

        failure {
            // 失败时发邮件通知（需先配置 SMTP）
            // emailext(
            //     subject: "[Test Failed] \${env.JOB_NAME} - Build #\${env.BUILD_NUMBER}",
            //     body: "测试失败，查看报告: \${env.BUILD_URL}",
            //     to: 'team@example.com'
            // )
        }
    }
}
```

---

## 七、Jenkins Job 创建

### 7.1 创建 Pipeline Job

1. **New Item** → 输入名称 `Playwright-Automation-Course` → 选择 **Pipeline** → OK
2. 在 Pipeline 配置中：
   - **Definition**: `Pipeline script from SCM`
   - **SCM**: Git
   - **Repository URL**: 你的仓库地址
   - **Credentials**: 选择 5.1 创建的 Git 凭证
   - **Branches to build**: `*/master`（或你的主分支）
   - **Script Path**: `Jenkinsfile`
3. 勾选 **"This project is parameterized"** — Jenkins 会从 Jenkinsfile 的 `parameters` 自动生成（如果已存在同名参数则手动配置）

### 7.2 定时触发（Build Triggers）

**回归测试** — 每日凌晨 3:00 跑 P0+P1：

```
H 3 * * *
```

在 Job 配置 → Build Triggers → **Build periodically** → 填入上面的 cron：

```
H 3 * * *
```

> Jenkins cron 格式：`MINUTE HOUR DOM MONTH DOW`，`H` 表示 Jenkins 自动分散执行时间避免雪崩。

### 7.3 Webhook 触发（PR 门禁）

如果仓库支持 webhook（GitHub / GitLab / Gitee），可以做到每次 PR 自动跑冒烟测试：

**GitHub 示例**：

1. Jenkins 安装 **GitHub Integration** 插件
2. GitHub 仓库 Settings → Webhooks → Add webhook
3. Payload URL: `http://<jenkins-server>:8080/github-webhook/`
4. Content type: `application/json`
5. 事件：`Pull requests`
6. Jenkinsfile 加一个 trigger：

```groovy
triggers {
    githubPush()  // 或 genericTrigger 等
}
```

> 详细 webhook 配置因仓库平台不同而异，核心思路一致：push/pr 事件 → POST 到 Jenkins → Jenkins 拉代码跑流水线。

---

## 八、多 Job 拆分方案（进阶）

以上是"一个 Job 万能"方案，够小团队用了。如果测试规模增长，建议拆成独立 Job：

| Job 名称        | 触发时机      | 测试命令                  | 超时  |
| --------------- | ------------- | ------------------------- | ----- |
| `PW-Smoke`      | PR Webhook    | `npm run test:smoke`      | 5min  |
| `PW-Regression` | 每日凌晨 3:00 | `npm run test:regression` | 10min |
| `PW-Full`       | 手动 / 发版前 | `npm test`                | 15min |

拆分的好处：

- 门禁 Job（Smoke）必须通过才允许合并，单独配置 Required Checks
- 回归 Job 即使失败也不会阻塞 PR
- 资源隔离，高峰期互不影响

---

## 九、常见问题排查

### 9.1 `host system is missing dependencies`

```
╔══════════════════════════════════════════════════════╗
║ Host system is missing dependencies to run browsers ║
╚══════════════════════════════════════════════════════╝
```

**原因**：Chromium headless 需要的系统库缺失。

**解决**：

```bash
npx playwright install-deps chromium
# 或手动安装（见 2.5）
```

### 9.2 `browser closed unexpectedly` / 测试全部超时

**原因**：通常是系统资源不足（内存/磁盘），或浏览器没装。

**检查**：

```bash
free -h           # 内存剩余
df -h             # 磁盘剩余
npx playwright install --dry-run  # 检查浏览器安装状态
```

Jenkins Agent 至少需要 **2GB 可用内存**。

### 9.3 权限问题（`EACCES: permission denied`）

**原因**：Jenkins 用户对 workspace 无写权限。

**解决**：

```bash
sudo chown -R jenkins:jenkins /var/lib/jenkins/workspace
```

### 9.4 认证失败（`auth.setup.ts` 跑不过）

**原因**：Jenkins 环境没读到环境变量里的账号密码。

**检查**：

1. Jenkins 凭证 ID 是否与 Jenkinsfile 中 `credentials('XXX')` 一致
2. `playwright.config.ts` 中 `dotenv/config` 会加载 `.env`，但 `.env` 不在仓库里 — 确认 Jenkinsfile 的 `environment` 块覆盖了所有必需变量

### 9.5 npm install 太慢

**解决**：

```bash
npm config set registry https://registry.npmmirror.com/
```

在 Jenkinsfile 的 `Install Dependencies` 阶段加一行：

```groovy
sh 'npm config set registry https://registry.npmmirror.com/'
```

或者 Jenkins 服务器全局设置一次即可。

---

## 十、一条龙部署清单

按顺序执行，大约 30 分钟完成首次部署：

```
□ 1. 准备一台 Ubuntu 24.04 服务器（2C4G 起步）
□ 2. 安装 Java 21 + Jenkins → 浏览器打开完成初始化
□ 3. 安装 Node.js 22 + npm 国内镜像
□ 4. 安装 Playwright 系统依赖 + Chromium 浏览器
□ 5. 安装 Jenkins 插件（NodeJS、HTML Publisher、Credentials）
□ 6. 配置 NodeJS Tool → Node 22
□ 7. 创建 Git 凭证 + 测试账号凭证
□ 8. 项目根目录添加 Jenkinsfile（上面的内容）
□ 9. Jenkins 创建 Pipeline Job → 指向仓库 + Jenkinsfile
□ 10. 配置定时触发 + Webhook
□ 11. 手动构建一次 → 验证通过 → 查看 HTML 报告
```

---

## 十一、验证安装配置

> 每完成一步安装，跑对应的验证命令，输出结果匹配"通过标准"才算 OK。

### 11.1 验证 Java

```bash
java --version
```

**通过标准** — 输出版本 ≥ 21，类似：

```
openjdk 21.0.x 2024-xx-xx
```

❌ 不通过 — `command not found` 或版本低于 17（Jenkins 新版本要求 Java 17+，推荐 21）。

---

### 11.2 验证 Jenkins 运行状态

```bash
sudo systemctl status jenkins
```

**通过标准** — 看到 `active (running)`：

```
Active: active (running) since ...
```

再浏览器访问 `http://<服务器IP>:8080`，能打开 Jenkins 页面（已完成初始化解锁）。

---

### 11.3 验证 Node.js

```bash
node --version   # 期望 v22.x.x
npm --version    # 期望 10.x.x
```

**通过标准** — 版本号正确输出，且 Jenkins 用户也能执行：

```bash
sudo -u jenkins node --version   # 同样输出 v22.x.x
```

> 如果 jenkins 用户报 `command not found`，说明 Node 只装给了 root/当前用户。解决：用 nvm 装给 jenkins 用户，或 apt 全局安装。

---

### 11.4 验证 Playwright 系统依赖

```bash
npx playwright install-deps chromium --dry-run 2>&1
```

**通过标准** — 输出类似：

```
Playwright recommends installing the following packages:
# 这里列出包名…
```

如果所有包后面都标了 `(already installed)`，说明依赖齐全。

或者更直接：**直接尝试安装 Chromium 浏览器并执行依赖检查：**

```bash
npx playwright install chromium
npx playwright install-deps chromium
```

**通过标准** — `install` 输出 `already installed` 或正常下载完成；`install-deps` 不报错。

---

### 11.5 验证 Chromium 浏览器

```bash
npx playwright install chromium --dry-run
```

**通过标准** — 输出 `Chromium … is already installed`。

或者直接跑一个最小测试验证浏览器能启动（不需要项目代码）：

```bash
node -e "
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  console.log('Chromium 启动成功:', browser.version());
  await browser.close();
})();
"
```

**通过标准** — 输出 `Chromium 启动成功: …`，没有报错。

---

### 11.6 验证 Jenkins 插件

**Manage Jenkins → Plugins → Installed plugins**，搜索确认以下插件在列表中：

| 插件                | 状态要求     |
| ------------------- | ------------ |
| NodeJS Plugin       | ✅ Installed |
| HTML Publisher      | ✅ Installed |
| Git Plugin          | ✅ Installed |
| Credentials Binding | ✅ Installed |

**通过标准** — 四个插件状态都是 `Enabled`。

---

### 11.7 验证 NodeJS 工具配置

**Manage Jenkins → Tools → NodeJS installations**，确认：

- 有一条名为 `Node 22` 的配置
- 勾选了 "Install automatically"
- 版本选择了 `Node.js 22.x LTS`

**通过标准** — 列表中存在 `Node 22` 条目。

---

### 11.8 验证凭证

**Manage Jenkins → Credentials → System → Global credentials**，确认存在以下条目：

| ID                    | Kind        | 用途         |
| --------------------- | ----------- | ------------ |
| `TEST_BASE_URL`       | Secret text | 被测环境地址 |
| `TEST_ADMIN_USERNAME` | Secret text | 管理员账号   |
| `TEST_ADMIN_PASSWORD` | Secret text | 管理员密码   |
| `TEST_USER_USERNAME`  | Secret text | 普通用户账号 |
| `TEST_USER_PASSWORD`  | Secret text | 普通用户密码 |

**通过标准** — 5 个凭证都在列表中，ID 拼写与 Jenkinsfile 中 `credentials('XXX')` 完全一致。

---

### 11.9 验证 Git 拉取

```bash
# 在服务器上手动 clone 一次，确认网络和凭证没问题
cd /tmp
git clone <你的仓库地址>
cd Automation-Course
ls Jenkinsfile   # 确认 Jenkinsfile 在根目录
```

**通过标准** — clone 成功，`Jenkinsfile` 文件存在。

---

### 11.10 验证项目依赖安装

在 clone 下来的目录里：

```bash
cd /tmp/Automation-Course
npm ci
```

**通过标准** — 正常结束，没有 `ERR!` 报错。`node_modules/` 目录生成。

---

### 11.11 终局验证：手动触发一次 Jenkins 构建

以上全部通过后，在 Jenkins 里：

1. 进入 Job → **Build with Parameters**
2. 选择 `smoke` → **Build**
3. 等待构建完成

**通过标准** — 四个 Stage 全部绿色：

```
Checkout                         ✓
Install Dependencies             ✓
Install Playwright Browser       ✓
Run Tests                        ✓
```

点左侧 **Playwright Test Report** 能看到 HTML 报告，测试结果与本地一致。

> 🎉 到这就算全部搞定了。

---

### 验证速查表

| 步骤     | 命令                                        | 关键关键词          |
| -------- | ------------------------------------------- | ------------------- |
| Java     | `java --version`                            | `21.0`              |
| Jenkins  | `systemctl status jenkins`                  | `active (running)`  |
| Node     | `node --version`                            | `v22.`              |
| 系统依赖 | `npx playwright install-deps chromium`      | 不报错              |
| 浏览器   | `npx playwright install --dry-run chromium` | `already installed` |
| 插件     | Manage → Plugins                            | 4 个 Enabled        |
| 凭证     | Manage → Credentials                        | 5 个 Secret text    |
| Git      | `git clone <仓库>`                          | clone 成功          |
| 项目依赖 | `npm ci`                                    | 无 ERR              |
| 构建     | Jenkins Build with Parameters               | 全绿                |

---

## 十二、项目适配说明

本项目的 `playwright.config.ts` 已经为 CI 环境做好了适配，无需改动：

| 配置项       | CI 行为           | 本地行为 | 说明                    |
| ------------ | ----------------- | -------- | ----------------------- |
| `retries`    | 2 次重试          | 0 次     | `process.env.CI` 判断   |
| `forbidOnly` | true              | false    | CI 禁止 `.only`         |
| `reporter`   | HTML 报告         | 同       | `open: 'never'` 适合 CI |
| `screenshot` | only-on-failure   | 同       | 省空间                  |
| `trace`      | retain-on-failure | 同       | 失败可回溯              |
| `timeout`    | 30s               | 同       | 合理阈值                |
