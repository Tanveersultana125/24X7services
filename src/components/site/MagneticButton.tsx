"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Tone = "royal" | "emerald" | "ghost" | "outline" | "ink";

const tones: Record<Tone, string> = {
  royal: "bg-royal-bright text-white shadow-royal hover:shadow-[0_28px_70px_-16px_rgba(37,71,208,0.6)]",
  emerald: "bg-emerald text-white shadow-emerald",
  ink: "bg-ink text-background hover:opacity-90",
  ghost: "text-ink hover:bg-surface-2",
  outline: "border border-border-strong text-ink hover:border-ink/40 bg-surface/40",
};

interface Props {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  tone?: Tone;
  className?: string;
  strength?: number;
  "aria-label"?: string;
}

export function MagneticButton({
  children,
  href,
  onClick,
  tone = "royal",
  className,
  strength = 0.35,
  ...rest
}: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    setPos({ x, y });
  };

  const classes = cn(
    "group relative inline-flex h-14 items-center justify-center gap-2.5 rounded-full px-8 text-[0.95rem] font-medium tracking-tight transition-[box-shadow,background] duration-500 will-change-transform",
    tones[tone],
    className
  );

  const inner = (
    <motion.span
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos({ x: 0, y: 0 })}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 200, damping: 15, mass: 0.4 }}
      className={classes}
    >
      <motion.span
        className="flex items-center gap-2.5"
        animate={{ x: pos.x * 0.3, y: pos.y * 0.3 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {children}
      </motion.span>
    </motion.span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex" {...rest}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className="inline-flex" {...rest}>
      {inner}
    </button>
  );
}
