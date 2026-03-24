"use client";

import { useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Post } from "@/lib/types";

interface Props {
  initial?: Post;
}

export default function PostEditor({ initial }: Props) {
  const isEdit = !!initial;
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(
    initial?.date ?? new Date().toISOString().slice(0, 10)
  );
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function insertAtCursor(insert: string) {
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + insert);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setContent((prev) => prev.slice(0, start) + insert + prev.slice(end));
    requestAnimationFrame(() => {
      const pos = start + insert.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  }

  async function handleImageFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; url?: string };
      if (!res.ok || !data.url) {
        setError(data.error || "上传失败");
        return;
      }
      const base = file.name.replace(/\.[^.]+$/, "") || "图片";
      const md = `\n\n![${base}](${data.url})\n\n`;
      insertAtCursor(md);
    } catch {
      setError("上传失败");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const url = isEdit
        ? `/api/posts/${encodeURIComponent(initial!.slug)}`
        : "/api/posts";
      const method = isEdit ? "PUT" : "POST";
      const body = isEdit
        ? { title, date, excerpt, author, content }
        : { slug: slug || undefined, title, date, excerpt, author, content };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "保存失败");
        return;
      }
      router.push("/admin/posts");
      router.refresh();
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      {!isEdit && (
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">
            Slug（URL 标识，仅支持英文、数字、横线）
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-post"
            className="input-tech mt-1"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">
          标题
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="input-tech mt-1"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">
            日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-tech mt-1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)]">
            作者
          </label>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="博主"
            className="input-tech mt-1"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--foreground)]">
          摘要
        </label>
        <input
          type="text"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="文章摘要，用于列表展示"
          className="input-tech mt-1"
        />
      </div>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="block text-sm font-medium text-[var(--foreground)]">
            正文（Markdown）
          </label>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={handleImageFile}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="btn-ghost text-xs"
            >
              {uploading ? "上传中…" : "插入图片"}
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-[var(--muted)]">
          支持 JPEG / PNG / GIF / WebP，单张不超过 5MB；上传后会插入{" "}
          <code className="font-mono text-[11px]">![说明](/uploads/…)</code>
        </p>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={16}
          required
          className="input-tech mt-1 min-h-[20rem] font-mono text-sm"
        />
      </div>
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      <div className="flex gap-3">
        <button type="submit" disabled={loading} className="btn-primary px-5 py-2">
          {loading ? "保存中…" : "保存"}
        </button>
        <Link href="/admin/posts" className="btn-ghost px-5 py-2">
          取消
        </Link>
      </div>
    </form>
  );
}
