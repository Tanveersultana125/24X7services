import { notFound, redirect } from "next/navigation";
import { JobDetail } from "@/components/tech/JobDetail";
import { currentTechnician } from "@/lib/tech/auth";
import { listTechnicianBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export default async function TechJobPage({ params }: { params: Promise<{ id: string }> }) {
  const technician = await currentTechnician();
  if (!technician) redirect("/tech/login");

  const { id } = await params;
  // Found within their own list rather than fetched by id: a job that isn't
  // theirs should read as one that doesn't exist, not as one they can't open.
  const jobs = await listTechnicianBookings(technician.id, technician.name).catch(() => []);
  const job = jobs.find((j) => j.id === id);
  if (!job) notFound();

  return <JobDetail job={job} />;
}
