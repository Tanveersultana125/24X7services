"use client";

import { useState } from "react";

/**
 * A number input that lets you clear it.
 *
 * A plain `value={someNumber}` box can never be empty: clearing it parses to 0,
 * the 0 is written straight back, and the next digit lands after it — type
 * 2520 into a cleared price and you get 02520. So while the box has focus it
 * shows exactly what was typed, including nothing at all, and only on blur does
 * it snap back to the stored number.
 */
export function NumberField({
  value,
  onValue,
  /** Reported when the box is left empty. */
  empty = 0,
  className,
  ...rest
}: {
  value: number;
  onValue: (value: number) => void;
  empty?: number;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "type">) {
  const [typing, setTyping] = useState<string | null>(null);

  return (
    <input
      {...rest}
      type="number"
      inputMode="numeric"
      value={typing ?? String(value)}
      onChange={(e) => {
        const raw = e.target.value;
        setTyping(raw);
        if (raw === "") return onValue(empty);
        const n = Number(raw);
        if (Number.isFinite(n)) onValue(n);
      }}
      onBlur={(e) => {
        setTyping(null);
        rest.onBlur?.(e);
      }}
      className={className}
    />
  );
}
