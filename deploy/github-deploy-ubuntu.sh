#!/usr/bin/env bash
# 从 GitHub 部署 blognew 到 Ubuntu 服务器（150.158.75.100 / lovefromsun.cloud）
# 用法：
#   首次：在服务器上保存本脚本后执行
#     chmod +x github-deploy-ubuntu.sh && sudo -E ./github-deploy-ubuntu.sh first
#   更新：./github-deploy-ubuntu.sh update
#
# 前置：服务器已配置 SSH 公钥可执行 git@github.com:lovefromsun/blognew.git
# 数据目录外置，更新不会覆盖：/var/data/blog-posts、/var/data/blog-comments

set -euo pipefail

REPO_SSH="git@github.com:lovefromsun/blognew.git"
APP_DIR="/var/www/blog"
POSTS_DIR="${POSTS_DIR:-/var/data/blog-posts}"
COMMENTS_DIR="${COMMENTS_DIR:-/var/data/blog-comments}"
SECRETS_FILE="${SECRETS_FILE:-/var/data/blog.env}"

log() { echo "[deploy] $*"; }

# 密钥放在 /var/data/blog.env，git pull 不会覆盖（见 ecosystem.config.cjs）
ensure_secrets() {
  sudo mkdir -p /var/data
  cd "$APP_DIR"
  if [[ -f "$SECRETS_FILE" ]]; then
    log "使用已有密钥文件 $SECRETS_FILE"
  elif [[ -n "${ENV_BACKUP:-}" ]] && [[ -f "$ENV_BACKUP" ]]; then
    log "从备份恢复密钥到 $SECRETS_FILE"
    sudo cp "$ENV_BACKUP" "$SECRETS_FILE"
    sudo chmod 600 "$SECRETS_FILE"
    sudo chown "${SUDO_USER:-$USER}:${SUDO_USER:-$USER}" "$SECRETS_FILE"
  elif [[ -f deploy/blog.env.example ]]; then
    sudo cp deploy/blog.env.example "$SECRETS_FILE"
    sudo chmod 600 "$SECRETS_FILE"
    sudo chown "${SUDO_USER:-$USER}:${SUDO_USER:-$USER}" "$SECRETS_FILE"
    log "已创建 $SECRETS_FILE，请执行: sudo nano $SECRETS_FILE"
    log "必须设置 ADMIN_PASSWORD、COMMENT_CAPTCHA_SECRET 等"
    if [[ "${SKIP_CONFIRM:-}" != "1" ]]; then
      read -r -p "已保存? 回车继续 " _
    fi
  else
    log "缺少 deploy/blog.env.example" >&2
    exit 1
  fi
  if ! grep -q '^POSTS_DIR=' "$SECRETS_FILE"; then
    echo "POSTS_DIR=$POSTS_DIR" >> "$SECRETS_FILE"
  fi
  if ! grep -q '^COMMENTS_DIR=' "$SECRETS_FILE"; then
    echo "COMMENTS_DIR=$COMMENTS_DIR" >> "$SECRETS_FILE"
  fi
  rm -f .env.production
  ln -sf "$SECRETS_FILE" .env.production
  log "已软链 .env.production -> $SECRETS_FILE"
}

ensure_packages() {
  if ! command -v git >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
    log "安装 git / curl / nginx / node 20 / pm2（如需）..."
    sudo apt-get update -y
    sudo apt-get install -y git curl nginx unzip
    if ! command -v node >/dev/null 2>&1; then
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get install -y nodejs
    fi
    sudo npm install -g pm2
  fi
}

ensure_data_dirs() {
  sudo mkdir -p "$POSTS_DIR" "$COMMENTS_DIR"
  sudo chown -R "${SUDO_USER:-$USER}:${SUDO_USER:-$USER}" "$POSTS_DIR" "$COMMENTS_DIR" 2>/dev/null || true
}

first_deploy() {
  ensure_packages
  ensure_data_dirs

  if [[ -d "$APP_DIR/.git" ]]; then
    log "目录已存在且为 git 仓库，请改用: $0 update"
    exit 1
  fi

  if [[ -d "$APP_DIR" ]]; then
    BACKUP="/var/www/blog.bak.$(date +%s)"
    log "备份现有目录到 $BACKUP"
    sudo mv "$APP_DIR" "$BACKUP"
    ENV_BACKUP="$BACKUP/.env.production"
  else
    ENV_BACKUP=""
  fi

  sudo mkdir -p /var/www
  sudo git clone "$REPO_SSH" "$APP_DIR"
  sudo chown -R "${SUDO_USER:-$USER}:${SUDO_USER:-$USER}" "$APP_DIR"

  cd "$APP_DIR"

  ensure_secrets

  if [[ -z "$(sudo ls -A "$POSTS_DIR" 2>/dev/null || true)" ]] && [[ -d content/posts ]]; then
    log "首次：从仓库 content/posts 复制到 $POSTS_DIR"
    cp -a content/posts/. "$POSTS_DIR/" || true
  fi

  npm install
  npm run build

  if pm2 describe blog >/dev/null 2>&1; then
    pm2 delete blog || true
  fi
  pm2 start ecosystem.config.cjs
  pm2 save

  log "首次部署完成。请配置 Nginx（见 deploy/nginx-blog.conf）后: sudo nginx -t && sudo systemctl reload nginx"
}

update_deploy() {
  if [[ ! -d "$APP_DIR/.git" ]]; then
    log "未检测到 $APP_DIR 为 git 仓库，请先执行 first 或手动 clone"
    exit 1
  fi
  ensure_data_dirs
  cd "$APP_DIR"

  log "git pull"
  git pull origin main

  npm install
  npm run build
  pm2 restart blog --update-env

  log "更新完成"
}

nginx_snippet() {
  cat <<'NGINX'
# 保存为 /etc/nginx/sites-available/blog 后：
# sudo ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
# sudo nginx -t && sudo systemctl reload nginx

server {
    listen 80;
    server_name lovefromsun.cloud www.lovefromsun.cloud 150.158.75.100;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
}

case "${1:-}" in
  first) first_deploy ;;
  update) update_deploy ;;
  nginx) nginx_snippet ;;
  *)
    echo "用法: $0 first | update | nginx"
    echo "  first  - 首次从 GitHub 克隆并构建、PM2 启动"
    echo "  update - 在已有 git 仓库上 pull + 构建 + 重启"
    echo "  nginx  - 打印 Nginx 配置片段（lovefromsun.cloud + IP）"
    exit 1
    ;;
esac
