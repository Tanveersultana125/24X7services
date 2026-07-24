"use client";

import Link from "next/link";
import { Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import { Marquee } from "./Marquee";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

const COLUMNS = {
  Services: ["Refrigerator Repair", "Washing Machine Repair", "Microwave Repair", "Oven Repair", "Installation", "Annual Maintenance"],
  Company: ["About Us", "Careers", "Press", "Blog", "Contact"],
  Brands: ["Samsung", "LG", "IFB", "Bosch"],
  Legal: ["Privacy Policy", "Terms of Service", "Refund Policy", "Warranty"],
};

const SOCIALS = [Instagram, Twitter, Linkedin, Youtube];

export function SiteFooter() {
  return (
    <footer className="relative bg-background pt-14 text-foreground sm:pt-16">
      {/* oversized wordmark marquee */}
      <div className="border-b border-hairline pb-14">
        <Marquee fade={false}>
          <span
            className="font-display bg-clip-text px-6 text-[2.6rem] leading-none tracking-tight text-transparent sm:text-[4rem] lg:text-[5rem]"
            style={{ backgroundImage: "linear-gradient(90deg, #4f74ff, #10b981)" }}
          >
            24X7 Services{" "}
            <span style={{ WebkitTextFillColor: "var(--muted)" }}>—</span>
          </span>
          <span
            className="font-display bg-clip-text px-6 text-[2.6rem] leading-none tracking-tight text-transparent sm:text-[4rem] lg:text-[5rem]"
            style={{ backgroundImage: "linear-gradient(90deg, #4f74ff, #10b981)" }}
          >
            24X7 Services{" "}
            <span style={{ WebkitTextFillColor: "var(--muted)" }}>—</span>
          </span>
        </Marquee>
      </div>

      <div className="mx-auto max-w-[92rem] px-6 py-16 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-pretty text-sm leading-relaxed text-muted">
              Telangana&apos;s premium doorstep appliance service. Certified experts, genuine
              parts, and a warranty on every repair — 24×7.
            </p>
            <div className="mt-6 flex gap-2.5">
              {SOCIALS.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social"
                  className="grid size-10 place-items-center rounded-full border border-border text-muted transition-all hover:-translate-y-0.5 hover:border-ink hover:text-foreground"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(COLUMNS).map(([title, links], i) => (
              // Nudge the right mobile column (odd index) slightly right; no change from sm up.
              <div key={title} className={cn(i % 2 === 1 && "pl-16 sm:pl-0")}>
                <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">{title}</h4>
                <ul className="mt-5 space-y-3">
                  {links.map((l) => (
                    <li key={l}>
                      <Link href="#" className="text-sm text-muted transition-colors hover:text-foreground">
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 sm:mt-16 flex flex-col items-center justify-between gap-4 border-t border-hairline pt-8 text-sm text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} 24X7 Services Pvt. Ltd.</p>
          <p>Designed &amp; built in Hyderabad.</p>
        </div>
      </div>
    </footer>
  );
}
