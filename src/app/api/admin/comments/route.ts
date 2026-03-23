import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { commentRepository } from "@/lib/repositories/file-comment-repository";
import type { Comment } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const page = Number(request.nextUrl.searchParams.get("page") || "1");
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") || "20");
  const rawStatus = request.nextUrl.searchParams.get("status");
  const status: Comment["status"] | "all" =
    rawStatus === "pending" || rawStatus === "approved" || rawStatus === "rejected"
      ? rawStatus
      : "all";
  const result = await commentRepository.listRecentForAdmin({ page, pageSize, status });
  return Response.json(result);
}
