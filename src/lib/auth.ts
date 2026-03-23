import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  getSessionSecretForSigning,
  hasCredentialFile,
  verifyPasswordAgainstFile,
} from "./admin-credentials";

const ADMIN_COOKIE = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret(): string {
  return getSessionSecretForSigning();
}

function getPasswordFromEnv(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) {
    if (process.env.NODE_ENV === "development") {
      return "admin123";
    }
    throw new Error("请设置 ADMIN_PASSWORD 环境变量");
  }
  return pwd.trim();
}

export async function setAdminSession() {
  const secret = getSecret();
  const payload = JSON.stringify({ t: Date.now(), v: 1 });
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret.slice(0, 32).padEnd(32, "0")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  const token = `${Buffer.from(payload).toString("base64url")}.${Buffer.from(sig).toString("base64url")}`;
  const cookieStore = await cookies();
  // 生产环境若写死 secure: true，用 http://IP 访问时浏览器不会保存 Cookie，登录会“成功但立刻掉线”。
  // 仅在「对外是 HTTPS」时启用 Secure（依赖 Nginx 的 X-Forwarded-Proto）。
  const hdrs = await headers();
  const proto = (hdrs.get("x-forwarded-proto") || "")
    .split(",")[0]
    ?.trim()
    .toLowerCase();
  const forwardedHttps = proto === "https";
  const forceInsecure =
    process.env.ADMIN_COOKIE_INSECURE === "1" ||
    process.env.ALLOW_HTTP_ADMIN === "1";
  const secure =
    process.env.NODE_ENV === "production" &&
    !forceInsecure &&
    forwardedHttps;

  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return false;

  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return false;

  try {
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr);
    if (Date.now() - payload.t > SESSION_MAX_AGE * 1000) return false;

    const secret = getSecret();
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret.slice(0, 32).padEnd(32, "0")),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const expectedSig = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payloadStr)
    );
    const expected = new Uint8Array(expectedSig);
    const actual = new Uint8Array(Buffer.from(sigB64, "base64url"));
    if (expected.length !== actual.length) return false;
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] !== actual[i]) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function requireAdmin() {
  const ok = await verifyAdminSession();
  if (!ok) redirect("/admin/login");
}

export function checkPassword(password: string): boolean {
  const trimmed = password.trim();
  if (hasCredentialFile()) {
    return verifyPasswordAgainstFile(trimmed);
  }
  try {
    return trimmed === getPasswordFromEnv();
  } catch {
    return false;
  }
}
