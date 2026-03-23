import fs from "fs/promises";
import path from "path";
import type { Comment, CreateCommentInput } from "@/lib/types";

const defaultCommentsDirectory = path.join(process.cwd(), "content/comments");

function getCommentsDirectory(): string {
  const configured = process.env.COMMENTS_DIR?.trim();
  if (!configured) return defaultCommentsDirectory;
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

function slugToFileName(slug: string): string {
  return `${slug.replace(/[^a-zA-Z0-9-_]/g, "")}.json`;
}

interface StoredComment extends Comment {
  ip: string;
}

function normalizeComment(raw: unknown): StoredComment | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<StoredComment>;
  if (
    typeof value.id !== "string" ||
    typeof value.postSlug !== "string" ||
    typeof value.author !== "string" ||
    typeof value.content !== "string" ||
    typeof value.createdAt !== "string" ||
    typeof value.ip !== "string"
  ) {
    return null;
  }
  const normalizedStatus =
    value.status === "pending" || value.status === "approved" || value.status === "rejected"
      ? value.status
      : "approved";
  return {
    id: value.id,
    postSlug: value.postSlug,
    author: value.author,
    content: value.content,
    createdAt: value.createdAt,
    status: normalizedStatus,
    ip: value.ip,
  };
}

function sanitizeForPublic(comment: StoredComment): Comment {
  return {
    id: comment.id,
    postSlug: comment.postSlug,
    author: comment.author,
    content: comment.content,
    createdAt: comment.createdAt,
    status: comment.status,
  };
}

export interface CommentListResult {
  items: Comment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface ListOptions {
  includeUnapproved?: boolean;
  page?: number;
  pageSize?: number;
}

export class FileCommentRepository {
  private async ensureDir() {
    await fs.mkdir(getCommentsDirectory(), { recursive: true });
  }

  private getFilePath(postSlug: string): string {
    return path.join(getCommentsDirectory(), slugToFileName(postSlug));
  }

  private async readByPostSlug(postSlug: string): Promise<StoredComment[]> {
    const filePath = this.getFilePath(postSlug);
    try {
      const text = await fs.readFile(filePath, "utf8");
      const parsed = JSON.parse(text) as unknown[];
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => normalizeComment(item))
        .filter((item): item is StoredComment => item !== null)
        .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    } catch {
      return [];
    }
  }

  async getByPostSlug(postSlug: string, options: ListOptions = {}): Promise<CommentListResult> {
    const includeUnapproved = options.includeUnapproved ?? false;
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 10));
    const all = await this.readByPostSlug(postSlug);
    const filtered = includeUnapproved
      ? all
      : all.filter((item) => item.status === "approved");
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const normalizedPage = Math.min(page, totalPages);
    const start = (normalizedPage - 1) * pageSize;
    const items = filtered
      .slice(start, start + pageSize)
      .map((item) => sanitizeForPublic(item));
    return { items, total, page: normalizedPage, pageSize, totalPages };
  }

  async listRecentForAdmin(options: { page?: number; pageSize?: number; status?: Comment["status"] | "all" } = {}): Promise<CommentListResult> {
    const page = Math.max(1, options.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 20));
    let files: string[] = [];
    try {
      files = await fs.readdir(getCommentsDirectory());
    } catch {
      return { items: [], total: 0, page: 1, pageSize, totalPages: 1 };
    }

    const all: StoredComment[] = [];
    for (const name of files) {
      if (!name.endsWith(".json")) continue;
      const slug = name.replace(/\.json$/, "");
      const comments = await this.readByPostSlug(slug);
      all.push(...comments);
    }
    all.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    const filtered =
      options.status && options.status !== "all"
        ? all.filter((item) => item.status === options.status)
        : all;

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const normalizedPage = Math.min(page, totalPages);
    const start = (normalizedPage - 1) * pageSize;
    const items = filtered
      .slice(start, start + pageSize)
      .map((item) => sanitizeForPublic(item));
    return { items, total, page: normalizedPage, pageSize, totalPages };
  }

  async create(input: CreateCommentInput): Promise<Comment> {
    await this.ensureDir();
    const safeSlug = input.postSlug.replace(/[^a-zA-Z0-9-_]/g, "");
    const comment: StoredComment = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      postSlug: safeSlug,
      author: input.author,
      content: input.content,
      createdAt: new Date().toISOString(),
      status: input.status ?? "pending",
      ip: input.ip,
    };
    const existing = await this.readByPostSlug(safeSlug);
    const next = [comment, ...existing];
    await fs.writeFile(this.getFilePath(safeSlug), JSON.stringify(next, null, 2), "utf8");
    return sanitizeForPublic(comment);
  }

  async updateStatus(postSlug: string, commentId: string, status: Comment["status"]) {
    const safeSlug = postSlug.replace(/[^a-zA-Z0-9-_]/g, "");
    const existing = await this.readByPostSlug(safeSlug);
    const target = existing.find((item) => item.id === commentId);
    if (!target) return null;
    target.status = status;
    await fs.writeFile(this.getFilePath(safeSlug), JSON.stringify(existing, null, 2), "utf8");
    return sanitizeForPublic(target);
  }

  async delete(postSlug: string, commentId: string): Promise<boolean> {
    const safeSlug = postSlug.replace(/[^a-zA-Z0-9-_]/g, "");
    const existing = await this.readByPostSlug(safeSlug);
    const next = existing.filter((item) => item.id !== commentId);
    if (next.length === existing.length) return false;
    await fs.writeFile(this.getFilePath(safeSlug), JSON.stringify(next, null, 2), "utf8");
    return true;
  }

  async countRecentByIp(postSlug: string, ip: string, windowMs: number): Promise<number> {
    const safeSlug = postSlug.replace(/[^a-zA-Z0-9-_]/g, "");
    const comments = await this.readByPostSlug(safeSlug);
    const cutoff = Date.now() - windowMs;
    return comments.filter(
      (item) =>
        item.ip === ip &&
        new Date(item.createdAt).getTime() >= cutoff
    ).length;
  }
}

export const commentRepository = new FileCommentRepository();
