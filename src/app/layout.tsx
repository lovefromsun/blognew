import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
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
  title: "我的博客",
  description: "记录技术、生活与思考",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeInit = `(function(){try{var k='theme',t=localStorage.getItem(k),r=document.documentElement;r.classList.remove('light','dark');if(t==='light'||t==='dark'){r.classList.add(t);r.dataset.theme=t;}else{r.classList.add('dark');r.dataset.theme='dark';}}catch(e){document.documentElement.classList.add('dark');}})();`;

  return (
    <html lang="zh-CN" className="dark" suppressHydrationWarning>
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
