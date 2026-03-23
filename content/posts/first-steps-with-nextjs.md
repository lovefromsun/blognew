---
title: "Next.js 入门：从零搭建博客"
date: "2025-03-17"
excerpt: "用 Next.js App Router 和 Markdown 快速搭建一个静态博客。"
author: "博主"
---

# Next.js 入门：从零搭建博客

本文介绍如何用 Next.js 的 App Router 和 Markdown 快速搭建一个静态博客。整个过程大约 30 分钟即可完成。

## 为什么选择 Next.js？

- **服务端渲染**：更好的 SEO 和首屏加载
- **文件系统路由**：基于文件结构自动生成路由
- **内置优化**：图片、字体、脚本自动优化
- **生态成熟**：社区活跃，文档完善

## 核心步骤

1. 使用 `create-next-app` 创建项目
2. 安装 `gray-matter` 和 `react-markdown` 解析 Markdown
3. 在 `content/posts` 目录下编写 `.md` 文章
4. 通过 `getAllPosts` 和 `getPostBySlug` 读取文章
5. 使用动态路由 `[slug]` 渲染文章详情页

## 示例代码

```typescript
// 读取所有文章
const posts = getAllPosts();

// 读取单篇文章
const post = getPostBySlug("welcome");
```

## 小结

Next.js 非常适合构建博客和内容类网站。如果你也想尝试，不妨从官方文档开始动手实践。
