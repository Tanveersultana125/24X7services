import {
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  type Auth,
  type UserCredential,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { createGoogleProvider } from "./client";

/**
 * Signing in with Google, without the popup being able to strand anyone.
 *
 * `signInWithPopup` hears its result back from the sign-in window through
 * storage the two share. When the browser won't give them shared storage, or
 * blocks the script that polls whether the window closed, the promise simply
 * never settles: Google says you are signed in, the window closes, and the
 * page sits on "Signing you in…" for good, with nothing thrown to catch.
 *
 * So the popup gets a deadline. Miss it and the attempt is handed back to the
 * caller as a failure it can report, and this browser is marked as one that
 * does the redirect flow instead — no popup, no window to report back, the
 * whole thing carried on the URL. Browsers that refuse popups outright are
 * sent down the same path immediately.
 */

/** Long enough for a password and a second factor, short enough to not be a hang. */
const POPUP_TIMEOUT_MS = 120_000;

/** This browser has failed a popup before — don't put anyone through it twice. */
const PREFER_REDIRECT_KEY = "24x7:auth-prefer-redirect";
/** A redirect sign-in is in flight, so the page we come back to knows to finish it. */
const PENDING_KEY = "24x7:auth-redirect-pending";

/** Codes that mean this browser won't run the popup at all. */
const NO_POPUP_CODES = new Set([
  "auth/popup-blocked",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);

/** Thrown when the sign-in window never reported back. */
export class PopupTimeoutError extends Error {
  constructor() {
    super("The Google sign-in window didn't report back.");
    this.name = "PopupTimeoutError";
  }
}

function store(kind: "local" | "session"): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    // Storage can be blocked outright — that is itself a popup-hostile browser,
    // but there is nowhere to record it, so every attempt starts fresh.
    return null;
  }
}

function preferRedirect(): boolean {
  return store("local")?.getItem(PREFER_REDIRECT_KEY) === "1";
}

function rememberPopupFailed() {
  store("local")?.setItem(PREFER_REDIRECT_KEY, "1");
}

/** The popup worked after all — stop routing this browser around it. */
function forgetPopupFailure() {
  store("local")?.removeItem(PREFER_REDIRECT_KEY);
}

function withTimeout(promise: Promise<UserCredential>): Promise<UserCredential> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new PopupTimeoutError()), POPUP_TIMEOUT_MS);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Sign in with Google.
 *
 * Resolves with the credential when the popup worked. Resolves with `null`
 * when the browser is being sent down the redirect flow instead — the page is
 * on its way out, so the caller should leave its spinner running and do
 * nothing else. Anything genuinely wrong is thrown, `PopupTimeoutError`
 * included.
 */
export async function signInWithGoogle(auth: Auth): Promise<UserCredential | null> {
  if (preferRedirect()) {
    store("session")?.setItem(PENDING_KEY, "1");
    await signInWithRedirect(auth, createGoogleProvider());
    return null;
  }

  try {
    const credential = await withTimeout(signInWithPopup(auth, createGoogleProvider()));
    forgetPopupFailure();
    return credential;
  } catch (err) {
    const code = err instanceof FirebaseError ? err.code : "";
    if (err instanceof PopupTimeoutError || NO_POPUP_CODES.has(code)) {
      // Next press goes straight to the redirect flow. Not this one: the popup
      // may still be open in front of them, and yanking the page out from
      // under it would look like the site crashed.
      rememberPopupFailed();
    }
    throw err;
  }
}

/**
 * The credential from a redirect sign-in, when the page was loaded on the way
 * back from Google. `null` on an ordinary page load.
 */
export async function pendingGoogleSignIn(auth: Auth): Promise<UserCredential | null> {
  const session = store("session");
  if (session?.getItem(PENDING_KEY) !== "1") return null;
  session.removeItem(PENDING_KEY);
  return getRedirectResult(auth);
}

/** True when the last popup attempt timed out — worth saying so in the UI. */
export function popupIsUnreliable(): boolean {
  return typeof window !== "undefined" && preferRedirect();
}
