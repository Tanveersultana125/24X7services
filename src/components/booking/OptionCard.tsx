"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function OptionCard({
  selected,
  onClick,
  children,
  className,
  multi = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  multi?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "group relative flex w-full items-center gap-4 rounded-2xl border-2 bg-surface p-4 text-left transition-colors",
        selected
          ? "border-primary shadow-premium-md"
          : "border-border hover:border-border-strong",
        className
      )}
    >
      {children}
      <span
        className={cn(
          "ml-auto grid size-6 shrink-0 place-items-center rounded-full border-2 transition-all",
          multi ? "rounded-md" : "rounded-full",
          selected ? "border-primary bg-primary text-white" : "border-border-strong bg-transparent"
        )}
      >
        {selected && <Check className="size-3.5" strokeWidth={3} />}
      </span>
    </motion.button>
  );
}
