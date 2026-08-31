import { NextResponse } from "next/server";
import { clearTechSession } from "@/lib/tech/auth";

export async function POST() {
  await clearTechSession();
  return NextResponse.json({ ok: true });
}
