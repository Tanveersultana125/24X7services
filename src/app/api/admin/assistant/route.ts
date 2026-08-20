import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin/auth";
import { panelSnapshot } from "@/lib/admin/snapshot";
import { GROQ_MODEL } from "@/lib/ai/assistant";

/**
 * The panel's assistant.
 *
 * The office already has every number on these screens; what it does not have
 * is a way to ask a question that crosses two of them — how many air
 * conditioners are booked for tomorrow, what people are adding and not
 * booking, whether last week was busier than this one. It reads a snapshot of
 * the panel's own figures and answers from that and nothing else.
 *
 * Behind the admin session, because the snapshot is the business's own
 * numbers. The snapshot itself carries no personal detail — see
 * `panelSnapshot` for why that matters when the text leaves for a model
 * somebody else runs.
 */
export const dynamic = "force-dynamic";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const MAX_TURNS = 10;
const MAX_CHARS = 600;
const TIMEOUT_MS = 25_000;

const SYSTEM = `You are the assistant inside the admin panel of 24X7 Services, an
appliance repair company in Telangana, India. You answer the person running the
business.

Everything you know is in the SNAPSHOT below. Answer only from it.

Rules:
- If the snapshot does not contain the answer, say so plainly and name the page
  of the panel that would have it: Overview, Bookings, Baskets, Customers,
  Activity, Services & prices, Gallery, Site images, or Reviews.
- Never invent a figure. Quote the numbers as they are.
- The snapshot holds no customer names, phones, emails or addresses. If asked
  for one, say it is not something you are given and point at Bookings or
  Customers, where it is on screen.
- Prices are Indian rupees. Write them as ₹1,234.
- Be brief: two or three sentences, or a short list. No preamble, no sign-off.`;

type Turn = { role: "user" | "assistant"; content: string };

function parseTurns(input: unknown): Turn[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  const turns: Turn[] = [];
  for (const raw of input.slice(-MAX_TURNS)) {
    if (!raw || typeof raw !== "object") return null;
    const { role, content } = raw as Record<string, unknown>;
    if (role !== "user" && role !== "assistant") return null;
    if (typeof content !== "string" || !content.trim()) return null;
    turns.push({ role, content: content.slice(0, MAX_CHARS) });
  }
  return turns.at(-1)?.role === "user" ? turns : null;
}

export async function POST(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const turns =
    body && typeof body === "object" ? parseTurns((body as Record<string, unknown>).messages) : null;
  if (!turns) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  let snapshot: string;
  try {
    snapshot = await panelSnapshot(Date.now());
  } catch (err) {
    console.error("[admin assistant] snapshot failed:", err);
    return NextResponse.json({ ok: false, error: "no_data" }, { status: 503 });
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: GROQ_MODEL,
        // Low, because every answer here is meant to be a figure off a screen
        // rather than a turn of phrase.
        temperature: 0.1,
        max_tokens: 400,
        messages: [
          { role: "system", content: `${SYSTEM}\n\nSNAPSHOT\n${snapshot}` },
          ...turns,
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("[admin assistant] groq responded", res.status, (await res.text()).slice(0, 500));
      return NextResponse.json({ ok: false, error: "upstream_failed" }, { status: 502 });
    }

    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) {
      return NextResponse.json({ ok: false, error: "empty_reply" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, text });
  } catch (err) {
    console.error("[admin assistant] request failed:", err);
    return NextResponse.json({ ok: false, error: "upstream_failed" }, { status: 502 });
  }
}
