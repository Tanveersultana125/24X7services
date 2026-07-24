import { grantSession, isAdminEmail } from "@/lib/admin/auth";
import { getAdminAuth, adminConfigured } from "@/lib/firebase/admin";

/**
 * Admin sign-in via Google. The browser signs in with Firebase and posts its
 * ID token here; we verify it and only grant an admin session when the account's
 * email is on the ADMIN_EMAILS allow-list.
 */
export async function POST(request: Request) {
  if (!adminConfigured()) {
    return Response.json({ ok: false, error: "server_not_configured" }, { status: 503 });
  }

  const { idToken } = await request.json().catch(() => ({ idToken: "" }));
  if (typeof idToken !== "string" || !idToken) {
    return Response.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);

    // Token must be fresh (signed in within the last 5 minutes).
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return Response.json({ ok: false, error: "stale_token" }, { status: 401 });
    }

    if (!isAdminEmail(decoded.email)) {
      return Response.json({ ok: false, error: "not_admin" }, { status: 403 });
    }

    await grantSession();
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }
}
