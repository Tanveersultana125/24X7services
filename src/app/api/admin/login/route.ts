import { grantSession, isAdminEmail, adminEmails } from "@/lib/admin/auth";
import {
  getAdminAuth,
  adminConfigured,
  projectMismatch,
  describeAuthError,
} from "@/lib/firebase/admin";

/**
 * Admin sign-in via Google. The browser signs in with Firebase and posts its
 * ID token here; we verify it and only grant an admin session when the account's
 * email is on the ADMIN_EMAILS allow-list.
 */
export async function POST(request: Request) {
  if (!adminConfigured()) {
    return Response.json({ ok: false, error: "server_not_configured" }, { status: 503 });
  }

  const mismatch = projectMismatch();
  if (mismatch) {
    console.error(
      `[24X7] admin login: the browser signs into Firebase project "${mismatch.web}" but the ` +
        `service account belongs to "${mismatch.admin}". Every token will be rejected until ` +
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID and FIREBASE_PROJECT_ID name the same project.",
    );
    return Response.json({ ok: false, error: "project_mismatch" }, { status: 500 });
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
      // Which account was refused is the one thing needed to fix this, and the
      // caller just proved they own it — so name it instead of a blank refusal.
      console.warn(
        `[24X7] admin login refused for ${decoded.email ?? "(token carried no email)"} — ` +
          `not in ADMIN_EMAILS (${adminEmails().length} account(s) allowed).`,
      );
      return Response.json(
        { ok: false, error: "not_admin", email: decoded.email ?? null },
        { status: 403 },
      );
    }

    await grantSession();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[24X7] admin token verification failed:", describeAuthError(err));
    return Response.json({ ok: false, error: "invalid_token" }, { status: 401 });
  }
}
