import { createCaptchaChallenge } from "@/lib/comment-captcha";

export const dynamic = "force-dynamic";

export async function GET() {
  const challenge = await createCaptchaChallenge();
  return Response.json(challenge);
}
