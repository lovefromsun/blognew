import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-[var(--border)]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">
          <span>
            © {year} · Next.js · minimal
          </span>
          <span className="text-[var(--border)]" aria-hidden>
            ·
          </span>
          <Link
            href="/feed.xml"
            className="transition hover:text-[var(--accent)]"
          >
            RSS
          </Link>
          <span className="text-[var(--border)]" aria-hidden>
            ·
          </span>
          <Link
            href="/sitemap.xml"
            className="transition hover:text-[var(--accent)]"
          >
            Sitemap
          </Link>
        </p>
      </div>
    </footer>
  );
}
