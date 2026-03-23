#!/usr/bin/env bash
# 一次性：把当前项目里的 .env.production 迁到 /var/data/blog.env，并改为软链
# 在服务器 /var/www/blog 下执行：bash deploy/migrate-secrets-to-var-data.sh

set -euo pipefail

SECRETS="/var/data/blog.env"
APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$APP_DIR"

sudo mkdir -p /var/data

if [[ -f "$SECRETS" ]]; then
  echo "已存在 $SECRETS，跳过复制。若需覆盖请先自行备份再删除该文件。"
else
  if [[ -f .env.production ]] && [[ ! -L .env.production ]]; then
    echo "复制 .env.production -> $SECRETS"
    sudo cp .env.production "$SECRETS"
  elif [[ -f .env.example ]]; then
    echo "未找到 .env.production，从 .env.example 创建 $SECRETS"
    sudo cp .env.example "$SECRETS"
    echo "请编辑: sudo nano $SECRETS"
  else
    echo "未找到 .env.production 或 .env.example" >&2
    exit 1
  fi
  sudo chmod 600 "$SECRETS"
  sudo chown "${SUDO_USER:-$USER}:${SUDO_USER:-$USER}" "$SECRETS"
fi

if [[ -e .env.production ]] && [[ ! -L .env.production ]]; then
  rm -f .env.production
fi
ln -sf "$SECRETS" .env.production
echo "已建立软链: $APP_DIR/.env.production -> $SECRETS"
echo "请确认内容: grep -E '^ADMIN_PASSWORD=|^POSTS_DIR=' $SECRETS | sed 's/=.*/=***/'"
echo "然后: pm2 restart blog --update-env"
