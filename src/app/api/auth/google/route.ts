import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { OAUTH_STATE_COOKIE, googleClientConfig, stateCookieOptions } from "@/lib/customer/auth";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";

/** Kick off the Google OAuth flow: set a CSRF state cookie and redirect to Google. */
export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const { clientId, configured } = googleClientConfig();

  if (!configured) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "config");
    return NextResponse.redirect(loginUrl);
  }

  const state = crypto.randomBytes(16).toString("hex");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  const res = NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  res.cookies.set(OAUTH_STATE_COOKIE, state, stateCookieOptions());
  return res;
}
