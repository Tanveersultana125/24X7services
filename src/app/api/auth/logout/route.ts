import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE } from "@/lib/customer/auth";

/** Clear the customer session and return home. */
export async function POST(request: Request) {
  const origin = new URL(request.url).origin;
  const res = NextResponse.redirect(new URL("/", origin), { status: 303 });
  res.cookies.delete(CUSTOMER_COOKIE);
  return res;
}
