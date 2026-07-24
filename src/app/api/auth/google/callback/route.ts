import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  CUSTOMER_COOKIE,
  OAUTH_STATE_COOKIE,
  decodeIdToken,
  encodeSession,
  googleClientConfig,
  sessionCookieOptions,
} from "@/lib/customer/auth";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Google redirects here with a `code`. Exchange it for an id_token and start a session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const loginUrl = new URL("/login", origin);
  const fail = (reason: string) => {
    loginUrl.searchParams.set("error", reason);
    return NextResponse.redirect(loginUrl);
  };

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const store = await cookies();
  const savedState = store.get(OAUTH_STATE_COOKIE)?.value;

  if (oauthError) return fail("google");
  if (!code || !state || !savedState || state !== savedState) return fail("state");

  const { clientId, clientSecret, configured } = googleClientConfig();
  if (!configured) return fail("config");

  let idToken: string | undefined;
  try {
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return fail("token");
    const tokens = (await tokenRes.json()) as { id_token?: string };
    idToken = tokens.id_token;
  } catch {
    return fail("token");
  }

  const claims = decodeIdToken(idToken);
  if (!claims?.email || !claims.sub) return fail("token");

  const res = NextResponse.redirect(new URL("/dashboard", origin));
  res.cookies.set(
    CUSTOMER_COOKIE,
    encodeSession({
      sub: claims.sub,
      email: claims.email,
      name: claims.name ?? claims.email,
      picture: claims.picture,
    }),
    sessionCookieOptions(),
  );
  res.cookies.delete(OAUTH_STATE_COOKIE);
  return res;
}
