import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import CommentsSection from "./CommentsSection";

export const dynamicParams = true;
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12 md:py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1 font-mono text-xs text-[var(--accent)] transition hover:text-[var(--accent-hover)]"
        >
          ← 列表
        </Link>
        <article className="mt-8">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] md:text-[2rem] md:leading-tight">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px] text-[var(--muted)]">
            <time>{post.date}</time>
            {post.author && (
              <>
                <span className="text-[var(--border)]">·</span>
                <span>{post.author}</span>
              </>
            )}
          </div>
          <div className="prose mt-10 max-w-none border-t border-[var(--border)] pt-10">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </article>
        <CommentsSection slug={slug} />
      </main>
      <Footer />
    </div>
  );
}
