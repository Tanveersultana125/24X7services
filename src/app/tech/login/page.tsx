import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TechLoginForm } from "@/components/tech/TechLoginForm";
import { currentTechnician } from "@/lib/tech/auth";

export const metadata: Metadata = { title: "Technician sign-in", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TechLoginPage() {
  // Already signed in — the login page is not somewhere to land twice.
  if (await currentTechnician()) redirect("/tech");
  return <TechLoginForm />;
}
