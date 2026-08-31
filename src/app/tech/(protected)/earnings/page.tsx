import { redirect } from "next/navigation";
import { Earnings } from "@/components/tech/Earnings";
import { currentTechnician } from "@/lib/tech/auth";
import { listTechnicianBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function TechEarningsPage() {
  const technician = await currentTechnician();
  if (!technician) redirect("/tech/login");

  const jobs = await listTechnicianBookings(technician.id, technician.name).catch(() => []);
  return <Earnings jobs={jobs} />;
}
