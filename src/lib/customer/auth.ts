import { cookies } from "next/headers";
import { getAdminAuth } from "@/lib/firebase/admin";

/**
 * Customer authentication via Firebase (Google Sign-In).
 *
 * The browser signs in with Firebase and posts its ID token to
 * /api/auth/session, where the Admin SDK mints a session cookie. Server
 * Components and Route Handlers verify that cookie with `getCustomerSession()`.
 */

export const CUSTOMER_COOKIE = "customer_session";

/** Session lifetime. Firebase allows up to 14 days for a session cookie. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export type CustomerUser = {
  uid: string;
  email: string;
  name: string;
  picture?: string;
};

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

/** Verify the session cookie and return the customer, or null if unauthenticated. */
export async function getCustomerSession(): Promise<CustomerUser | null> {
  const cookie = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!cookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(cookie);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: (decoded.name as string | undefined) ?? decoded.email ?? "Customer",
      picture: decoded.picture as string | undefined,
    };
  } catch {
    return null;
  }
}
