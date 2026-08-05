import { NextResponse } from "next/server";
import { SYSTEM_PROMPT, sanitizeHref } from "@/lib/ai/assistant";

/**
 * The assistant's brain. Talks to Groq's OpenAI-compatible chat endpoint with
 * the site's own service catalogue as context, and hands back a message plus
 * up to two in-site action links.
 *
 * The key never reaches the browser — the widget posts here, this route calls
 * Groq. When GROQ_API_KEY is missing or Groq fails, the response says so and
 * the widget falls back to its built-in replies rather than showing an error.
 */
export const dynamic = "force-dynamic";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/** Enough history for the assistant to follow a thread, short enough to stay cheap. */
const MAX_TURNS = 12;
const MAX_CHARS = 1000;
const TIMEOUT_MS = 20_000;

/** Best-effort throttle. Per instance only — it slows abuse, it doesn't stop it. */
const RATE_LIMIT = { windowMs: 60_000, max: 20 };
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string, now: number): boolean {
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
    // The map would otherwise grow for the life of the instance.
    if (hits.size > 5000) {
      for (const [key, value] of hits) if (now > value.resetAt) hits.delete(key);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT.max;
}

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

type Action = { label: string; href: string };

/**
 * The model is asked for JSON, but a stray sentence around it is always
 * possible — fall back to treating the whole reply as the message.
 */
function readReply(content: string): { text: string; actions?: Action[] } {
  const start = content.indexOf("{");
  const end = content.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      const parsed = JSON.parse(content.slice(start, end + 1)) as Record<string, unknown>;
      const text = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
      if (text) {
        const actions = Array.isArray(parsed.actions)
          ? parsed.actions
              .filter((a): a is Record<string, unknown> => Boolean(a) && typeof a === "object")
              .map((a) => ({
                label: String(a.label ?? "").trim(),
                // A link the site doesn't serve would 404, and an unknown
                // prefill would quietly do nothing — both are stripped here.
                href: sanitizeHref(String(a.href ?? "")),
              }))
              .filter((a): a is Action => Boolean(a.label && a.href))
              .slice(0, 2)
          : [];
        return actions.length ? { text, actions } : { text };
      }
    } catch {
      // fall through to the raw text
    }
  }
  return { text: content.trim() };
}

export async function POST(request: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip, Date.now())) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const turns = body && typeof body === "object" ? parseTurns((body as Record<string, unknown>).messages) : null;
  if (!turns) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...turns],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    if (!res.ok) {
      // Groq's error body names the cause (bad key, unknown model, quota).
      console.error("[chat] groq responded", res.status, (await res.text()).slice(0, 500));
      return NextResponse.json({ ok: false, error: "upstream_failed" }, { status: 502 });
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ ok: false, error: "empty_reply" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, ...readReply(content) });
  } catch (err) {
    console.error("[chat] request failed:", err);
    return NextResponse.json({ ok: false, error: "upstream_failed" }, { status: 502 });
  }
}
