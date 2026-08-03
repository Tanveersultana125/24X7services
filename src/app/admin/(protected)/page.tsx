import { Overview } from "@/components/admin/Overview";
import { listBookings, listCustomers } from "@/lib/bookings";
import { listReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [bookings, customers, reviews] = await Promise.all([
    listBookings().catch(() => []),
    listCustomers().catch(() => []),
    listReviews().catch(() => []),
  ]);
  return <Overview bookings={bookings} customerCount={customers.length} reviews={reviews} />;
}
