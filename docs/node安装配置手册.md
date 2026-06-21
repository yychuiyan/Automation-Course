# Node.js 安装配置手册

> 包含 Node.js 安装、nvm 版本管理、nrm 镜像源管理，覆盖 macOS 和 Windows。

## 一、安装 Node.js（首次安装）

新手直接从官网下载安装包即可，简单可靠。

### 下载

打开 [Node.js 官网](https://nodejs.org/)，选择 **LTS 版本**（长期支持，稳定优先）。

| 操作系统 | 下载格式                |
| -------- | ----------------------- |
| macOS    | `.pkg` 安装包           |
| Windows  | `.msi` 安装包（64-bit） |

### macOS 安装

1. 下载 `.pkg` 文件，双击打开
2. 一路"继续" → "同意" → "安装"
3. 装完终端验证：

```bash
node --version
# v22.x.x

npm --version
# 10.x.x
```

### Windows 安装

1. 下载 `.msi` 文件，双击运行
2. 勾选 **"Automatically install the necessary tools"**（会自动装 Chocolatey 和编译工具）
3. 一路 Next → Install → Finish
4. 打开 PowerShell 或 CMD 验证：

```powershell
node --version
# v22.x.x

npm --version
# 10.x.x
```

> **安装完成后建议重启电脑**，确保 PATH 生效。

## 二、安装 nvm 版本管理器

官网安装包只能装一个版本。nvm 让你同时装多个 Node 版本，一条命令随意切换。

### macOS — 安装 nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

装完加载：

```bash
source ~/.zshrc
```

验证：

```bash
nvm --version
```

### Windows — 安装 nvm-windows

nvm 原版不支持 Windows，用社区维护的 [nvm-windows](https://github.com/coreybutler/nvm-windows)：

1. 打开 [nvm-windows Releases](https://github.com/coreybutler/nvm-windows/releases)
2. 下载 **`nvm-setup.exe`**（最新版）
3. 双击安装，一路 Next
4. 装完打开 PowerShell 或 CMD 验证：

```powershell
nvm version
# 1.x.x
```

> **注意**：如果之前用官网安装包装过 Node，nvm-windows 安装时会提示"是否让 nvm 接管已有 Node"，选 **Yes**。

### 常用命令

macOS 和 Windows 命令基本一致：

```bash
nvm ls-remote           # （仅 macOS）查看所有可安装版本
nvm ls-remote --lts     # （仅 macOS）只看 LTS 版本
nvm list available      # （仅 Windows）查看可安装版本

nvm install 22          # 安装 Node.js 22 LTS
nvm install 18          # 安装 Node.js 18 LTS
nvm ls                  # 查看本地已安装的版本
nvm use 22              # 切换到 v22
nvm alias default 22    # 设置默认版本（新终端自动生效）
nvm uninstall 23        # 卸载某个版本
```

> macOS 用 `nvm ls-remote` 查远端版本；Windows 用 `nvm list available`。

## 三、安装 Node.js（通过 nvm）

```bash
# 安装最新 LTS（推荐）
nvm install 22

# 设为默认
nvm alias default 22   # macOS
nvm on                 # Windows（nvm-windows 默认激活最新安装的版本）

# 确认
node --version
# v22.x.x
```

## 四、.nvmrc 统一团队版本

项目根目录放一个 `.nvmrc` 文件，队友 clone 后一条命令切到正确版本：

```bash
# 生成 .nvmrc
node --version > .nvmrc

# 内容示例
v22.11.0
```

使用：

```bash
# macOS
nvm use

# Windows（nvm-windows 支持 .nvmrc）
nvm use
```

## 五、nrm 镜像源管理

npm 默认源在海外，国内安装包慢得离谱。nrm 一键切换到淘宝镜像。

```bash
# 全局安装
npm install -g nrm
```

macOS 和 Windows 通用。

### 常用命令

```bash
nrm ls              # 列出所有可用源，当前使用的带 * 标记
nrm use taobao      # 切换到淘宝镜像
nrm use npm         # 切回 npm 官方源
nrm test            # 测试所有源延迟，自动选最快的
nrm current         # 查看当前使用的源
```

输出示例：

```
  npm ---------- https://registry.npmjs.org/
  yarn --------- https://registry.yarnpkg.com/
  tencent ------ https://mirrors.cloud.tencent.com/npm/
* taobao ------- https://registry.npmmirror.com/
  npmMirror ---- https://skimdb.npmjs.com/registry/
```

### 手动设置（不用 nrm）

```bash
# 切到淘宝源
npm config set registry https://registry.npmmirror.com/

# 查看当前源
npm config get registry

# 切回官方
npm config set registry https://registry.npmjs.org/
```

## 六、项目推荐版本组合

| 组件    | 推荐版本     | 说明                       |
| ------- | ------------ | -------------------------- |
| Node.js | v22.x LTS    | 稳定长期支持，生态兼容性好 |
| npm     | 随 Node 自带 | 无需额外安装               |

## 七、常见问题

### 切换 Node 版本后 npm 全局包消失

每个 Node 版本有独立的全局包目录，切换后需重新安装：

```bash
nvm use 22
npm install -g nrm
```

### `nvm: command not found`（macOS）

nvm 未加载，手动执行：

```bash
source ~/.zshrc
```

或检查 `~/.zshrc` 中是否有以下内容（没有则手动加）：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### `nvm` 命令不识别（Windows）

- nvm-windows 装完后需 **重启终端**（关掉 PowerShell/CMD 重开）
- 如果还不行，检查环境变量中是否有 `NVM_HOME` 和 `NVM_SYMLINK`

### Homebrew 装的 Node 和 nvm 冲突（macOS）

如果之前用 `brew install node` 装过，建议卸载后统一用 nvm：

```bash
brew uninstall node
brew uninstall node@22  # 如果有
```

### Windows 上安装 nvm-windows 前需要卸载已有 Node

nvm-windows 安装程序会自动检测已有 Node 并询问是否接管。**选 Yes** 即可，无需手动卸载。

## 八、一条龙安装

### macOS

```bash
# 1. 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.zshrc

# 2. 安装 Node 22 LTS
nvm install 22
nvm alias default 22

# 3. 安装 nrm 并切到淘宝源
npm install -g nrm
nrm use taobao

# 4. 验证
echo "Node: $(node --version)"
echo "npm:  $(npm --version)"
nrm current
```

### Windows

```powershell
# 1. 去 GitHub 下载 nvm-setup.exe 安装
#    https://github.com/coreybutler/nvm-windows/releases

# 2. 安装 Node 22 LTS
nvm install 22
nvm use 22

# 3. 安装 nrm 并切到淘宝源
npm install -g nrm
nrm use taobao

# 4. 验证
node --version
npm --version
nrm current
```
