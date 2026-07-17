"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Phone, MessageSquare, Star, ShieldCheck, Navigation, Clock, CheckCircle2, Wrench, MapPin,
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
            <div className="grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-xl font-bold text-white">RK</div>
            <div className="flex-1">
              <h3 className="flex items-center gap-1.5 text-lg font-bold">Ravi Kumar <ShieldCheck className="size-4 text-accent" /></h3>
              <p className="flex items-center gap-2 text-sm text-muted">
                <span className="flex items-center gap-0.5"><Star className="size-3.5 fill-warning text-warning" /> 4.9</span>
                · 8 yrs exp · Refrigeration
              </p>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
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

function MapCanvas({ progress }: { progress: number }) {
  // Simulated route path with an animated marker
  return (
    <div className="relative aspect-[4/3] w-full bg-[linear-gradient(135deg,#dbeafe,#eff6ff)] dark:bg-[linear-gradient(135deg,#131c31,#1a2540)]">
      <svg viewBox="0 0 400 300" className="absolute inset-0 size-full" preserveAspectRatio="xMidYMid slice">
        {/* streets */}
        <g stroke="currentColor" className="text-border-strong" strokeWidth="2" opacity="0.5">
          {[40, 100, 160, 220, 280].map((y) => <line key={y} x1="0" y1={y} x2="400" y2={y} />)}
          {[60, 140, 220, 300, 360].map((x) => <line key={x} x1={x} y1="0" x2={x} y2="300" />)}
        </g>
        {/* route */}
        <path id="route" d="M60 260 L60 180 L200 180 L200 80 L340 80" fill="none" stroke="#1E88E5" strokeWidth="5" strokeLinecap="round" strokeDasharray="2 12" opacity="0.35" />
        <path d="M60 260 L60 180 L200 180 L200 80 L340 80" fill="none" stroke="#1E88E5" strokeWidth="5" strokeLinecap="round"
          strokeDasharray="600" strokeDashoffset={600 - progress * 600} />
        {/* destination */}
        <g transform="translate(340 80)">
          <circle r="10" fill="#00C853" opacity="0.25" />
          <circle r="5" fill="#00C853" />
        </g>
        {/* technician marker */}
        <MovingMarker progress={progress} />
      </svg>
      <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full glass-strong px-3 py-1.5 text-xs font-medium">
        <MapPin className="size-3.5 text-accent" /> Home
      </div>
    </div>
  );
}

function MovingMarker({ progress }: { progress: number }) {
  // Interpolate along the polyline manually
  const pts = [[60, 260], [60, 180], [200, 180], [200, 80], [340, 80]];
  const segLens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const totby = segLens.reduce((a, b) => a + b, 0);
  let dist = progress * totby;
  let x = pts[0][0], y = pts[0][1];
  for (let i = 0; i < segLens.length; i++) {
    if (dist <= segLens[i]) {
      const t = dist / segLens[i];
      x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t;
      y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
      break;
    }
    dist -= segLens[i];
    x = pts[i + 1][0];
    y = pts[i + 1][1];
  }
  return (
    <motion.g animate={{ x, y }} transition={{ duration: 3, ease: "easeInOut" }}>
      <circle r="16" fill="#1E88E5" opacity="0.2" />
      <circle r="10" fill="#1E88E5" stroke="#fff" strokeWidth="3" />
    </motion.g>
  );
}
