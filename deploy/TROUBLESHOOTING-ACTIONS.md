# GitHub Actions 自动部署：一步步排查与解决

按顺序做；**上一步通过再做下一步**。每步说明「现象 → 原因 → 怎么做」。

---

## 第 0 步：确认失败发生在哪

1. 打开仓库 **Actions**，点开最近一次红色的 **Deploy to server**。
2. 看有两个步骤：
   - **SSH smoke test (whoami)** 红了 → 问题在 **网络 / SSH / 密钥 / 安全组**（见第 1～4 步）。
   - **SSH smoke test** 绿、**Deploy via SSH** 红了 → 问题在 **服务器上的命令**（见第 5～7 步）。

---

## 第 1 步：Secrets 是否齐全、名字是否完全一致

**现象**：`Error: missing server host` → **没有配置 `DEPLOY_HOST`**，或 Secret **名称写错**（例如写成了 `HOST`、`deploy_host`），导致 `host` 为空。

**现象**：日志里出现 `empty host`、`missing key`、`invalid` 等。

**原因**：仓库 **Settings → Secrets and variables → Actions** 里缺少变量，或名称与 workflow 不一致（区分大小写）。

**解决**：至少要有这三个 **Repository secrets**（不要只建在 Environment 里却未在 workflow 里写 `environment:`）：

| Secret 名称 | 内容 |
|-------------|------|
| `DEPLOY_HOST` | 服务器公网 IP 或能 SSH 的域名（不要带 `http://`） |
| `DEPLOY_USER` | SSH 用户名（如 `ubuntu`、`root`） |
| `DEPLOY_SSH_KEY` | **私钥**全文 |

保存后 **重新运行失败的工作流**（Re-run all jobs）或再 push 一次。

---

## 第 2 步：私钥与服务器 authorized_keys 是否配对

**现象**：`handshake failed`、`unable to authenticate`、`publickey`、`Permission denied (publickey)`。

**原因**：GitHub 里放的不是「能登录该用户」的私钥，或服务器 `~/.ssh/authorized_keys` 里没有对应公钥。

**解决**：

1. **在服务器上**（用你平时能登录的方式）执行：
   ```bash
   grep -E '^ssh-' ~/.ssh/authorized_keys
   ```
2. **在你本机**（或生成密钥的那台机器）对公钥做对比：
   ```bash
   ssh-keygen -lf ~/.ssh/id_ed25519.pub
   ```
3. 若 GitHub 里存的是 **另一对** 密钥的私钥，把 **匹配的那把公钥** 追加到服务器：
   ```bash
   # 在服务器上，把下面 YOUR_PUB 换成你的 .pub 文件内容一行
   echo "YOUR_PUB" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```
4. 私钥粘贴到 Secret 时必须 **从 `-----BEGIN` 到 `-----END` 整段**，不要多空行、不要缺行。推荐 **ed25519**（Ubuntu 22+ 默认友好）；老 RSA 若被拒，见第 4 步。

---

## 第 3 步：云安全组 / 防火墙是否挡住 GitHub

**现象**：`Connection timed out`、`no route to host`、很久才失败。

**原因**：服务器 **入站 22**（或你的 SSH 端口）未对公网开放，或只允许你办公室 IP；**GitHub Actions 的出口 IP 不在白名单里**。

**解决**：

1. 在云厂商控制台找到 **安全组 / 防火墙**，对 **TCP 22**（或你的 SSH 端口）允许来源：
   - 排查阶段可临时 **0.0.0.0/0**（确认通了再收紧）；
   - 或参考 [GitHub 官方 IP 列表](https://api.github.com/meta) 里 `actions` 网段（会变化，维护成本高）。
2. 确认 `DEPLOY_HOST` 是 **公网 IP 或公网解析的域名**（不是仅内网）。

---

## 第 4 步：主机密钥 / 算法不兼容

**现象**：`host key verification failed`、`known_hosts`、`algorithm`、`ssh-rsa`。

**原因**：中间人校验严格；或服务器只提供旧算法、客户端不支持。

**解决**：

1. 若 workflow 里配置了 `fingerprint`（主机指纹），必须与服务器一致；不确定可先 **去掉** 该配置再试。
2. 若日志提示 **RSA / ssh-rsa**，在服务器 `/etc/ssh/sshd_config` 或 `sshd_config.d/*.conf` 中按需增加（以官方文档为准）：
   ```text
   CASignatureAlgorithms +ssh-rsa
   ```
   然后 `sudo systemctl reload sshd`。**更推荐**：改用 **ed25519** 密钥对重新配置第 2 步。

---

## 第 5 步：SSH 已通，但 `git pull` 失败

**现象**：`fatal: not a git repository`、`Permission denied`、`could not read from remote`。

**原因**：`/var/www/blog` 不是 clone 下来的目录、权限不对，或 **服务器上的 git 访问 GitHub** 未配置（HTTPS 要凭据、SSH 要 deploy key）。

**解决**：

1. SSH 登录服务器：
   ```bash
   cd /var/www/blog && git status && git remote -v
   ```
2. 若远程是 HTTPS，需在服务器配置 **credential** 或改为 **SSH 远程** 并配置 **deploy key**。
3. 保证执行部署的用户对该目录有 **写权限**。

---

## 第 6 步：`npm` / `node` / `pm2` 找不到

**现象**：`command not found: npm`、`pm2: not found`。

**原因**：GitHub Actions 通过 SSH 跑的是 **非登录 shell**，不会读你平时 `~/.bash_profile` 里改的 PATH（例如 nvm）。

**解决**（任选其一）：

1. Workflow 里已用 **登录式 shell** 执行部署脚本（`bash -lc '...'`）；若仍失败，在服务器上查绝对路径：
   ```bash
   which npm node pm2
   ```
   把 workflow 里命令改成绝对路径，或在脚本开头 `export PATH=...`。
2. 或用 **系统级** Node（如 `apt` 装的 `nodejs`）和 `npm i -g pm2` 装 pm2，保证 `which` 在 `/usr/bin` 等默认 PATH 下。

---

## 第 7 步：`npm run build` 失败

**现象**：编译报错、内存不足 `Killed`。

**原因**：代码/依赖问题，或服务器内存过小。

**解决**：把 Actions 日志里 **build 段的红色报错** 复制下来本地 `npm run build` 对照；内存问题可临时加 swap 或升级机型。

---

## 可选：只看 SSH 能不能通

仓库若包含 **仅手动运行** 的 workflow（如 `ssh-smoke-test.yml`），在 Actions 里选 **Run workflow**，只跑 `whoami`，便于快速验证第 1～4 步。

---

## 可选：打开 SSH 调试日志

在仓库 **Settings → Secrets and variables → Actions → Variables** 里新增 **Variable**（不是 Secret）：

- 名称：`DEPLOY_DEBUG`
- 值：`true`

推送或重跑 workflow 后，`appleboy/ssh-action` 会输出更详细的连接日志（**不要**把含密钥的日志公开张贴）。

排查结束后可把 `DEPLOY_DEBUG` 删掉或改为 `false`。
