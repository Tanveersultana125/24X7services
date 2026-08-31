import { NextResponse } from "next/server";
import { grantTechSession } from "@/lib/tech/auth";
import { verifyTechnicianPin } from "@/lib/technicians";

/**
 * Field sign-in: a phone number and a PIN.
 *
 * Technicians do not have work email addresses and are signing in on a phone
 * between jobs, so Google's flow — which is what the office uses — is the wrong
 * door for them. The office issues the PIN and can change it.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const phone = typeof body?.phone === "string" ? body.phone : "";
  const pin = typeof body?.pin === "string" ? body.pin : "";

  if (!phone.trim() || !pin.trim()) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  try {
    const tech = await verifyTechnicianPin(phone, pin);
    if (!tech) {
      // Which half was wrong is not said — an answer that distinguishes them
      // is an answer that confirms who works here.
      return NextResponse.json({ ok: false, error: "bad_credentials" }, { status: 401 });
    }
    await grantTechSession(tech.id);
    return NextResponse.json({ ok: true, name: tech.name });
  } catch (err) {
    console.error("[tech/login] failed:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
