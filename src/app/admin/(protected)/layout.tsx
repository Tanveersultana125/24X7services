import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  return <AdminShell>{children}</AdminShell>;
}
