import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TechShell } from "@/components/tech/TechShell";
import { currentTechnician } from "@/lib/tech/auth";

export const metadata: Metadata = { title: "Field app", robots: { index: false } };

export default async function ProtectedTechLayout({ children }: { children: React.ReactNode }) {
  const technician = await currentTechnician();
  if (!technician) redirect("/tech/login");
  return <TechShell technician={technician}>{children}</TechShell>;
}
