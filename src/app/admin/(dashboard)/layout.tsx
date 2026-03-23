import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import LogoutButton from "../LogoutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href="/admin/posts"
            className="text-sm font-semibold tracking-tight text-[var(--foreground)] transition hover:text-[var(--accent)]"
          >
            管理
          </Link>
          <nav className="flex min-w-0 flex-wrap items-center justify-end gap-1 font-mono text-[11px] uppercase tracking-wider">
            <Link
              href="/admin/posts"
              className="rounded-md px-2.5 py-1.5 text-[var(--muted)] transition hover:bg-[var(--accent-dim)] hover:text-[var(--accent)]"
            >
              文章
            </Link>
            <Link
              href="/admin/posts/new"
              className="rounded-md px-2.5 py-1.5 text-[var(--muted)] transition hover:bg-[var(--accent-dim)] hover:text-[var(--accent)]"
            >
              新建
            </Link>
            <Link
              href="/admin/comments"
              className="rounded-md px-2.5 py-1.5 text-[var(--muted)] transition hover:bg-[var(--accent-dim)] hover:text-[var(--accent)]"
            >
              评论
            </Link>
            <Link
              href="/admin/settings"
              className="rounded-md px-2.5 py-1.5 text-[var(--muted)] transition hover:bg-[var(--accent-dim)] hover:text-[var(--accent)]"
            >
              账号
            </Link>
            <Link
              href="/"
              className="rounded-md px-2.5 py-1.5 text-[var(--muted)] transition hover:bg-[var(--accent-dim)] hover:text-[var(--accent)]"
            >
              站点
            </Link>
            <LogoutButton />
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </>
  );
}
