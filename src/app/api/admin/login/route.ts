import { adminPassword, grantSession } from "@/lib/admin/auth";

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || password !== adminPassword()) {
    return Response.json({ ok: false, error: "Incorrect password" }, { status: 401 });
  }
  await grantSession();
  return Response.json({ ok: true });
}
