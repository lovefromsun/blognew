import AdminPostsList from "./AdminPostsList";

export default function AdminPostsPage() {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
        posts
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">
        文章
      </h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        管理、编辑、删除
      </p>
      <AdminPostsList />
    </div>
  );
}
