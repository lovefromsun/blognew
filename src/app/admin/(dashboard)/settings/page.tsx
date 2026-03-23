import type { Metadata } from "next";
import PasswordForm from "./PasswordForm";

export const metadata: Metadata = {
  title: "账号与安全 · 管理",
};

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
          security
        </p>
        <h1 className="mt-2 text-xl font-semibold tracking-tight text-[var(--foreground)]">
          管理员密码
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          在此修改登录密码，无需改服务器环境变量（首次仍依赖已配置的
          <code className="mx-1 font-mono text-[11px]">ADMIN_PASSWORD</code>
          ）。
        </p>
      </div>
      <PasswordForm />
    </div>
  );
}
