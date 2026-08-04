import { cn } from "@/lib/utils";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      {/* The status dot used to hang outside this box, so any ancestor that
          clipped — a rounded pill, a backdrop-filter, an overflow rule — shaved
          its bottom off. It now sits inside the mark and can't be cut. */}
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_6px_16px_-4px_rgba(30,136,229,0.6)]">
        <span className="absolute inset-x-1.5 top-1 h-1/3 rounded-full bg-white/40 blur-[3px]" />
        <span className="relative text-[13px] font-black leading-none tracking-tighter">24</span>
        <span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full bg-accent ring-2 ring-white/90" />
      </span>
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
