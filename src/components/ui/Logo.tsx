import { cn } from "@/lib/utils";

/**
 * The 24 mark on its own.
 *
 * Split out of the wordmark so small surfaces — the section kickers, a chip —
 * can carry the brand without borrowing a component that also renders type.
 */
export function LogoMark({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  const sm = size === "sm";
  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white",
        sm
          ? "size-4.5 rounded-[6px] shadow-[0_3px_8px_-2px_rgba(30,136,229,0.55)]"
          : "size-9 shadow-[0_6px_16px_-4px_rgba(30,136,229,0.6)]",
        className,
      )}
    >
      <span
        className={cn(
          "absolute rounded-full bg-white/40 blur-[3px]",
          sm ? "inset-x-1 top-0.5 h-1/3" : "inset-x-1.5 top-1 h-1/3",
        )}
      />
      <span
        className={cn(
          "relative font-black leading-none tracking-tighter",
          sm ? "text-[8px]" : "text-[13px]",
        )}
      >
        24
      </span>
      {/* The status dot used to hang outside this box, so any ancestor that
          clipped — a rounded pill, a backdrop-filter, an overflow rule — shaved
          its bottom off. It now sits inside the mark and can't be cut. It is
          left off the small mark, where it would only muddy the shape. */}
      {!sm && (
        <span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full bg-accent ring-2 ring-white/90" />
      )}
    </span>
  );
}

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWord && (
        <span className="whitespace-nowrap text-[1.05rem] font-bold tracking-tight">
          24<span className="text-primary">X</span>7
          {/* Phones get the mark plus "24X7" only. The full wordmark plus three
              action buttons doesn't reliably fit a narrow screen — and it fits
              even less once the reader has bumped up their default text size,
              which a px-based breakpoint can't account for. */}
          <span className="ml-1 hidden font-medium text-muted sm:inline">Services</span>
        </span>
      )}
    </span>
  );
}
