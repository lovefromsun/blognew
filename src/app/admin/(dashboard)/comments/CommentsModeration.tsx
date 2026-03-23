"use client";

import { useEffect, useState } from "react";
import type { Comment } from "@/lib/types";

interface CommentListResponse {
  items: Comment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

type StatusFilter = "all" | "pending" | "approved" | "rejected";

const statusLabel: Record<StatusFilter, string> = {
  all: "全部",
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回",
};

export default function CommentsModeration() {
  const [items, setItems] = useState<Comment[]>([]);
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);

  async function loadComments(targetPage = page, targetStatus = status) {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/comments?page=${targetPage}&pageSize=20&status=${targetStatus}`,
        { cache: "no-store" }
      );
      const data = (await response.json()) as CommentListResponse;
      setItems(Array.isArray(data.items) ? data.items : []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadComments(1, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function updateStatus(comment: Comment, nextStatus: Comment["status"]) {
    setWorkingId(comment.id);
    try {
      await fetch(
        `/api/admin/comments/${encodeURIComponent(comment.postSlug)}/${encodeURIComponent(comment.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      await loadComments(page, status);
    } finally {
      setWorkingId(null);
    }
  }

  async function deleteComment(comment: Comment) {
    if (!confirm("确定删除这条评论吗？")) return;
    setWorkingId(comment.id);
    try {
      await fetch(
        `/api/admin/comments/${encodeURIComponent(comment.postSlug)}/${encodeURIComponent(comment.id)}`,
        { method: "DELETE" }
      );
      await loadComments(page, status);
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label
          htmlFor="comments-status"
          className="font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]"
        >
          筛选
        </label>
        <select
          id="comments-status"
          value={status}
          onChange={(event) => setStatus(event.target.value as StatusFilter)}
          className="input-tech w-auto py-2 text-sm"
        >
          {(["all", "pending", "approved", "rejected"] as StatusFilter[]).map((key) => (
            <option key={key} value={key}>
              {statusLabel[key]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="font-mono text-xs text-[var(--muted)]">加载中…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--border)] py-10 text-center text-sm text-[var(--muted)]">
          暂无
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((comment) => (
            <article
              key={comment.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <div>
                  <strong className="text-[var(--foreground)]">{comment.author}</strong>
                  <span className="ml-2 font-mono text-[11px] text-[var(--muted)]">
                    /{comment.postSlug}
                  </span>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
                  {comment.status}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]/90">
                {comment.content}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => updateStatus(comment, "approved")}
                  disabled={workingId === comment.id}
                  className="btn-ghost border-emerald-500/40 py-1 text-xs text-emerald-400 disabled:opacity-50"
                >
                  通过
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(comment, "rejected")}
                  disabled={workingId === comment.id}
                  className="btn-ghost border-amber-500/40 py-1 text-xs text-amber-400 disabled:opacity-50"
                >
                  驳回
                </button>
                <button
                  type="button"
                  onClick={() => updateStatus(comment, "pending")}
                  disabled={workingId === comment.id}
                  className="btn-ghost py-1 text-xs disabled:opacity-50"
                >
                  待审
                </button>
                <button
                  type="button"
                  onClick={() => deleteComment(comment)}
                  disabled={workingId === comment.id}
                  className="rounded-lg border border-red-500/40 px-3 py-1 text-xs text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
                >
                  删除
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => loadComments(page - 1, status)}
          disabled={loading || page <= 1}
          className="btn-ghost"
        >
          上一页
        </button>
        <span className="font-mono text-xs text-[var(--muted)]">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => loadComments(page + 1, status)}
          disabled={loading || page >= totalPages}
          className="btn-ghost"
        >
          下一页
        </button>
      </div>
    </div>
  );
}
