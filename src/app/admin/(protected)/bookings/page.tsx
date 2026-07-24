import { BookingsManager } from "@/components/admin/BookingsManager";
import { listBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const bookings = await listBookings().catch(() => []);
  return <BookingsManager initial={bookings} />;
}
