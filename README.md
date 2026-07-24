# 24X7 Services — Premium Home Appliance Service Booking Platform

A world-class, enterprise-grade booking platform for professional doorstep repair,
installation, maintenance and AMC of home appliances. Built with an Apple-clean,
Google-simple design language, glassmorphism, and Framer Motion micro-animations.

> **Not e-commerce.** This is a service-booking experience — brands, appliances,
> problem diagnosis, scheduling, live tracking, invoices, warranty and AMC.

**Brands:** Samsung · LG · IFB · Bosch  
**Appliances:** Refrigerator · Washing Machine · Microwave · Oven

---

## ✨ What's built (runnable now)

| Area | Route | Highlights |
|------|-------|-----------|
| **Home / Marketing** | `/` | Premium hero with 3D-style composed scene, service categories, brand cards, how-it-works, interactive common-problems tabs, 10 AI features, trust section, AMC pricing, testimonial slider, CTA |
| **Booking Flow** | `/book` | Full 7-step wizard (Brand → Appliance → Problem → Date → Time → Address → Payment) with live price estimate, sticky summary, animated stepper, and a post-booking journey timeline (Confirmed → Technician Assigned → Live Tracking → Completed → Invoice → Warranty → Feedback) |
| **Live Tracking** | `/track` | Simulated map with animated technician marker, live ETA, technician profile, call/chat, service-progress timeline |
| **Customer Dashboard** | `/dashboard` | Stats, active-service banner, tabbed bookings / invoices / warranty / addresses, quick actions |

**System-wide:** Dark + Light mode, glassmorphism, premium shadows, WCAG-minded focus
states, reduced-motion support, PWA manifest + shortcuts, SEO metadata + JSON-LD +
sitemap + robots, fully responsive down to mobile.

## 🎨 Design system

- **Palette** (`src/app/globals.css`): Primary `#1E88E5`, Secondary `#2563EB`,
  Accent `#00C853`, plus success/warning/danger and semantic light/dark tokens.
- **Typography:** Plus Jakarta Sans.
- **Tokens** exposed to Tailwind v4 via `@theme inline` — use `bg-surface`,
  `text-muted`, `shadow-premium-lg`, `glass`, `text-gradient`, etc.

## 🧱 Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Framer Motion · lucide-react · next-themes · Zod + React Hook Form (available).

## 📁 Folder structure

```
src/
├── app/                 # Routes: /, /book, /track, /dashboard + manifest/sitemap/robots
├── components/
│   ├── layout/          # Navbar, Footer
│   ├── home/            # All landing-page sections
│   ├── booking/         # Wizard, Stepper, OptionCard, Confirmation
│   ├── tracking/        # LiveTracking map + timeline
│   ├── dashboard/       # Customer dashboard
│   ├── ui/              # Button, Reveal, ThemeToggle, Icons, Logo, SectionHeading
│   └── providers/       # ThemeProvider
└── lib/                 # data.ts, content.ts, types.ts, utils.ts
```

## 🚀 Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## 🔐 Customer login (Google OAuth)

`/login` uses **Google Sign-In** as the only customer login method. Sessions are
stateless — the signed-in user is stored in an HMAC-signed, `httpOnly` cookie
(`src/lib/customer/auth.ts`), so no database is required. `/dashboard` is gated and
redirects to `/login` when there's no session.

**Flow:** `/api/auth/google` → Google consent → `/api/auth/google/callback`
(exchanges the code, reads `id_token`, sets the session) → `/dashboard`.
Log out via a `POST /api/auth/logout`.

**Setup:**

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   create an **OAuth 2.0 Client ID** (type: Web application).
2. Add the authorized redirect URI:
   - Dev: `http://localhost:3000/api/auth/google/callback`
   - Prod: `https://YOUR_DOMAIN/api/auth/google/callback`
3. Copy `.env.local` values:

   ```bash
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   SESSION_SECRET=$(openssl rand -base64 32)
   ```

Without these, `/login` shows a friendly "not configured" message instead of crashing.

## 🗺️ Roadmap (documented for follow-up)

The frontend is designed to drop onto a real backend. Suggested next milestones:

1. **NestJS backend** — REST API, JWT + Google OAuth, Prisma + PostgreSQL, Redis.
   Model entities: `User`, `Technician`, `Booking`, `Problem`, `Invoice`,
   `Warranty`, `AmcPlan`, `Payment`. Replace mock data in `src/lib/data.ts` with
   API calls (add a typed `src/lib/api.ts` client).
2. **Payments** — Razorpay + Stripe checkout in the Payment step.
3. **Live tracking** — swap the simulated `MapCanvas` for Google Maps + real
   technician GPS over WebSocket/FCM.
4. **AI features** — wire the diagnosis/estimator/chat cards to model endpoints.
5. **Technician app** — jobs, OTP verify, checklist, photo upload, e-signature.
6. **Admin dashboard** — bookings, technicians, payments, inventory, analytics, CMS,
   roles & permissions.
7. **Auth screens** — Google / OTP login, protected `/dashboard`.

Deploy targets: Vercel (frontend) · AWS + Docker + Kubernetes (services) ·
GitHub Actions CI/CD · Nginx. PWA is TWA-ready via `manifest.webmanifest`.
