import CommentsModeration from "./CommentsModeration";

export default function AdminCommentsPage() {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
        comments
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        评论
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        审核与删除
      </p>
      <CommentsModeration />
    </div>
  );
}
