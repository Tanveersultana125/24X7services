import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer/auth";
import { adminConfigured } from "@/lib/firebase/admin";
import { recordActivity } from "@/lib/activity";
import type { ActivityEvent } from "@/lib/activity-shared";

/**
 * Take a batch of a visitor's presses and file it under them.
 *
 * Who they are is read from the session cookie and never from the body; the
 * body carries only the browser's own random id, for the trail built before
 * anyone signs in. Everything else the browser sends is treated as a claim to
 * be checked and cut down to size — this endpoint is open to the world, and
 * the panel renders whatever reaches it.
 */

/** A browser id is ours: a uuid we generated. Anything else is not stored. */
const VISITOR = /^[0-9a-f-]{16,64}$/i;

/** One page's worth of clicking. A batch longer than this is not a visitor. */
const MAX_EVENTS = 40;
const MAX_LABEL = 90;
const MAX_PATH = 200;

/**
 * The site's own pages only.
 *
 * A path is what the panel prints beside every row, so it has to be one of
 * ours rather than any string a script could put there.
 */
function cleanPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  return value.slice(0, MAX_PATH);
}

function clean(value: unknown): ActivityEvent[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_EVENTS) return null;
  const now = Date.now();
  const events: ActivityEvent[] = [];
  for (const raw of value) {
    const e = raw as Partial<ActivityEvent>;
    if (e?.kind !== "view" && e?.kind !== "click") return null;
    const path = cleanPath(e.path);
    if (!path) return null;
    // A clock that is wrong, or a timestamp that was made up, would sort the
    // trail into nonsense — anything outside the last day becomes "now".
    const at =
      typeof e.at === "number" && Number.isFinite(e.at) && Math.abs(now - e.at) < 86_400_000
        ? Math.round(e.at)
        : now;
    events.push({
      kind: e.kind,
      path,
      at,
      ...(typeof e.label === "string" && e.label.trim()
        ? { label: e.label.trim().slice(0, MAX_LABEL) }
        : {}),
      // Only our own routes: an outbound or javascript: href says nothing
      // useful here and everything unpleasant in the panel.
      ...(typeof e.href === "string" && cleanPath(e.href) ? { href: cleanPath(e.href)! } : {}),
    });
  }
  return events;
}

export async function POST(request: Request) {
  // Nothing to mirror to. The site works regardless, so this is not an error
  // any visitor should ever be shown.
  if (!adminConfigured()) {
    return NextResponse.json({ ok: false, error: "server_not_configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const events = clean((body as { events?: unknown }).events);
  if (!events) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  const user = await getCustomerSession().catch(() => null);
  const visitor = (body as { visitor?: unknown }).visitor;
  const key = user?.uid ?? (typeof visitor === "string" && VISITOR.test(visitor) ? visitor : null);
  if (!key) {
    return NextResponse.json({ ok: false, error: "no_identity" }, { status: 400 });
  }

  try {
    await recordActivity({
      key,
      uid: user?.uid,
      email: user?.email,
      name: user?.name,
      picture: user?.picture,
      events,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[activity] save failed:", err);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }
}
