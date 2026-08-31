import { BookingsManager } from "@/components/admin/BookingsManager";
import { listBookings } from "@/lib/bookings";
import { listTechnicians } from "@/lib/technicians";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const [bookings, technicians] = await Promise.all([
    listBookings().catch(() => []),
    listTechnicians(),
  ]);
  return (
    <BookingsManager
      initial={bookings}
      // Only the ones still working can be given a new job; somebody who has
      // left keeps the jobs already in their name.
      technicians={technicians.filter((t) => t.active).map((t) => ({ id: t.id, name: t.name }))}
    />
  );
}
