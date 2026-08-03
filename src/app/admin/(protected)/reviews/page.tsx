import { ReviewsManager } from "@/components/admin/ReviewsManager";
import { listReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const reviews = await listReviews().catch(() => []);
  return <ReviewsManager initial={reviews} />;
}
