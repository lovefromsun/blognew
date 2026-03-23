#!/usr/bin/env bash
set -euo pipefail

ZIP_PATH="/tmp/blog-deploy.zip"
APP_DIR="/var/www/blog"
POSTS_DIR="/var/data/blog-posts"
COMMENTS_DIR="/var/data/blog-comments"

sudo mkdir -p "$APP_DIR"
sudo unzip -o "$ZIP_PATH" -d "$APP_DIR" >/dev/null || true
sudo chown -R "$USER":"$USER" "$APP_DIR"

cd "$APP_DIR"

sudo mkdir -p "$POSTS_DIR" "$COMMENTS_DIR"
sudo chown -R "$USER":"$USER" "$POSTS_DIR" "$COMMENTS_DIR"

if [ -d content/posts ] && [ -z "$(ls -A "$POSTS_DIR" 2>/dev/null)" ]; then
  cp -a content/posts/. "$POSTS_DIR"/
fi

if [ ! -f .env.production ]; then
  echo "ADMIN_PASSWORD=change-me-now" > .env.production
fi

if grep -q "^POSTS_DIR=" .env.production; then
  sed -i "s#^POSTS_DIR=.*#POSTS_DIR=$POSTS_DIR#" .env.production
else
  echo "POSTS_DIR=$POSTS_DIR" >> .env.production
fi

if grep -q "^COMMENTS_DIR=" .env.production; then
  sed -i "s#^COMMENTS_DIR=.*#COMMENTS_DIR=$COMMENTS_DIR#" .env.production
else
  echo "COMMENTS_DIR=$COMMENTS_DIR" >> .env.production
fi

if ! grep -q "^COMMENT_CAPTCHA_SECRET=" .env.production; then
  echo "COMMENT_CAPTCHA_SECRET=change-me-to-random-string" >> .env.production
fi

if ! grep -q "^COMMENT_SENSITIVE_WORDS=" .env.production; then
  echo "COMMENT_SENSITIVE_WORDS=赌博,色情,诈骗,辱骂,反动" >> .env.production
fi

npm install
npm run build
pm2 restart blog || pm2 start ecosystem.config.cjs
pm2 status
