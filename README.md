# 我的博客

基于 Next.js 搭建的个人博客，支持 Markdown 写作与后台管理。

## 功能

- 首页展示最新文章
- 文章列表页 `/blog`
- 文章详情页 `/blog/[slug]`
- 文章评论（匿名发布 + 持久化存储）
- 评论防刷（同 IP 限流）与简单验证码
- 评论自动审核辅助（敏感词自动驳回）
- **后台管理** `/admin`：添加、编辑、删除博文
- Markdown 渲染（标题、列表、代码块、链接等）
- 响应式布局，支持深色模式；**未手动选主题时**按本机时间 6:00–18:00 为浅色，其余为深色（点击切换后固定）
- **RSS**（`/feed.xml`）、**sitemap**、**robots.txt**，文章页 **Open Graph / Twitter Card** 元数据
- 文内显示**预估阅读时间**

## 快速开始

```bash
# 安装依赖（如未安装）
npm install

# 开发模式
npm run dev

# 构建
npm run build

# 生产运行
npm start
```

访问 [http://localhost:3000](http://localhost:3000) 查看博客。

## 后台管理

1. 复制 `.env.example` 为 `.env`，设置 `ADMIN_PASSWORD`
2. （推荐）设置 `POSTS_DIR` 到项目目录外，避免部署覆盖文章数据
3. （推荐）设置 `COMMENTS_DIR` 到项目目录外，避免部署覆盖评论数据
4. （可选）设置 `COMMENT_CAPTCHA_SECRET`、`COMMENT_SENSITIVE_WORDS`
5. 访问 http://localhost:3000/admin 登录（开发环境默认密码 `admin123`）
6. 在后台可添加、编辑、删除文章

**生产环境（服务器）**：不要把唯一一份密码只写在项目里的 `.env.production` 再反复被覆盖。请使用 **`/var/data/blog.env`**（详见 `DEPLOY.md` 与 `deploy/migrate-secrets-to-var-data.sh`），部署 `git pull` 后密码不会丢。

**修改管理员密码**：登录后台 → **账号**（`/admin/settings`），可自助改密；密码哈希写入服务器文件（默认 `/var/data/blog-admin.json`），不进 Git。首次改密前仍使用环境变量里的 `ADMIN_PASSWORD` 校验。

## 添加新文章

**方式一：后台**  
登录 `/admin` → 新建文章

**方式二：手动**  
在 `content/posts/` 目录下创建 `.md` 文件：

```markdown
---
title: "文章标题"
date: "2025-03-18"
excerpt: "文章摘要"
author: "作者名"
---

正文内容...
```

## 技术栈

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- gray-matter（Markdown 解析）
- react-markdown（Markdown 渲染）
