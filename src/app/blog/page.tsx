import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getAllPosts } from "@/lib/posts";

export const revalidate = 0;

export default async function BlogList() {
  const posts = await getAllPosts();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14 md:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
          archive
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--foreground)]">
          全部文章
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {posts.length} 篇
        </p>

        <ul className="mt-10 space-y-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-all hover:border-[var(--accent)]/40 hover:bg-[var(--surface-hover)]"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-base font-semibold tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)]">
                    {post.title}
                  </h2>
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
      </main>
      <Footer />
    </div>
  );
}
