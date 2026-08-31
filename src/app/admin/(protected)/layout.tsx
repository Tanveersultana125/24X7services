import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAllBrands } from "@/lib/brands";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/admin/login");
  // Hidden makes included — the sidebar is how you get to one to un-hide it.
  const brands = await getAllBrands();
  return <AdminShell brands={brands}>{children}</AdminShell>;
}
