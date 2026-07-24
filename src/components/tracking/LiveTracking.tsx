"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Phone, MessageSquare, Star, ShieldCheck, Navigation, Clock, CheckCircle2, Wrench, MapPin, Bike,
} from "lucide-react";

const STAGES = ["Assigned", "On the way", "Arrived", "In service", "Completed"];

export function LiveTracking() {
  const [eta, setEta] = useState(8);
  const [progress, setProgress] = useState(0.42);
  const stage = 1;

  useEffect(() => {
    const t = setInterval(() => {
      setEta((e) => (e > 1 ? e - 1 : e));
      setProgress((p) => Math.min(p + 0.06, 0.95));
    }, 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      {/* Map */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-premium-md">
        <MapCanvas progress={progress} />
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full glass-strong px-3.5 py-2 text-sm font-semibold shadow-premium-md">
          <span className="size-2 animate-pulse rounded-full bg-accent" /> Live · updated just now
        </div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl glass-strong p-4 shadow-premium-lg"
        >
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <Navigation className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">Ravi is on the way</p>
              <p className="text-xs text-muted">2.4 km · via 100 Ft Road</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-primary">{eta}<span className="text-sm font-medium"> min</span></p>
            <p className="text-xs text-muted">ETA</p>
          </div>
        </motion.div>
      </div>

      {/* Details */}
      <div className="flex flex-col gap-6">
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-premium-md">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-xl font-bold text-white">RK</div>
              <span className="absolute -bottom-1 -right-1 size-4 rounded-full border-2 border-surface bg-accent" title="Online" />
            </div>
            <div className="flex-1">
              <h3 className="flex items-center gap-1.5 text-lg font-bold">Ravi Kumar <ShieldCheck className="size-4 text-accent" /></h3>
              <p className="flex items-center gap-2 text-sm text-muted">
                <span className="flex items-center gap-0.5"><Star className="size-3.5 fill-warning text-warning" /> 4.9</span>
                · 8 yrs exp · Refrigeration
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-muted"><Bike className="size-4" /> Two-wheeler</span>
            <span className="font-semibold tracking-wide">KA 05 · HJ 4821</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <a href="tel:18002000247" className="flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-white transition-transform active:scale-95">
              <Phone className="size-4" /> Call
            </a>
            <button className="flex items-center justify-center gap-2 rounded-full border border-border-strong px-4 py-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary">
              <MessageSquare className="size-4" /> Chat
            </button>
          </div>
        </div>

        {/* Progress timeline */}
        <div className="rounded-3xl border border-border bg-surface p-6 shadow-premium-md">
          <h3 className="text-base font-bold">Service progress</h3>
          <ol className="mt-5 space-y-1">
            {STAGES.map((s, i) => {
              const done = i < stage;
              const active = i === stage;
              return (
                <li key={s} className="relative flex gap-3.5 pb-5 last:pb-0">
                  {i < STAGES.length - 1 && (
                    <span className={`absolute left-[15px] top-8 h-[calc(100%-2rem)] w-0.5 ${done ? "bg-accent" : "bg-border"}`} />
                  )}
                  <div className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full ${
                    done ? "bg-accent text-white" : active ? "bg-primary text-white" : "bg-surface-2 text-muted-2"
                  }`}>
                    {active && <span className="absolute inset-0 animate-pulse-ring rounded-full ring-2 ring-primary/50" />}
                    {done ? <CheckCircle2 className="size-4" /> : active ? <Navigation className="size-4" /> : <Clock className="size-4" />}
                  </div>
                  <div className="pt-1">
                    <p className={`text-sm font-semibold ${!done && !active ? "text-muted" : ""}`}>{s}</p>
                    {active && <p className="text-xs text-primary">Happening now</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex items-start gap-3 rounded-3xl border border-border bg-surface p-5 shadow-premium-sm">
          <Wrench className="size-5 shrink-0 text-primary" />
          <p className="text-sm text-muted">
            <span className="font-semibold text-foreground">Genuine parts on board.</span> Ravi is carrying the required compressor spare for your Samsung refrigerator.
          </p>
        </div>
      </div>
    </div>
  );
}

/** Route the technician follows — kept aligned to the road grid below. */
const ROUTE: [number, number][] = [
  [56, 232],
  [250, 232],
  [250, 70],
  [340, 70],
];
const ROUTE_D = "M56 232 L250 232 L250 70 L340 70";
const ROUTE_LEN = 546; // ≈ path length, for the draw-on animation

/** City buildings — subtle blocks that give the map depth. */
const BUILDINGS = [
  [18, 20, 70, 40], [96, 20, 46, 40], [150, 20, 82, 40],
  [18, 84, 70, 52], [300, 20, 46, 40], [354, 20, 40, 40],
  [18, 156, 44, 62], [72, 156, 62, 62], [300, 90, 44, 46],
  [300, 156, 94, 62], [18, 246, 90, 40], [128, 246, 104, 40],
];

function MapCanvas({ progress }: { progress: number }) {
  return (
    <div className="relative aspect-[4/3] w-full bg-[#eaeef3] dark:bg-[#0f1626]">
      <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        {/* park & water — soft colour patches */}
        <rect x="150" y="84" width="82" height="52" rx="8" className="fill-emerald-400/20" />
        <path d="M0 300 L0 268 Q120 250 200 272 T400 262 L400 300 Z" className="fill-sky-400/20" />

        {/* buildings */}
        <g className="fill-black/[0.05] dark:fill-white/[0.06]">
          {BUILDINGS.map(([x, y, w, h], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="5" />
          ))}
        </g>

        {/* road casing then road surface — the classic map look */}
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g className="stroke-black/[0.06] dark:stroke-white/[0.06]" strokeWidth="15">
            <path d="M-10 70 H410" /><path d="M-10 150 H410" /><path d="M-10 232 H410" />
            <path d="M56 -10 V310" /><path d="M150 -10 V310" /><path d="M250 -10 V310" /><path d="M340 -10 V310" />
          </g>
          <g className="stroke-white dark:stroke-white/25" strokeWidth="11">
            <path d="M-10 70 H410" /><path d="M-10 150 H410" /><path d="M-10 232 H410" />
            <path d="M56 -10 V310" /><path d="M150 -10 V310" /><path d="M250 -10 V310" /><path d="M340 -10 V310" />
          </g>
        </g>

        {/* full route, faded */}
        <path d={ROUTE_D} fill="none" stroke="#1E88E5" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" opacity="0.18" />
        {/* travelled portion — casing + bright core */}
        <path d={ROUTE_D} fill="none" stroke="#1257a6" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={ROUTE_LEN} strokeDashoffset={ROUTE_LEN - progress * ROUTE_LEN} />
        <path d={ROUTE_D} fill="none" stroke="#2f8cff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={ROUTE_LEN} strokeDashoffset={ROUTE_LEN - progress * ROUTE_LEN} />

        {/* origin dot */}
        <g transform="translate(56 232)">
          <circle r="6" className="fill-white dark:fill-[#0f1626]" />
          <circle r="4" fill="#1257a6" />
        </g>

        {/* destination home pin */}
        <HomePin x={340} y={70} />

        {/* technician marker */}
        <MovingMarker progress={progress} />
      </svg>

      {/* zoom controls — cosmetic, sells the "real map" feel */}
      <div className="absolute right-4 top-16 flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-premium-sm">
        <span className="grid size-8 place-items-center border-b border-border text-lg font-medium text-muted">+</span>
        <span className="grid size-8 place-items-center text-lg font-medium text-muted">−</span>
      </div>
      <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full glass-strong px-3 py-1.5 text-xs font-medium">
        <MapPin className="size-3.5 text-accent" /> Home
      </div>
    </div>
  );
}

function HomePin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="12" fill="#00C853" opacity="0.18">
        <animate attributeName="r" values="10;16;10" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.25;0;0.25" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <path d="M0 4 C0 4 -11 -4 -11 -11 A11 11 0 1 1 11 -11 C11 -4 0 4 0 4 Z" fill="#00C853" />
      <circle cy="-11" r="4" className="fill-white" />
    </g>
  );
}

function MovingMarker({ progress }: { progress: number }) {
  // Interpolate position AND heading along the polyline
  const pts = ROUTE;
  const segLens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segLens.reduce((a, b) => a + b, 0);
  let dist = progress * total;
  let x = pts[0][0], y = pts[0][1], angle = 0;
  for (let i = 0; i < segLens.length; i++) {
    const dx = pts[i + 1][0] - pts[i][0];
    const dy = pts[i + 1][1] - pts[i][1];
    if (dist <= segLens[i] || i === segLens.length - 1) {
      const t = Math.min(dist / segLens[i], 1);
      x = pts[i][0] + dx * t;
      y = pts[i][1] + dy * t;
      angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      break;
    }
    dist -= segLens[i];
  }
  return (
    <motion.g animate={{ x, y }} transition={{ duration: 3, ease: "easeInOut" }}>
      <circle r="17" fill="#1E88E5" opacity="0.15" />
      <circle r="17" fill="#1E88E5" opacity="0.12">
        <animate attributeName="r" values="13;20;13" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.22;0;0.22" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle r="11" fill="#1E88E5" stroke="#fff" strokeWidth="3" />
      {/* heading arrow */}
      <path transform={`rotate(${angle})`} d="M4.5 0 L-3 -3.2 L-1.2 0 L-3 3.2 Z" fill="#fff" />
    </motion.g>
  );
}
