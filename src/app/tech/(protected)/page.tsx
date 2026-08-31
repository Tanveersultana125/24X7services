import { redirect } from "next/navigation";
import { JobBoard } from "@/components/tech/JobBoard";
import { currentTechnician } from "@/lib/tech/auth";
import { listTechnicianBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function TechJobsPage() {
  const technician = await currentTechnician();
  if (!technician) redirect("/tech/login");

  // An unreachable database shows an empty day rather than an error page —
  // the technician can still sign out and try again from the road.
  const jobs = await listTechnicianBookings(technician.id, technician.name).catch(() => []);
  return <JobBoard jobs={jobs} />;
}
