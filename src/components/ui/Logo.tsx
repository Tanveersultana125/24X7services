import { cn } from "@/lib/utils";

export function Logo({ className, showWord = true }: { className?: string; showWord?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white shadow-[0_6px_16px_-4px_rgba(30,136,229,0.6)]">
        <span className="absolute inset-x-1.5 top-1 h-1/3 rounded-full bg-white/40 blur-[3px]" />
        <span className="relative text-[13px] font-black leading-none tracking-tighter">24</span>
        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full bg-accent ring-2 ring-[var(--surface)]" />
      </span>
      {showWord && (
        <span className="text-[1.05rem] font-bold tracking-tight">
          24<span className="text-primary">X</span>7
          <span className="ml-1 font-medium text-muted">Services</span>
        </span>
      )}
    </span>
  );
}
