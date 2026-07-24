import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";
const SESSION_VALUE = "ok";

/** Google accounts allowed into the admin panel (from ADMIN_EMAILS). */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** True when the given Google email is on the admin allow-list. */
export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return adminEmails().includes(email.toLowerCase());
}

export async function isAuthenticated() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === SESSION_VALUE;
}

export async function grantSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
