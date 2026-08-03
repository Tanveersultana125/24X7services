import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthenticated } from "@/lib/admin/auth";
import { deleteReview, updateReviewStatus, type ReviewStatus } from "@/lib/reviews";

const STATUSES: ReviewStatus[] = ["pending", "published", "hidden"];

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
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
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
    return NextResponse.json({ ok: false, error: "delete_failed" }, { status: 500 });
  }
}
