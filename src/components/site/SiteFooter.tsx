"use client";

import Link from "next/link";
import { Instagram, Twitter, Linkedin, Youtube } from "lucide-react";
import { Marquee } from "./Marquee";
import { Logo } from "@/components/ui/Logo";

const COLUMNS = {
  Services: ["Refrigerator Repair", "Washing Machine Repair", "Microwave Repair", "Oven Repair", "Installation", "Annual Maintenance"],
  Company: ["About Us", "Careers", "Press", "Blog", "Contact"],
  Brands: ["Samsung", "LG", "IFB", "Bosch"],
  Legal: ["Privacy Policy", "Terms of Service", "Refund Policy", "Warranty"],
};

const SOCIALS = [Instagram, Twitter, Linkedin, Youtube];

export function SiteFooter() {
  return (
    <footer className="relative bg-[#08080a] pt-24 text-white">
      {/* oversized wordmark marquee */}
      <div className="border-b border-white/10 pb-14">
        <Marquee fade={false}>
          <span
            className="font-display bg-clip-text px-6 text-[2.6rem] leading-none tracking-tight text-transparent sm:text-[4rem] lg:text-[5rem]"
            style={{ backgroundImage: "linear-gradient(90deg, #4f74ff, #10b981)" }}
          >
            24X7 Services{" "}
            <span style={{ WebkitTextFillColor: "rgba(255,255,255,0.15)" }}>—</span>
          </span>
          <span
            className="font-display bg-clip-text px-6 text-[2.6rem] leading-none tracking-tight text-transparent sm:text-[4rem] lg:text-[5rem]"
            style={{ backgroundImage: "linear-gradient(90deg, #4f74ff, #10b981)" }}
          >
            24X7 Services{" "}
            <span style={{ WebkitTextFillColor: "rgba(255,255,255,0.15)" }}>—</span>
          </span>
        </Marquee>
      </div>

      <div className="mx-auto max-w-[92rem] px-6 py-16 sm:px-10">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2.6fr]">
          <div>
            <div className="[&_*]:text-white">
              <Logo />
            </div>
            <p className="mt-5 max-w-xs text-pretty text-sm leading-relaxed text-white/50">
              India&apos;s premium doorstep appliance service. Certified experts, genuine
              parts, and a warranty on every repair — 24×7.
            </p>
            <div className="mt-6 flex gap-2.5">
              {SOCIALS.map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Social"
                  className="grid size-10 place-items-center rounded-full border border-white/15 text-white/60 transition-all hover:-translate-y-0.5 hover:border-white/40 hover:text-white"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {Object.entries(COLUMNS).map(([title, links]) => (
              <div key={title}>
                <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">{title}</h4>
                <ul className="mt-5 space-y-3">
                  {links.map((l) => (
                    <li key={l}>
                      <Link href="#" className="text-sm text-white/70 transition-colors hover:text-white">
                        {l}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/40 sm:flex-row">
          <p>© {new Date().getFullYear()} 24X7 Services Pvt. Ltd.</p>
          <p>Designed &amp; built in India.</p>
        </div>
      </div>
    </footer>
  );
}
