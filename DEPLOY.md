# 博客部署指南

## 一、首次部署

### 1. 打包项目（本地）

在项目根目录执行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts\pack-for-deploy.ps1
```

会生成 `blog-deploy.zip`。

### 2. 上传到服务器

```powershell
scp blog-deploy.zip root@你的服务器IP:/tmp/
```

### 3. 在服务器上执行

```bash
# SSH 登录
ssh root@你的服务器IP

# 安装 Node.js 20（如未安装）
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 PM2 和 Nginx
sudo npm install -g pm2
sudo apt update && sudo apt install -y nginx unzip

# 创建目录并解压
sudo mkdir -p /var/www
cd /var/www
sudo unzip -o /tmp/blog-deploy.zip -d blog
cd blog

# 创建环境变量（替换为你的密码）
mkdir -p /var/data/blog-posts
mkdir -p /var/data/blog-comments
cat > .env.production <<'EOF'
ADMIN_PASSWORD=你的强密码
POSTS_DIR=/var/data/blog-posts
COMMENTS_DIR=/var/data/blog-comments
COMMENT_CAPTCHA_SECRET=请替换为随机复杂字符串
COMMENT_SENSITIVE_WORDS=赌博,色情,诈骗,辱骂,反动
# 站点域名（RSS / sitemap / 分享卡片链接）
SITE_URL=https://你的域名
EOF

# 首次迁移：如果外置目录为空，复制当前文章过去
if [ -z "$(ls -A /var/data/blog-posts 2>/dev/null)" ]; then
  cp -a content/posts/. /var/data/blog-posts/
fi

# 安装依赖、构建、启动
npm install
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 4. 配置 Nginx

```bash
# 复制配置并修改域名
sudo cp deploy/nginx-blog.conf /etc/nginx/sites-available/blog
sudo nano /etc/nginx/sites-available/blog
# 将 YOUR_DOMAIN 替换为你的域名

# 启用站点
sudo ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. 配置 HTTPS（推荐）

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名.com -d www.你的域名.com
```

---

## 二、使用 Git 部署（推荐）

若项目已推送到 GitHub/Gitee：

```bash
# 安装 git
sudo apt install -y git

# 克隆
cd /var/www
sudo git clone https://你的仓库地址 blog
cd blog

# 后续同上：创建 .env.production、npm install、npm run build、pm2 start
```

### 生产密钥外置（推荐，避免每次部署重置密码）

把敏感配置放在 **项目目录外** `/var/data/blog.env`，`git pull` **不会**覆盖它；PM2 会优先读取该文件（见根目录 `ecosystem.config.cjs`）。

**一次性操作（在服务器 `/var/www/blog`）：**

```bash
# 若当前只有项目内的 .env.production，可一键迁移并改为软链
bash deploy/migrate-secrets-to-var-data.sh
```

或手动：

```bash
sudo mkdir -p /var/data
sudo cp deploy/blog.env.example /var/data/blog.env
sudo chmod 600 /var/data/blog.env
sudo nano /var/data/blog.env   # 填写 ADMIN_PASSWORD、POSTS_DIR、COMMENTS_DIR 等

cd /var/www/blog
rm -f .env.production
ln -sf /var/data/blog.env .env.production

pm2 restart blog --update-env
```

之后改密码只需：`sudo nano /var/data/blog.env` 再 `pm2 restart blog --update-env`。

后台 **账号** 页（`/admin/settings`）也可修改管理员登录密码（写入 `ADMIN_PASSWORD_FILE` 或默认 `/var/data/blog-admin.json`）。请保证运行用户对 `/var/data` 有写权限，例如：

```bash
sudo chown ubuntu:ubuntu /var/data
```

---

## 三、更新部署

```bash
cd /var/www/blog

# 若用 Git
git pull

# 若用上传
# 重新上传并解压覆盖

# 执行部署
npm install
npm run build
pm2 restart blog --update-env
```

说明：文章目录与评论目录配置到 `POSTS_DIR=/var/data/blog-posts`、`COMMENTS_DIR=/var/data/blog-comments` 后，更新代码不会覆盖这两个目录的数据。

说明：管理员密码等若已迁到 `/var/data/blog.env`，部署同样**不会**覆盖。

### GitHub Actions 自动部署（推送到 `main`）

仓库已包含 `.github/workflows/deploy.yml`：**每次 push 到 `main`** 会通过 SSH 在服务器执行 `git pull`、`npm install`、`npm run build`、`pm2 restart blog`。

1. 在 GitHub 打开仓库 **Settings → Secrets and variables → Actions → New repository secret**，添加：

   | Name | 说明 |
   |------|------|
   | `DEPLOY_HOST` | 服务器 IP 或域名 |
   | `DEPLOY_USER` | SSH 用户（如 `ubuntu`） |
   | `DEPLOY_SSH_KEY` | **私钥**全文（与服务器 `~/.ssh/authorized_keys` 中公钥配对） |

2. 在**服务器**上为该用户配置好：能 `ssh` 登录、能 `cd /var/www/blog && git pull`（仓库已 clone 且远程可用）、`pm2` 与 Node 在 PATH 中。

3. 若项目目录或 SSH 端口不是 `/var/www/blog`、`22`，请编辑 `.github/workflows/deploy.yml` 中的 `cd` 或给 `appleboy/ssh-action` 增加 `port:`。

4. 也可在 Actions 里 **Run workflow**（`workflow_dispatch`）手动触发。

首次配置 Secret 前推送会失败，属正常；配好 Secret 后重跑失败的工作流或再 push 一次即可。

---

## 四、检查清单

- [ ] 安全组放行 80、443
- [ ] 域名解析到服务器 IP
- [ ] 已设置 `ADMIN_PASSWORD`（推荐 `/var/data/blog.env` + 软链，见上文）
- [ ] `npm run build` 成功
- [ ] PM2 已启动 `pm2 status`
- [ ] Nginx 可访问 `curl -I http://localhost`
