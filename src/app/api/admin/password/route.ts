import { NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/auth";
import { changeAdminPassword } from "@/lib/admin-credentials";

export async function POST(request: NextRequest) {
  const ok = await verifyAdminSession();
  if (!ok) {
    return Response.json({ ok: false, error: "未登录" }, { status: 401 });
  }

  let body: { oldPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "请求格式错误" }, { status: 400 });
  }

  const oldPassword = body.oldPassword;
  const newPassword = body.newPassword;
  if (typeof oldPassword !== "string" || typeof newPassword !== "string") {
    return Response.json({ ok: false, error: "请填写当前密码与新密码" }, { status: 400 });
  }

  const result = changeAdminPassword(oldPassword, newPassword);
  if (!result.ok) {
    return Response.json({ ok: false, error: result.error }, { status: 400 });
  }

  return Response.json({
    ok: true,
    message: "密码已更新，请使用新密码重新登录",
  });
}
