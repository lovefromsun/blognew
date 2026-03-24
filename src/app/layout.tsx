import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const notoSans = Noto_Sans_SC({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "我的博客",
    template: "%s · 我的博客",
  },
  description: "记录技术、生活与思考",
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "我的博客",
  },
  alternates: {
    types: {
      "application/rss+xml": "/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 无 localStorage.theme 时：按用户本机时间 6:00–18:00 浅色，否则深色；与 ThemeToggle 一致
  const themeInit = `(function(){try{var k='theme',t=localStorage.getItem(k),r=document.documentElement;r.classList.remove('light','dark');var mode;if(t==='light'||t==='dark'){mode=t;}else{var h=new Date().getHours();mode=(h>=6&&h<18)?'light':'dark';}r.classList.add(mode);r.dataset.theme=mode;}catch(e){document.documentElement.classList.add('dark');document.documentElement.dataset.theme='dark';}})();`;

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body
        className={`${notoSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <div className="site-bg" aria-hidden />
        <div className="site-bg-glow" aria-hidden />
        {children}
      </body>
    </html>
  );
}
