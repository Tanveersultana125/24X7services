"use client";

/**
 * A handcrafted, premium refrigerator "product render" in pure SVG.
 * Warm metallic materials, soft studio lighting, contact shadow — no stock photos.
 */
export function AppliancePlinth({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 480" className={className} fill="none" aria-hidden>
      <defs>
        <linearGradient id="body" x1="60" y1="40" x2="300" y2="440" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fdfdfb" />
          <stop offset="0.5" stopColor="#e9e7e0" />
          <stop offset="1" stopColor="#d3cfc4" />
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="0">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="royalDoor" x1="80" y1="60" x2="280" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2547d0" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <radialGradient id="spot" cx="0.5" cy="0.32" r="0.7">
          <stop stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sheen" x1="60" y1="40" x2="200" y2="440" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.25" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <filter id="soft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* spotlight */}
      <ellipse cx="180" cy="150" rx="220" ry="200" fill="url(#spot)" />

      {/* contact shadow */}
      <ellipse cx="184" cy="452" rx="120" ry="20" fill="#17150f" opacity="0.16" filter="url(#soft)" />

      {/* body */}
      <rect x="74" y="42" width="212" height="404" rx="30" fill="url(#body)" />
      <rect x="74" y="42" width="212" height="404" rx="30" fill="url(#sheen)" />
      {/* left highlight edge */}
      <rect x="80" y="52" width="10" height="384" rx="5" fill="url(#edge)" opacity="0.8" />

      {/* upper freezer door — royal accent */}
      <rect x="90" y="58" width="180" height="150" rx="20" fill="url(#royalDoor)" />
      <rect x="90" y="58" width="180" height="150" rx="20" fill="url(#sheen)" opacity="0.4" />
      {/* display */}
      <rect x="112" y="82" width="86" height="40" rx="12" fill="#0b0b0d" opacity="0.9" />
      <circle cx="128" cy="102" r="5" fill="#10b981" />
      <rect x="142" y="97" width="42" height="7" rx="3.5" fill="#ffffff" opacity="0.55" />
      <rect x="142" y="108" width="26" height="5" rx="2.5" fill="#ffffff" opacity="0.3" />
      {/* freezer handle */}
      <rect x="240" y="96" width="9" height="74" rx="4.5" fill="#ffffff" opacity="0.85" />

      {/* lower fridge door */}
      <rect x="90" y="218" width="180" height="220" rx="20" fill="url(#body)" />
      <rect x="90" y="218" width="180" height="220" rx="20" fill="url(#sheen)" opacity="0.5" />
      {/* fridge handle */}
      <rect x="240" y="250" width="9" height="150" rx="4.5" fill="#b9b3a5" />
      <rect x="241" y="250" width="3" height="150" rx="1.5" fill="#ffffff" opacity="0.8" />

      {/* seam */}
      <rect x="90" y="212" width="180" height="2" rx="1" fill="#17150f" opacity="0.08" />
    </svg>
  );
}
