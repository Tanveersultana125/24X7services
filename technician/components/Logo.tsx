import { cn } from '@/lib/cn'

/** The 24X7 wordmark with the Partner tag that marks this as the work app. */
export function Logo({ inverted, large }: { inverted?: boolean; large?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-extrabold leading-none tracking-[-0.04em]',
          large ? 'size-12 text-[15px]' : 'size-8 text-[10.5px]',
          inverted ? 'bg-white text-brand-ink' : 'bg-brand text-white'
        )}
      >
        24<span className="opacity-70">×</span>7
      </span>
      <span className="flex flex-col leading-none">
        <span className={cn('font-extrabold tracking-tight', large ? 'text-2xl' : 'text-[15px]', inverted ? 'text-white' : 'text-ink')}>
          24X7 Services
        </span>
        <span
          className={cn(
            'mt-1 font-bold uppercase tracking-[0.18em]',
            large ? 'text-[11px]' : 'text-[9.5px]',
            inverted ? 'text-white/60' : 'text-brand'
          )}
        >
          Technician Partner
        </span>
      </span>
    </span>
  )
}
