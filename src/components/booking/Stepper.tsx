"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  label: string;
}

export function Stepper({ steps, current }: { steps: Step[]; current: number }) {
  const progress = (current / (steps.length - 1)) * 100;

  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="relative hidden md:block">
        <div className="absolute left-0 right-0 top-5 h-0.5 rounded-full bg-border" />
        <motion.div
          className="absolute left-0 top-5 h-0.5 rounded-full bg-gradient-to-r from-primary to-accent"
          initial={false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
        <ol className="relative flex justify-between">
          {steps.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={s.id} className="flex flex-col items-center gap-2">
                <motion.div
                  initial={false}
                  animate={{ scale: active ? 1.1 : 1 }}
                  className={cn(
                    "grid size-10 place-items-center rounded-full border-2 text-sm font-bold transition-colors",
                    done && "border-transparent bg-gradient-to-br from-primary to-secondary text-white",
                    active && "border-primary bg-surface text-primary shadow-premium-md",
                    !done && !active && "border-border bg-surface text-muted-2"
                  )}
                >
                  {done ? <Check className="size-5" strokeWidth={3} /> : i + 1}
                </motion.div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    active ? "text-foreground" : "text-muted"
                  )}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-primary">
            Step {current + 1} of {steps.length}
          </span>
          <span className="text-sm font-medium text-muted">{steps[current].label}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            initial={false}
            animate={{ width: `${((current + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
    </div>
  );
}
