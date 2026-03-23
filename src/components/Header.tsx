import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2 text-[var(--foreground)] transition-colors hover:text-[var(--accent)]"
        >
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            log
          </span>
          <span className="text-sm font-semibold tracking-tight">我的博客</span>
        </Link>
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <nav className="flex items-center gap-1 font-mono text-xs uppercase tracking-wider">
            <Link
              href="/"
              className="rounded-md px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--accent-dim)] hover:text-[var(--accent)] sm:px-3"
            >
              首页
            </Link>
            <Link
              href="/blog"
              className="rounded-md px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--accent-dim)] hover:text-[var(--accent)] sm:px-3"
            >
              文章
            </Link>
            <Link
              href="/admin"
              className="rounded-md px-2.5 py-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--accent-dim)] hover:text-[var(--accent)] sm:px-3"
            >
              管理
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
