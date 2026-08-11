import { ReviewsManager } from "@/components/admin/ReviewsManager";
import { listReviews, type Review } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  // "None yet" and "couldn't read them" look identical to whoever is standing
  // in front of the screen, so they must not be the same answer here.
  let reviews: Review[];
  let failure: string | null = null;
  try {
    reviews = await listReviews();
  } catch (err) {
    console.error("[admin/reviews] couldn't list reviews:", err);
    reviews = [];
    failure = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
  }

  return <ReviewsManager initial={reviews} failure={failure} />;
}
