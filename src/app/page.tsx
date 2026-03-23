import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllPosts } from "@/lib/posts";

export const revalidate = 0;

export default async function Home() {
  const posts = (await getAllPosts()).slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14 md:py-20">
        <section className="mb-16 md:mb-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
            notes · code · life
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-4xl">
            简洁记录，清晰思考
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
            技术笔记与随笔，界面尽量轻、阅读尽量顺。
          </p>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              最新
            </h2>
            {posts.length > 0 && (
              <Link
                href="/blog"
                className="font-mono text-xs text-[var(--accent)] transition hover:text-[var(--accent-hover)]"
              >
                全部 →
              </Link>
            )}
          </div>
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)]"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-base font-semibold tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)]">
                      {post.title}
                    </h3>
                    <time className="shrink-0 font-mono text-[11px] text-[var(--muted)]">
                      {post.date}
                    </time>
                  </div>
                  {post.excerpt && (
                    <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">
                      {post.excerpt}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
          {posts.length === 0 && (
            <p className="rounded-xl border border-dashed border-[var(--border)] py-12 text-center text-sm text-[var(--muted)]">
              暂无文章，登录后台开始写作。
            </p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
