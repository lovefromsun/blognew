import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";
import ThemeToggle from "@/components/ThemeToggle";

export default async function AdminLoginPage() {
  const ok = await verifyAdminSession();
  if (ok) redirect("/admin/posts");

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-[0_0_0_1px_var(--glow)] backdrop-blur-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
          admin
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          登录
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">输入管理员密码</p>
        <AdminLoginForm />
        <Link
          href="/"
          className="mt-6 block text-center font-mono text-xs text-[var(--accent)] transition hover:text-[var(--accent-hover)]"
        >
          ← 首页
        </Link>
      </div>
    </div>
  );
}
