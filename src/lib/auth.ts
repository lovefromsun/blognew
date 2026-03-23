import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours

function getSecret(): string {
  const secret =
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    (process.env.NODE_ENV === "development" ? "dev-secret-change-in-production" : "");
  if (!secret || secret.length < 8) {
    throw new Error("请设置 ADMIN_PASSWORD 或 ADMIN_SECRET 环境变量");
  }
  return secret;
}

function getPassword(): string {
  const pwd = process.env.ADMIN_PASSWORD;
  if (!pwd) {
    if (process.env.NODE_ENV === "development") {
      return "admin123"; // 开发环境默认密码，生产环境必须设置
    }
    throw new Error("请设置 ADMIN_PASSWORD 环境变量");
  }
  return pwd;
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
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
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
  return password === getPassword();
}
