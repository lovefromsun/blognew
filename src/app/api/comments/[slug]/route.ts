import { NextRequest } from "next/server";
import { postRepository } from "@/lib/repositories/file-post-repository";
import { commentRepository } from "@/lib/repositories/file-comment-repository";
import { verifyCaptcha } from "@/lib/comment-captcha";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 3;
const DEFAULT_SENSITIVE_WORDS = ["赌博", "色情", "诈骗", "辱骂", "反动"];

function validateInput(author: unknown, content: unknown) {
  const trimmedAuthor = typeof author === "string" ? author.trim() : "";
  const trimmedContent = typeof content === "string" ? content.trim() : "";
  if (!trimmedAuthor || !trimmedContent) {
    return { ok: false as const, error: "姓名和评论内容不能为空" };
  }
  if (trimmedAuthor.length > 50) {
    return { ok: false as const, error: "姓名不能超过 50 个字符" };
  }
  if (trimmedContent.length > 1000) {
    return { ok: false as const, error: "评论内容不能超过 1000 个字符" };
  }
  return {
    ok: true as const,
    author: trimmedAuthor,
    content: trimmedContent,
  };
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  return "unknown";
}

function getSensitiveWords(): string[] {
  const configured = process.env.COMMENT_SENSITIVE_WORDS?.trim();
  if (!configured) return DEFAULT_SENSITIVE_WORDS;
  return configured
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function containsSensitiveWords(content: string): boolean {
  const words = getSensitiveWords();
  const normalized = content.toLowerCase();
  return words.some((word) => normalized.includes(word.toLowerCase()));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const page = Number(request.nextUrl.searchParams.get("page") || "1");
  const pageSize = Number(request.nextUrl.searchParams.get("pageSize") || "10");
  const result = await commentRepository.getByPostSlug(slug, { page, pageSize });
  return Response.json(result);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await postRepository.getBySlug(slug);
  if (!post) {
    return Response.json({ error: "文章不存在" }, { status: 404 });
  }

  const body = await request.json();
  const validated = validateInput(body.author, body.content);
  if (!validated.ok) {
    return Response.json({ error: validated.error }, { status: 400 });
  }

  const captchaOk = await verifyCaptcha(body.captchaToken, body.captchaAnswer);
  if (!captchaOk) {
    return Response.json({ error: "验证码错误或已过期" }, { status: 400 });
  }

  const ip = getClientIp(request);
  const recentCount = await commentRepository.countRecentByIp(
    slug,
    ip,
    RATE_LIMIT_WINDOW_MS
  );
  if (recentCount >= RATE_LIMIT_MAX) {
    return Response.json(
      { error: "评论过于频繁，请稍后再试" },
      { status: 429 }
    );
  }

  const hasSensitiveWords = containsSensitiveWords(validated.content);
  const comment = await commentRepository.create({
    postSlug: slug,
    author: validated.author,
    content: validated.content,
    ip,
    status: hasSensitiveWords ? "rejected" : "pending",
  });
  return Response.json(
    {
      ...comment,
      message: hasSensitiveWords
        ? "评论含敏感词，已自动拦截"
        : "评论已提交，管理员审核后可见",
    },
    { status: 201 }
  );
}
