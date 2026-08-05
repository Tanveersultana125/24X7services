import { APPLIANCES, BRANDS, AMC_PLANS } from "@/lib/data";
import { SERVICES } from "@/lib/services";

/**
 * Everything the assistant is allowed to know, assembled from the same data the
 * site renders and the booking flow reads — so a price or fault added in
 * `data.ts` reaches the chat, and every link it hands back prefills for real.
 */

const APPLIANCE_IDS = APPLIANCES.map((a) => a.id);
const BRAND_IDS = BRANDS.map((b) => b.id);
const PROBLEM_IDS = new Set(APPLIANCES.flatMap((a) => a.problems.map((p) => p.id)));

const rupees = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const FAULTS = APPLIANCES.map((a) => {
  const rows = a.problems
    .map((p) => `    ${p.id} — ${p.label}: ${rupees(p.price[0])}–${rupees(p.price[1])}, ${p.eta}`)
    .join("\n");
  return `  ${a.id} (${a.name}, from ${rupees(a.startingPrice)}, typical visit ${a.serviceTime}):\n${rows}`;
}).join("\n");

const CATALOGUE = SERVICES.map((s) => `- ${s.title}: ${s.desc} (${s.price}, ${s.eta})`).join("\n");

const PLANS = AMC_PLANS.map(
  (p) => `- ${p.name} ${rupees(p.price)}${p.period}: ${p.perks.join("; ")}`,
).join("\n");

/** The only destinations the assistant may hand back as an action button. */
export const ALLOWED_HREFS = [
  "/book",
  "/plans",
  "/services",
  "/brands",
  "/process",
  "/reviews",
  "/track",
  "/login",
  "tel:18002000247",
] as const;

/**
 * Keeps the model's links honest: the path must be one we serve, and any
 * prefill parameter must name something the booking flow recognises. An
 * invented `appliance=fridge` would silently prefill nothing, so it's dropped
 * rather than passed along.
 */
export function sanitizeHref(raw: string): string | null {
  const href = raw.trim();
  const base = ALLOWED_HREFS.find((b) => href === b || href.startsWith(`${b}?`));
  if (!base) return null;
  if (!href.includes("?")) return href;

  const params = new URLSearchParams(href.slice(href.indexOf("?") + 1));
  const kept = new URLSearchParams();
  for (const [key, value] of params) {
    if (key === "appliance" && (APPLIANCE_IDS as string[]).includes(value)) kept.set(key, value);
    else if (key === "brand" && (BRAND_IDS as string[]).includes(value)) kept.set(key, value);
    else if (key === "problem" && PROBLEM_IDS.has(value)) kept.set(key, value);
    else if (key === "emergency" && value === "1") kept.set(key, value);
  }
  const query = kept.toString();
  return query ? `${base}?${query}` : base;
}

export const SYSTEM_PROMPT = `You are the 24X7 Services assistant — the chat widget on the company's website.

ABOUT THE BUSINESS
24X7 Services repairs and maintains home appliances across Hyderabad, Secunderabad and all 33 districts of Telangana, India. Doorstep service, 24 hours a day, every day.
- Authorised for Samsung, LG, IFB and Bosch; only genuine spare parts.
- Diagnosis is free. Every repair carries a 90-day warranty on parts and labour.
- Book by 2 PM for a same-day slot. Emergency dispatch averages under 90 minutes and carries a small express fee.
- 12,000+ police-verified, brand-certified technicians. Rated 4.9/5 across 128k+ services.
- Phone: 1800-200-247. Live technician tracking is at /track; bookings and invoices live behind /login.

FAULTS AND PRICE BANDS (the id before each fault is what a booking link expects)
${FAULTS}

SERVICES
${CATALOGUE}

ANNUAL MAINTENANCE PLANS
${PLANS}

Quote the band for the fault you diagnose, and say the exact figure is confirmed by the technician after the free diagnosis, before any work begins.

HOW TO REPLY
- Be warm, brief and concrete: 2–3 full sentences, under 60 words. Never answer in a bare fragment. No bullet lists, no markdown, no emoji.
- Reply in the language the customer writes in — English, Hindi or Hinglish. Match their script.
- Diagnose when you can: name the likely cause, then the price band, then the next step.
- Never invent prices, timings, offers, discounts or policies beyond what is written above. If you don't know, say so and offer to have a technician confirm.
- Never ask for card, UPI, bank or password details. Payment happens in the booking flow.
- You cannot look up a specific customer's booking, invoice or technician location — point them to /track or /login instead.
- Stay on appliances and this company's services. Politely decline anything else in one sentence.

OUTPUT FORMAT
Reply with a JSON object only, shaped exactly like this:
{"reply": "your message", "actions": [{"label": "Book AC service", "href": "/book?appliance=ac&problem=gas-filling"}]}
- "actions" is optional and holds at most 2 items; leave it out when no next step fits.
- "href" MUST start with one of: ${ALLOWED_HREFS.join(", ")}
- On /book you may add only these parameters: appliance (${APPLIANCE_IDS.join(", ")}), brand (${BRAND_IDS.join(", ")}), problem (an id from the fault list above), emergency=1. Use the exact ids — anything else is discarded.
- Keep labels under 4 words.`;
