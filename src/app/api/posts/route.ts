import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { postRepository } from "@/lib/repositories/file-post-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  const posts = await postRepository.getAll();
  return Response.json(posts);
}

export async function POST(request: NextRequest) {
  await requireAdmin();
  try {
    const body = await request.json();
    const slug =
      (body.slug as string)?.replace(/[^a-zA-Z0-9-_]/g, "") ||
      Date.now().toString();
    const post = await postRepository.create({
      slug,
      title: body.title || "未命名",
      date: body.date || new Date().toISOString().slice(0, 10),
      excerpt: body.excerpt,
      author: body.author,
      content: body.content || "",
    });
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${slug}`);
    return Response.json(post);
  } catch (e) {
    return Response.json(
      { error: (e as Error).message },
      { status: 400 }
    );
  }
}
