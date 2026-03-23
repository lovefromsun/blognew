import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { postRepository } from "@/lib/repositories/file-post-repository";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await postRepository.getBySlug(slug);
  if (!post) {
    return Response.json({ error: "文章不存在" }, { status: 404 });
  }
  return Response.json(post);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await requireAdmin();
  const { slug } = await params;
  const body = await request.json();
  const post = await postRepository.update(slug, {
    title: body.title,
    date: body.date,
    excerpt: body.excerpt,
    author: body.author,
    content: body.content,
  });
  if (!post) {
    return Response.json({ error: "文章不存在" }, { status: 404 });
  }
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  return Response.json(post);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  await requireAdmin();
  const { slug } = await params;
  const ok = await postRepository.delete(slug);
  if (!ok) {
    return Response.json({ error: "文章不存在或删除失败" }, { status: 404 });
  }
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
  return Response.json({ ok: true });
}
