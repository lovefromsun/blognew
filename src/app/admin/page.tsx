import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth";

export default async function AdminPage() {
  const ok = await verifyAdminSession();
  redirect(ok ? "/admin/posts" : "/admin/login");
}
