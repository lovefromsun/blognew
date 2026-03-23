"use client";

import { FormEvent, useState } from "react";

export default function PasswordForm() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("新密码至少 8 位");
      return;
    }
    if (newPassword !== confirm) {
      setError("两次输入的新密码不一致");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "修改失败");
        return;
      }
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
      alert(data.message || "已更新，请重新登录");
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="max-w-md space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
    >
      <div>
        <label className="block text-xs font-medium text-[var(--muted)]">
          当前密码
        </label>
        <input
          type="password"
          autoComplete="current-password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--muted)]">
          新密码（至少 8 位）
        </label>
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          required
          minLength={8}
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[var(--muted)]">
          确认新密码
        </label>
        <input
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          required
          minLength={8}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-foreground)] transition hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "保存中…" : "保存新密码"}
      </button>
      <p className="text-xs leading-relaxed text-[var(--muted)]">
        修改成功后会话将失效，需用新密码重新登录。密码以加密形式保存在服务器文件（默认{" "}
        <code className="font-mono text-[11px]">/var/data/blog-admin.json</code>
        ），不会进入 Git 仓库。
      </p>
    </form>
  );
}
