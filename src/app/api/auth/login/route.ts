import { NextRequest } from "next/server";
import { setAdminSession } from "@/lib/auth";
import { checkPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    if (!password || typeof password !== "string") {
      return Response.json({ ok: false, error: "请输入密码" }, { status: 400 });
    }
    if (!checkPassword(password)) {
      return Response.json({ ok: false, error: "密码错误" }, { status: 401 });
    }
    await setAdminSession();
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
