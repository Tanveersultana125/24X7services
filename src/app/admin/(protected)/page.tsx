import { Overview } from "@/components/admin/Overview";
import { listBookings, listCustomers } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const [bookings, customers] = await Promise.all([
    listBookings().catch(() => []),
    listCustomers().catch(() => []),
  ]);
  return <Overview bookings={bookings} customerCount={customers.length} />;
}
