function getCaptchaSecret(): string {
  return (
    process.env.COMMENT_CAPTCHA_SECRET ||
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "dev-captcha-secret"
  );
}

async function signPayload(payload: string): Promise<string> {
  const secret = getCaptchaSecret();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret.slice(0, 32).padEnd(32, "0")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return Buffer.from(sig).toString("base64url");
}

export interface CaptchaChallenge {
  question: string;
  token: string;
}

export async function createCaptchaChallenge(): Promise<CaptchaChallenge> {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const payload = JSON.stringify({
    a,
    b,
    e: Date.now() + 5 * 60 * 1000,
  });
  const signature = await signPayload(payload);
  return {
    question: `${a} + ${b} = ?`,
    token: `${Buffer.from(payload).toString("base64url")}.${signature}`,
  };
}

export async function verifyCaptcha(token: string, answer: unknown): Promise<boolean> {
  if (typeof token !== "string" || typeof answer !== "string") return false;
  const [payloadB64, sig] = token.split(".");
  if (!payloadB64 || !sig) return false;
  const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
  const expected = await signPayload(payload);
  if (expected !== sig) return false;

  try {
    const parsed = JSON.parse(payload) as { a: number; b: number; e: number };
    if (Date.now() > parsed.e) return false;
    const expectedAnswer = parsed.a + parsed.b;
    return Number(answer.trim()) === expectedAnswer;
  } catch {
    return false;
  }
}
