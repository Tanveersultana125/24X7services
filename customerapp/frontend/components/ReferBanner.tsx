import Link from 'next/link'
import { formatPaise, REFERRAL_REWARD } from '@app/shared'
import { cn } from '@/lib/cn'

/**
 * "Refer and get free services" at the foot of Home, the way the marketplaces
 * close their home screen: the offer in two lines on the left, a drawing of
 * gifts and coins on the right, and the whole band a way to the refer page.
 *
 * The figure is the constant the server pays out, so the promise here cannot
 * drift from what lands on the balance; the asterisk's condition is said on
 * the band itself rather than left for a terms page.
 *
 * The drawing is inline so it costs no request and takes the brand colours.
 * It sits on `plate`-free ground, so it reads the same in either theme.
 */
export function ReferBanner({ className }: { className?: string }) {
  const amount = formatPaise(REFERRAL_REWARD)
  return (
    <Link
      href="/profile/refer"
      className={cn(
        'group -mx-4 flex items-center gap-4 border-t-8 border-surface px-4 py-7 lg:mx-0 lg:rounded-card lg:border-t-0 lg:bg-surface lg:px-6',
        className
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold leading-tight text-ink">
          Refer and get free services
        </p>
        {/* The space after the amount is written out: a text run that follows
            an expression and holds an entity loses its leading space here. */}
        <p className="mt-2 text-base text-muted">
          Invite and get {amount}
          {'*'}
        </p>
        <p className="mt-3 text-xs text-muted">
          *In credits, once a friend&apos;s first booking is finished. They
          get {amount}
          {' '}too.
        </p>
      </div>
      <GiftsDrawing className="w-36 shrink-0 transition-transform duration-[var(--duration-fast)] group-active:scale-95 sm:w-44" />
    </Link>
  )
}

function GiftsDrawing({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 150"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Sparkles */}
      <g fill="#F5B83D">
        <path d="M30 22l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        <path d="M150 14l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" />
        <path d="M168 70l1.5 4.5 4.5 1.5-4.5 1.5-1.5 4.5-1.5-4.5-4.5-1.5 4.5-1.5z" />
        <path d="M22 96l1.2 3.6 3.6 1.2-3.6 1.2-1.2 3.6-1.2-3.6-3.6-1.2 3.6-1.2z" />
      </g>

      {/* Coins */}
      <circle cx="40" cy="58" r="9" fill="#F5B83D" />
      <circle cx="40" cy="58" r="5.5" fill="#FFD27A" />
      <circle cx="160" cy="44" r="8" fill="#F5B83D" />
      <circle cx="160" cy="44" r="4.8" fill="#FFD27A" />
      <circle cx="112" cy="70" r="10" fill="#F5B83D" />
      <circle cx="112" cy="70" r="6" fill="#FFD27A" />

      {/* The lid, tumbling off the big box */}
      <g transform="rotate(-14 104 40)">
        <rect x="62" y="30" width="86" height="20" rx="3" fill="#7C8CF0" />
        <rect x="98" y="30" width="12" height="20" fill="#2547D0" />
        <path
          d="M104 30c-10-14-26-14-24-4 2 7 16 6 24 4zm0 0c10-14 26-14 24-4-2 7-16 6-24 4z"
          fill="#2547D0"
        />
      </g>

      {/* The big box */}
      <rect x="70" y="80" width="72" height="58" rx="3" fill="#4F63E0" />
      <rect x="70" y="80" width="72" height="12" fill="#3B50D6" />
      <rect x="100" y="80" width="12" height="58" fill="#2547D0" />

      {/* The small pink box */}
      <rect x="128" y="104" width="44" height="34" rx="3" fill="#F7A8C8" />
      <rect x="128" y="104" width="44" height="8" fill="#F28BB5" />
      <rect x="146" y="104" width="8" height="34" fill="#E5679A" />
      <path
        d="M150 104c-6-9-16-9-15-2 1 4 10 4 15 2zm0 0c6-9 16-9 15-2-1 4-10 4-15 2z"
        fill="#E5679A"
      />

      {/* The small teal box */}
      <rect x="34" y="112" width="40" height="26" rx="3" fill="#8FE0D6" />
      <rect x="34" y="112" width="40" height="7" fill="#6FD3C6" />
      <rect x="50" y="112" width="8" height="26" fill="#2FB7A6" />
      <path
        d="M54 112c-6-8-15-8-14-2 1 4 9 4 14 2zm0 0c6-8 15-8 14-2-1 4-9 4-14 2z"
        fill="#2FB7A6"
      />
    </svg>
  )
}
