import { cookies } from "next/headers";
import crypto from "node:crypto";

/**
 * Customer authentication via Google OAuth.
 *
 * Sessions are stateless: the user's identity is stored in an HMAC-signed
 * cookie (no database, no extra dependency). Google is the only login method.
 *
 * Required environment variables (see .env.local / README):
 *   GOOGLE_CLIENT_ID       — OAuth 2.0 client ID from Google Cloud Console
 *   GOOGLE_CLIENT_SECRET   — matching client secret
 *   SESSION_SECRET         — random 32+ char string used to sign the cookie
 */

export const CUSTOMER_COOKIE = "customer_session";
export const OAUTH_STATE_COOKIE = "google_oauth_state";

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type CustomerUser = {
  sub: string; // Google account id
  email: string;
  name: string;
  picture?: string;
};

type SessionPayload = CustomerUser & { exp: number };

function isProd() {
  return process.env.NODE_ENV === "production";
}

function sessionSecret() {
  return process.env.SESSION_SECRET ?? "dev-insecure-session-secret-change-me";
}

/** Config for the Google OAuth flow. `configured` is false when env vars are missing. */
export function googleClientConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID ?? "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? "";
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

/** Cookie options shared by the session cookie. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/** Short-lived cookie options for the OAuth state (CSRF) token. */
export function stateCookieOptions() {
  return {
    httpOnly: true,
    secure: isProd(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  };
}

function sign(data: string) {
  return crypto.createHmac("sha256", sessionSecret()).update(data).digest("base64url");
}

/** Serialize a user into a signed `<payload>.<signature>` cookie value. */
export function encodeSession(user: CustomerUser): string {
  const payload: SessionPayload = { ...user, exp: Date.now() + SESSION_MAX_AGE * 1000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

/** Verify and decode a session cookie. Returns null if missing, tampered, or expired. */
export function decodeSession(token: string | undefined): CustomerUser | null {
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString()) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    if (!payload.email || !payload.sub) return null;
    return { sub: payload.sub, email: payload.email, name: payload.name, picture: payload.picture };
  } catch {
    return null;
  }
}

/** Decode the payload of a Google id_token (already trusted — fetched over TLS from Google). */
export function decodeIdToken(idToken: string | undefined): {
  sub?: string;
  email?: string;
  name?: string;
  picture?: string;
} | null {
  if (!idToken) return null;
  const payload = idToken.split(".")[1];
  if (!payload) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

/** Read the current customer session in a Server Component or Route Handler. */
export async function getCustomerSession(): Promise<CustomerUser | null> {
  const store = await cookies();
  return decodeSession(store.get(CUSTOMER_COOKIE)?.value);
}
