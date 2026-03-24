import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

function extFromMime(mime: string): string {
  const m: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return m[mime] || "bin";
}

export async function POST(request: NextRequest) {
  const ok = await verifyAdminSession();
  if (!ok) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "无效的表单" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return Response.json({ error: "请选择文件" }, { status: 400 });
  }

  const type = file.type || "";
  if (!ALLOWED.has(type)) {
    return Response.json(
      { error: "仅支持 JPEG、PNG、GIF、WebP" },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return Response.json({ error: "单张图片不超过 5MB" }, { status: 400 });
  }

  const ext = extFromMime(type);
  const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  const fsPath = path.join(dir, name);
  await writeFile(fsPath, buf);

  const url = `/uploads/${name}`;
  return Response.json({ ok: true, url });
}
