import { NextResponse } from "next/server";

/**
 * Deployment self-check. Reports whether this server can actually run the
 * auth stack, and why not when it can't.
 *
 * Exists because a runtime that's too old for `firebase-admin` crashes the
 * function before any route handler runs — the response is then an empty 500
 * with nothing in the logs, which is indistinguishable from a bad token.
 * This route deliberately imports firebase-admin lazily so it survives that
 * failure and can name it.
 *
 * Only booleans, names and versions are returned — never a credential value.
 */
export const dynamic = "force-dynamic";

/** firebase-admin@14 declares `engines: { node: ">=22" }`. */
const REQUIRED_NODE_MAJOR = 22;

export async function GET() {
  const nodeVersion = process.version;
  const nodeMajor = Number(nodeVersion.replace(/^v/, "").split(".")[0]) || 0;
  const nodeOk = nodeMajor >= REQUIRED_NODE_MAJOR;

  const env = {
    NEXT_PUBLIC_FIREBASE_API_KEY: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    FIREBASE_PROJECT_ID: Boolean(process.env.FIREBASE_PROJECT_ID),
    FIREBASE_CLIENT_EMAIL: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
    FIREBASE_PRIVATE_KEY: Boolean(process.env.FIREBASE_PRIVATE_KEY),
    ADMIN_EMAILS: Boolean(process.env.ADMIN_EMAILS),
  };

  // A private key pasted with surrounding quotes, or with its \n sequences
  // flattened, is a common and otherwise invisible cause of failure.
  const rawKey = process.env.FIREBASE_PRIVATE_KEY ?? "";
  const privateKeyShape = rawKey
    ? {
        looksWrapped: rawKey.startsWith('"') || rawKey.startsWith("'"),
        hasEscapedNewlines: rawKey.includes("\\n"),
        hasRealNewlines: rawKey.includes("\n"),
        hasPemHeader: rawKey.includes("BEGIN PRIVATE KEY"),
      }
    : null;

  // Load every module the auth routes pull in, one at a time. A route whose
  // static imports throw dies before its handler runs and returns an empty 500,
  // so the only way to find the culprit is to import them individually here.
  const imports: Record<string, string> = {};
  const probe = async (name: string, load: () => Promise<unknown>) => {
    try {
      await load();
      imports[name] = "ok";
    } catch (err) {
      imports[name] = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    }
  };

  await probe("firebase-admin/app", () => import("firebase-admin/app"));
  await probe("firebase-admin/auth", () => import("firebase-admin/auth"));
  await probe("firebase-admin/firestore", () => import("firebase-admin/firestore"));
  await probe("lib/firebase/admin", () => import("@/lib/firebase/admin"));
  await probe("lib/customer/auth", () => import("@/lib/customer/auth"));
  await probe("lib/bookings", () => import("@/lib/bookings"));
  await probe("lib/reviews", () => import("@/lib/reviews"));

  // Initialising the credential is the step that actually touches the private
  // key — a malformed key fails precisely here.
  let credential = "not attempted";
  try {
    const { getAdminAuth } = await import("@/lib/firebase/admin");
    getAdminAuth();
    credential = "ok";
  } catch (err) {
    credential = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }

  const adminSdk = { loaded: imports["firebase-admin/app"] === "ok" };

  const projectsMatch =
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.FIREBASE_PROJECT_ID
      ? null
      : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID === process.env.FIREBASE_PROJECT_ID;

  const problems: string[] = [];
  if (!nodeOk) {
    problems.push(
      `Node ${nodeVersion} is older than the v${REQUIRED_NODE_MAJOR} that firebase-admin requires — ` +
        "set the host's Node.js version to 22.x and redeploy.",
    );
  }
  for (const [name, result] of Object.entries(imports)) {
    if (result !== "ok") problems.push(`import "${name}" failed — ${result}`);
  }
  if (credential !== "ok") problems.push(`Firebase Admin credential failed — ${credential}`);
  for (const [name, present] of Object.entries(env)) {
    if (!present) problems.push(`${name} is not set.`);
  }
  if (projectsMatch === false) {
    problems.push(
      "NEXT_PUBLIC_FIREBASE_PROJECT_ID and FIREBASE_PROJECT_ID name different Firebase projects.",
    );
  }
  if (privateKeyShape && privateKeyShape.looksWrapped) {
    problems.push("FIREBASE_PRIVATE_KEY still has its surrounding quotes — strip them.");
  }
  if (privateKeyShape && !privateKeyShape.hasPemHeader) {
    problems.push("FIREBASE_PRIVATE_KEY doesn't contain a PEM header — it looks truncated.");
  }

  return NextResponse.json({
    ok: problems.length === 0,
    node: { version: nodeVersion, required: `>=${REQUIRED_NODE_MAJOR}`, ok: nodeOk },
    adminSdk,
    imports,
    credential,
    env,
    privateKeyShape,
    projectsMatch,
    problems,
  });
}
