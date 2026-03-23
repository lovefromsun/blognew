#!/bin/bash
# 博客部署脚本 - 在云服务器上执行
# 用法: bash deploy.sh [首次部署|更新]

set -e

APP_DIR="/var/www/blog"
DOMAIN=""  # 填写你的域名，如 example.com

echo "=== 博客部署脚本 ==="

# 检查是否在服务器上
if [ ! -d "$APP_DIR" ]; then
    echo "错误: 项目目录 $APP_DIR 不存在"
    echo "请先将代码上传到服务器，或使用 git clone"
    exit 1
fi

cd "$APP_DIR"

# 检查 .env.production
if [ ! -f .env.production ]; then
    echo "警告: .env.production 不存在"
    echo "请创建并设置 ADMIN_PASSWORD"
    echo "  echo 'ADMIN_PASSWORD=你的密码' > .env.production"
    read -p "是否继续? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ">>> 安装依赖..."
npm install --omit=dev

echo ">>> 构建..."
npm run build

echo ">>> 重启 PM2..."
pm2 restart blog 2>/dev/null || pm2 start ecosystem.config.cjs

pm2 save

echo ">>> 部署完成!"
echo "访问: http://${DOMAIN:-localhost}"
