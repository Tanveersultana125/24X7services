import { NextResponse } from "next/server";
import {
  getAdminAuth,
  adminConfigured,
  projectMismatch,
  describeAuthError,
} from "@/lib/firebase/admin";
import {
  CUSTOMER_COOKIE,
  SESSION_MAX_AGE,
  sessionCookieOptions,
  getCustomerSession,
} from "@/lib/customer/auth";
import { upsertCustomer } from "@/lib/bookings";

/**
 * Who is signed in, for Client Components that can't read the httpOnly cookie.
 *
 * The nav lives on statically prerendered pages, so it asks here after
 * hydration rather than forcing every one of those pages to render per-request.
 */
export async function GET() {
  const user = await getCustomerSession().catch(() => null);
  return NextResponse.json(
    { user: user ? { name: user.name, email: user.email, picture: user.picture } : null },
    { headers: { "Cache-Control": "no-store" } },
  );
}

/**
 * Exchange a freshly-minted Firebase ID token for an httpOnly session cookie.
 * Called by the login page right after Google sign-in succeeds in the browser.
 */
export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 503 });
  }

  const mismatch = projectMismatch();
  if (mismatch) {
    console.error(
      `[24X7] session: the browser signs into Firebase project "${mismatch.web}" but the ` +
        `service account belongs to "${mismatch.admin}". Every token will be rejected until ` +
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID and FIREBASE_PROJECT_ID name the same project.",
    );
    return NextResponse.json({ ok: false, error: "project_mismatch" }, { status: 500 });
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

    // Record the customer so they show up in the admin panel (best-effort —
    // never block sign-in if Firestore is momentarily unavailable).
    await upsertCustomer({
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: (decoded.name as string | undefined) ?? decoded.email ?? "Customer",
      picture: decoded.picture as string | undefined,
    }).catch(() => {});

    const res = NextResponse.json({ ok: true });
    res.cookies.set(CUSTOMER_COOKIE, sessionCookie, sessionCookieOptions());
    return res;
  } catch (err) {
    // A bare `invalid_token` hid real causes here — a service account missing the
    // Service Account Token Creator role fails only at createSessionCookie, and
    // looks identical to a bad token from the outside. Log the code, and separate
    // "your token is bad" from "this server can't mint sessions".
    const code = (err as { code?: string })?.code ?? "";
    console.error("[24X7] session exchange failed:", describeAuthError(err));

    if (code.includes("insufficient-permission") || code.includes("internal-error")) {
      return NextResponse.json({ ok: false, error: "session_mint_failed" }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }
}
