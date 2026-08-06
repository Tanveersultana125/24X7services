"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Editorial line-by-line reveal. Pass an array of lines; each rises with a soft
 * clip, staggered. Use for large display headings.
 */
export function TextReveal({
  lines,
  className,
  delay = 0,
  as: Tag = "h2",
}: {
  lines: React.ReactNode[];
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  return (
    <Tag className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.16em] -mb-[0.1em] pt-[0.02em]">
          <motion.span
            className="block"
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.9, delay: delay + i * 0.09, ease: [0.16, 1, 0.3, 1] }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      /* Light keeps the editorial rule and quiet capitals. Dark sets the label
         inside the brand tile — same gradient, lit top edge and glow as the
         mark — because on a black page quiet grey capitals read as a caption
         that got lost. */
      className={cn(
        "inline-flex items-center gap-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-muted",
        "dark:relative dark:overflow-hidden dark:rounded-full dark:bg-gradient-to-br dark:from-primary dark:to-secondary dark:px-4 dark:py-1.5 dark:font-bold dark:tracking-[0.24em] dark:text-white dark:shadow-[0_8px_20px_-8px_rgba(30,136,229,0.65)]",
        className
      )}
    >
      <span aria-hidden className="h-px w-8 bg-border-strong dark:hidden" />
      {/* the mark's sheen, stretched across the pill */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-0.5 hidden h-1/3 rounded-full bg-white/35 blur-[3px] dark:block"
      />
      <span className="relative">{children}</span>
    </motion.span>
  );
}
