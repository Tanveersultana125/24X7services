"use client";

import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "glass" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-primary to-secondary text-white shadow-[0_8px_24px_-6px_rgba(30,136,229,0.6)] hover:shadow-[0_12px_32px_-6px_rgba(30,136,229,0.7)]",
  accent:
    "bg-gradient-to-br from-accent to-success text-white shadow-[0_8px_24px_-6px_rgba(0,200,83,0.55)] hover:shadow-[0_12px_32px_-6px_rgba(0,200,83,0.65)]",
  glass:
    "glass text-foreground hover:bg-surface shadow-premium-sm",
  ghost:
    "text-foreground hover:bg-surface-2",
  outline:
    "border border-border-strong bg-surface/50 text-foreground hover:bg-surface hover:border-primary/50",
  danger:
    "bg-gradient-to-br from-danger to-[#dc2626] text-white shadow-[0_8px_24px_-6px_rgba(239,68,68,0.5)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm gap-1.5",
  md: "h-11 px-6 text-[0.95rem] gap-2",
  lg: "h-12 px-6 text-[0.95rem] gap-2 sm:h-14 sm:px-8 sm:text-base sm:gap-2.5",
};

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
}

const base =
  "relative inline-flex items-center justify-center rounded-full font-semibold tracking-tight transition-all duration-300 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.97]";

type ButtonProps = BaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AnchorProps = BaseProps & { href: string } & Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href"
  >;

export const Button = forwardRef<HTMLButtonElement, ButtonProps | AnchorProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    const classes = cn(base, variants[variant], sizes[size], className);

    if ("href" in props && props.href) {
      const { href, ...rest } = props as AnchorProps;
      return (
        <Link href={href} className={classes} {...rest}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={classes} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
