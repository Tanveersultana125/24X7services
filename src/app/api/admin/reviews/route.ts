import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import { deleteReview, updateReviewStatus, type ReviewStatus } from "@/lib/reviews";

const STATUSES: ReviewStatus[] = ["pending", "published", "hidden"];

/**
 * The panel used to show a bare "couldn't do that", leaving the reason only in
 * the server log — which nobody watching the browser can read. The caller here
 * is an authenticated admin, so they get the actual message.
 */
function reason(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}

/** Pages that render the published review wall. */
function refreshPublicPages() {
  revalidatePath("/");
  revalidatePath("/reviews");
}

/** Approve, hide, or unpublish a review. Admin session required. */
export async function PATCH(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id;
  const status = body?.status;

  if (typeof id !== "string" || !id || !STATUSES.includes(status as ReviewStatus)) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await updateReviewStatus(id, status as ReviewStatus);
    refreshPublicPages();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/reviews] update failed:", err);
    return NextResponse.json({ ok: false, error: "update_failed", detail: reason(err) }, { status: 500 });
  }
}

/** Permanently remove a review. Admin session required. */
export async function DELETE(request: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ ok: false, error: "unauthenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ ok: false, error: "invalid_payload" }, { status: 400 });
  }

  try {
    await deleteReview(id);
    refreshPublicPages();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/reviews] delete failed:", err);
    return NextResponse.json({ ok: false, error: "delete_failed", detail: reason(err) }, { status: 500 });
  }
}
