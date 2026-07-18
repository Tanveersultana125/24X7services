import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = { title: "Admin · Log in", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    <div className="grid min-h-dvh place-items-center bg-surface-2 px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="font-display text-2xl tracking-[-0.02em]">24X7 · Admin</p>
          <p className="mt-2 text-sm text-muted">Sign in to manage bookings & content.</p>
        </div>
        <AdminLoginForm />
      </div>
    </div>
  );
}
