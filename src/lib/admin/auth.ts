import { cookies } from "next/headers";

export const ADMIN_COOKIE = "admin_session";
const SESSION_VALUE = "ok";

/** Shared admin password. Set ADMIN_PASSWORD in .env.local for production. */
export function adminPassword() {
  return process.env.ADMIN_PASSWORD ?? "admin123";
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
