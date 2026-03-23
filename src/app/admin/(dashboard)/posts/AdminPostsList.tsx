"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { PostMeta } from "@/lib/types";

export default function AdminPostsList() {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/posts");
    const data = await res.json();
    setPosts(Array.isArray(data) ? data : []);
  }

  useEffect(() => {
    load();
    setLoading(false);
  }, []);

  async function handleDelete(slug: string) {
    if (!confirm(`确定要删除「${slug}」吗？`)) return;
    setDeleting(slug);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setPosts((p) => p.filter((x) => x.slug !== slug));
      } else {
        const data = await res.json();
        alert(data.error || "删除失败");
      }
    } catch {
      alert("删除失败");
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="mt-8 font-mono text-xs text-[var(--muted)]">加载中…</div>
    );
  }

  return (
    <div className="mt-8">
      <Link href="/admin/posts/new" className="btn-primary mb-6 inline-flex text-sm">
        + 新建
      </Link>
      <ul className="space-y-3">
        {posts.length === 0 ? (
          <li className="rounded-xl border border-dashed border-[var(--border)] py-12 text-center text-sm text-[var(--muted)]">
            暂无文章
          </li>
        ) : (
          posts.map((post) => (
            <li
              key={post.slug}
              className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)]/35"
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={`/admin/posts/${post.slug}/edit`}
                  className="font-medium text-[var(--foreground)] transition hover:text-[var(--accent)]"
                >
                  {post.title}
                </Link>
                <p className="mt-1 truncate font-mono text-[11px] text-[var(--muted)]">
                  {post.slug} · {post.date}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Link
                  href={`/admin/posts/${post.slug}/edit`}
                  className="btn-ghost py-1.5 text-xs"
                >
                  编辑
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(post.slug)}
                  disabled={deleting === post.slug}
                  className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  {deleting === post.slug ? "…" : "删"}
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
