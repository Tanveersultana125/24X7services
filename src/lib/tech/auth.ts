import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { getTechnician, pinFingerprint, type Technician } from "@/lib/technicians";

/**
 * The field app's session.
 *
 * The admin cookie can be the word "ok" because it says one thing: you are the
 * admin. This one has to say *which* technician, and a cookie a phone can edit
 * would hand anybody else's jobs — including a customer's address and number —
 * to whoever typed a different id. So it is signed, and it carries a
 * fingerprint of the PIN it was issued against: change that PIN in the panel
 * and every session it opened stops working.
 */

export const TECH_COOKIE = "tech_session";
const MAX_AGE = 60 * 60 * 12; // a shift, plus room to finish the last job

/**
 * Signing key. The service-account key is the one server-only secret this app
 * is guaranteed to have in production; TECH_SESSION_SECRET overrides it where
 * a dedicated one is preferred. With neither — a local run with no env — a
 * per-process key stands in, and sessions simply don't survive a restart.
 */
let fallback: string | null = null;
function secret(): string {
  const configured = process.env.TECH_SESSION_SECRET || process.env.FIREBASE_PRIVATE_KEY;
  if (configured) return configured;
  if (!fallback) {
    fallback = randomBytes(32).toString("hex");
    console.warn(
      "[24X7] tech sessions are signed with a throwaway key — set TECH_SESSION_SECRET " +
        "(or FIREBASE_PRIVATE_KEY) or every restart signs the technicians out.",
    );
  }
  return fallback;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex").slice(0, 32);
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function grantTechSession(id: string): Promise<void> {
  const payload = `${id}:${await pinFingerprint(id)}`;
  const store = await cookies();
  store.set(TECH_COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  });
}

export async function clearTechSession(): Promise<void> {
  const store = await cookies();
  store.delete(TECH_COOKIE);
}

/**
 * Who is signed in, or null.
 *
 * Four things have to hold: the cookie is shaped right, its signature is ours,
 * the technician still exists and is active, and the PIN behind it hasn't been
 * changed since. Any of them failing is simply "signed out".
 */
export async function currentTechnician(): Promise<Technician | null> {
  const raw = (await cookies()).get(TECH_COOKIE)?.value;
  if (!raw) return null;

  const cut = raw.lastIndexOf(".");
  if (cut < 1) return null;
  const payload = raw.slice(0, cut);
  if (!safeEqual(raw.slice(cut + 1), sign(payload))) return null;

  const [id, fingerprint] = payload.split(":");
  if (!id) return null;

  try {
    const tech = await getTechnician(id);
    if (!tech || !tech.active) return null;
    if ((await pinFingerprint(id)) !== fingerprint) return null;
    return tech;
  } catch {
    // The database being unreachable is not proof of a forged cookie, but it is
    // not proof of a good one either — and this guards other people's addresses.
    return null;
  }
}
