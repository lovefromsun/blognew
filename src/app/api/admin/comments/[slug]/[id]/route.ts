import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { commentRepository } from "@/lib/repositories/file-comment-repository";
import type { Comment } from "@/lib/types";

interface Params {
  params: Promise<{ slug: string; id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Params) {
  await requireAdmin();
  const { slug, id } = await params;
  const body = await request.json();
  const status = body?.status as Comment["status"] | undefined;
  if (status !== "pending" && status !== "approved" && status !== "rejected") {
    return Response.json({ error: "状态不合法" }, { status: 400 });
  }
  const updated = await commentRepository.updateStatus(slug, id, status);
  if (!updated) {
    return Response.json({ error: "评论不存在" }, { status: 404 });
  }
  return Response.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  await requireAdmin();
  const { slug, id } = await params;
  const ok = await commentRepository.delete(slug, id);
  if (!ok) {
    return Response.json({ error: "评论不存在" }, { status: 404 });
  }
  return Response.json({ ok: true });
}
