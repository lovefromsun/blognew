#!/bin/bash
# 在服务器上首次部署时执行
# 用法: bash server-setup.sh
# 前提: 已将 blog-deploy.zip 上传到 /tmp/ 并解压到 /var/www/blog

set -e
cd /var/www/blog

# 创建 .env.production（如不存在）
if [ ! -f .env.production ]; then
    echo "请设置管理员密码，将写入 .env.production"
    read -sp "ADMIN_PASSWORD: " pwd
    echo ""
    echo "ADMIN_PASSWORD=$pwd" > .env.production
fi

npm install
npm run build

# 启动 PM2
pm2 delete blog 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo "部署完成! 请配置 Nginx 后访问你的域名"
