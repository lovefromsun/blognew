#!/bin/bash
# 在服务器上执行完整部署
set -e

echo ">>> 检查环境..."
command -v node >/dev/null 2>&1 || {
  echo "安装 Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
}
command -v pm2 >/dev/null 2>&1 || npm install -g pm2
command -v nginx >/dev/null 2>&1 || apt-get install -y nginx unzip

echo ">>> 解压项目..."
mkdir -p /var/www
cd /var/www
rm -rf blog
unzip -o /tmp/blog-deploy.zip -d blog
cd blog

echo ">>> 准备文章数据目录..."
POSTS_DIR_DEFAULT="/var/data/blog-posts"
COMMENTS_DIR_DEFAULT="/var/data/blog-comments"
mkdir -p "$POSTS_DIR_DEFAULT"
mkdir -p "$COMMENTS_DIR_DEFAULT"

# 首次迁移：如果外置目录为空且项目内有文章，则复制一份到外置目录
if [ -z "$(ls -A "$POSTS_DIR_DEFAULT" 2>/dev/null)" ] && [ -d "content/posts" ]; then
  cp -a content/posts/. "$POSTS_DIR_DEFAULT"/
  echo "已将 content/posts 初始化到 $POSTS_DIR_DEFAULT"
fi

echo ">>> 创建 .env.production..."
if [ ! -f .env.production ]; then
  {
    echo "ADMIN_PASSWORD=admin123"
    echo "POSTS_DIR=$POSTS_DIR_DEFAULT"
    echo "COMMENTS_DIR=$COMMENTS_DIR_DEFAULT"
    echo "COMMENT_CAPTCHA_SECRET=change-me-to-random-string"
    echo "COMMENT_SENSITIVE_WORDS=赌博,色情,诈骗,辱骂,反动"
  } > .env.production
  echo "已使用默认密码 admin123，请部署后修改！"
else
  if ! grep -q "^POSTS_DIR=" .env.production; then
    echo "POSTS_DIR=$POSTS_DIR_DEFAULT" >> .env.production
    echo "已追加 POSTS_DIR=$POSTS_DIR_DEFAULT 到 .env.production"
  fi
  if ! grep -q "^COMMENTS_DIR=" .env.production; then
    echo "COMMENTS_DIR=$COMMENTS_DIR_DEFAULT" >> .env.production
    echo "已追加 COMMENTS_DIR=$COMMENTS_DIR_DEFAULT 到 .env.production"
  fi
  if ! grep -q "^COMMENT_CAPTCHA_SECRET=" .env.production; then
    echo "COMMENT_CAPTCHA_SECRET=change-me-to-random-string" >> .env.production
    echo "已追加 COMMENT_CAPTCHA_SECRET 到 .env.production"
  fi
  if ! grep -q "^COMMENT_SENSITIVE_WORDS=" .env.production; then
    echo "COMMENT_SENSITIVE_WORDS=赌博,色情,诈骗,辱骂,反动" >> .env.production
    echo "已追加 COMMENT_SENSITIVE_WORDS 到 .env.production"
  fi
fi

echo ">>> 安装依赖..."
npm install

echo ">>> 构建..."
npm run build

echo ">>> 启动 PM2..."
pm2 delete blog 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo ">>> 部署完成！"
echo "请配置 Nginx 后访问你的域名"
