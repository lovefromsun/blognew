"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Comment } from "@/lib/types";

interface Props {
  slug: string;
}

interface CommentListResponse {
  items: Comment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface CaptchaChallenge {
  question: string;
  token: string;
}

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function CommentsSection({ slug }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const apiUrl = useMemo(() => `/api/comments/${encodeURIComponent(slug)}`, [slug]);

  async function loadComments(targetPage = page) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiUrl}?page=${targetPage}&pageSize=5`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("获取评论失败");
      const data = (await response.json()) as CommentListResponse;
      setComments(Array.isArray(data.items) ? data.items : []);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadCaptcha() {
    try {
      const response = await fetch("/api/comments/captcha", { cache: "no-store" });
      if (!response.ok) throw new Error("加载验证码失败");
      const data = (await response.json()) as CaptchaChallenge;
      setCaptchaQuestion(data.question);
      setCaptchaToken(data.token);
      setCaptchaAnswer("");
    } catch {
      setCaptchaQuestion("");
      setCaptchaToken("");
    }
  }

  useEffect(() => {
    loadComments(1);
    loadCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author,
          content,
          captchaToken,
          captchaAnswer,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error((data?.error as string) || "提交失败");
      setAuthor("");
      setContent("");
      setSuccess((data?.message as string) || "提交成功");
      await loadCaptcha();
      await loadComments(1);
    } catch (e) {
      setError((e as Error).message);
      await loadCaptcha();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-14 border-t border-[var(--border)] pt-10">
      <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
        评论
      </h2>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]"
            htmlFor="comment-author"
          >
            昵称
          </label>
          <input
            id="comment-author"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            className="input-tech"
            maxLength={50}
            required
          />
        </div>
        <div>
          <label
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]"
            htmlFor="comment-content"
          >
            内容
          </label>
          <textarea
            id="comment-content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            className="input-tech min-h-24 resize-y"
            maxLength={1000}
            required
          />
        </div>
        <div>
          <label
            className="mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-[var(--muted)]"
            htmlFor="comment-captcha"
          >
            验证 · {captchaQuestion || "…"}
          </label>
          <input
            id="comment-captcha"
            value={captchaAnswer}
            onChange={(event) => setCaptchaAnswer(event.target.value)}
            className="input-tech font-mono"
            inputMode="numeric"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !captchaToken}
          className="btn-primary"
        >
          {submitting ? "提交中…" : "发布"}
        </button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-red-400">{error}</p>
      )}
      {success && (
        <p className="mt-4 text-sm text-emerald-400">{success}</p>
      )}

      <div className="mt-8 space-y-3">
        {loading ? (
          <p className="font-mono text-xs text-[var(--muted)]">加载中…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">暂无评论。</p>
        ) : (
          comments.map((comment) => (
            <article
              key={comment.id}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <strong className="text-sm text-[var(--foreground)]">
                  {comment.author}
                </strong>
                <time className="font-mono text-[10px] text-[var(--muted)]">
                  {formatDate(comment.createdAt)}
                </time>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-[var(--foreground)]/90">
                {comment.content}
              </p>
            </article>
          ))
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => loadComments(page - 1)}
          className="btn-ghost"
        >
          上一页
        </button>
        <span className="font-mono text-xs text-[var(--muted)]">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={loading || page >= totalPages}
          onClick={() => loadComments(page + 1)}
          className="btn-ghost"
        >
          下一页
        </button>
      </div>
    </section>
  );
}
