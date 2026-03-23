export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-[var(--border)]">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.15em] text-[var(--muted)]">
          © {year} · Next.js · minimal
        </p>
      </div>
    </footer>
  );
}
