/**
 * 站点绝对地址：用于 RSS、sitemap、Open Graph。
 * 生产环境请在 .env 设置 SITE_URL 或 NEXT_PUBLIC_SITE_URL（如 https://lovefromsun.cloud）
 */
export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
  if (raw) return raw.replace(/\/$/, "");
  return "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 粗略阅读分钟（中英混排按字符估算） */
export function estimateReadMinutes(markdown: string): number {
  const text = markdown.replace(/\s+/g, " ").trim();
  const n = text.length;
  if (n === 0) return 1;
  return Math.max(1, Math.round(n / 450));
}
