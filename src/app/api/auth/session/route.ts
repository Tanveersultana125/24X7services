import { NextResponse } from "next/server";
import { getAdminAuth, adminConfigured } from "@/lib/firebase/admin";
import { CUSTOMER_COOKIE, SESSION_MAX_AGE, sessionCookieOptions } from "@/lib/customer/auth";

/**
 * Exchange a freshly-minted Firebase ID token for an httpOnly session cookie.
 * Called by the login page right after Google sign-in succeeds in the browser.
 */
export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 503 });
  }

  const { idToken } = await request.json().catch(() => ({ idToken: "" }));
  if (typeof idToken !== "string" || !idToken) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  try {
    const auth = getAdminAuth();
    // Reject stale tokens — must have been issued in the last 5 minutes.
    const decoded = await auth.verifyIdToken(idToken);
    if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
      return NextResponse.json({ ok: false, error: "stale_token" }, { status: 401 });
    }

    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000,
    });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(CUSTOMER_COOKIE, sessionCookie, sessionCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }
}
