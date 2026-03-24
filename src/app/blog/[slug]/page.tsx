import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import type { Components } from "react-markdown";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPostBySlug, getAllPosts } from "@/lib/posts";
import {
  absoluteUrl,
  estimateReadMinutes,
  normalizeMarkdownAssetUrl,
} from "@/lib/site";
import CommentsSection from "./CommentsSection";

export const dynamicParams = true;
export const revalidate = 0;

interface Props {
  params: Promise<{ slug: string }>;
}

const markdownComponents: Components = {
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element -- 用户 Markdown 外链与 /uploads 静态资源
    <img
      src={src ? normalizeMarkdownAssetUrl(String(src)) : undefined}
      alt={alt ?? ""}
      className="my-4 max-h-[70vh] w-auto max-w-full rounded-lg border border-[var(--border)] object-contain"
      loading="lazy"
      decoding="async"
    />
  ),
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "未找到" };

  const description =
    post.excerpt?.trim() ||
    post.content.replace(/\s+/g, " ").slice(0, 160).trim();
  const url = absoluteUrl(`/blog/${slug}`);
  const published =
    post.date && !Number.isNaN(new Date(post.date).getTime())
      ? new Date(post.date).toISOString()
      : undefined;

  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      url,
      type: "article",
      publishedTime: published,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  const readMin = estimateReadMinutes(post.content);

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
            <span className="text-[var(--border)]">·</span>
            <span>约 {readMin} 分钟读完</span>
            {post.author && (
              <>
                <span className="text-[var(--border)]">·</span>
                <span>{post.author}</span>
              </>
            )}
          </div>
          <div className="prose mt-10 max-w-none border-t border-[var(--border)] pt-10">
            <ReactMarkdown
              components={markdownComponents}
              urlTransform={(url) => {
                const safe = defaultUrlTransform(url);
                if (safe === "") return safe;
                return normalizeMarkdownAssetUrl(safe);
              }}
            >
              {post.content}
            </ReactMarkdown>
          </div>
        </article>
        <CommentsSection slug={slug} />
      </main>
      <Footer />
    </div>
  );
}
