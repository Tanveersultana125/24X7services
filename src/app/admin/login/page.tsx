import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/admin/auth";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = { title: "Admin · Log in", robots: { index: false } };

export default async function AdminLoginPage() {
  if (await isAuthenticated()) redirect("/admin");

  return (
    /* theme-light: the sign-in screen belongs to the panel, not the site, so a
       visitor's dark mode doesn't follow an admin in here either. */
    <div className="theme-light grid min-h-dvh place-items-center bg-surface-2 px-6 text-ink">
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
