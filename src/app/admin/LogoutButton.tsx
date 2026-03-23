"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-md px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-400"
    >
      退出
    </button>
  );
}
