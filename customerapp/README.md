# Customer app

Booking, tracking and paying for home appliance repair, service, installation
and maintenance. Mobile-first, wrapped with Capacitor for Android, backed by
Firebase.

```
customerapp/
├─ frontend/          Next.js (App Router, static export) + Capacitor
├─ backend/           Firebase: rules, indexes, functions, seed, simulator
└─ packages/shared/   zod schemas and enums both sides import
```

## What is built

| Phase | Scope | State |
|---|---|---|
| 1 | Monorepo, shared schemas, rules + tests, seed, design system, `/dev/components` | **Done** |
| 2 | Splash, location + serviceability, Home, Search, Services, Appliance | Not started |
| 3 | The booking flow, `createBooking`, payments, webhook, hold expiry | Not started |
| 4 | Assignment, tracking, progress, approval, OTPs, invoice, warranty, review | Not started |
| 5 | Bookings tabs, cancel/reschedule, profile, support | Not started |
| 6 | PWA, offline, Android build, App Check, accessibility, Lighthouse | Not started |

Every route in the app exists as a stub from Phase 1 so `typedRoutes` can check
each link from the start. A stub still standing at the end of Phase 6 is a
screen that was missed.

## Getting started

Node 20.9 or later, and a JDK for the Firebase emulators.

```bash
npm install
npm -w @app/shared run build     # frontend and functions both import the built output
```

Two terminals:

```bash
npm run emulators                # Auth, Firestore, Functions, Storage, UI on :4000
npm run dev                      # the app on http://localhost:3300
```

Then seed the emulator you just started:

```bash
npm -w functions run seed
```

`npm run seed` on its own starts a throwaway emulator, seeds it and shuts it
down — useful for checking the fixtures, useless for development.

### Environment

Copy `frontend/.env.example` to `frontend/.env.local`. With
`NEXT_PUBLIC_USE_EMULATORS=true` nothing else needs filling in; the project id
`demo-customerapp` keeps the emulators fully offline.

Nothing in that file is secret. Every `NEXT_PUBLIC_` value is compiled into the
bundle and readable by anyone who installs the app. The Razorpay key secret, the
WhatsApp and SMS credentials and any AI key belong in Cloud Functions secrets
and must never appear there.

Reaching the emulators from elsewhere: an Android emulator sees the host at
`10.0.2.2`, a physical device needs this machine's LAN address. Set
`NEXT_PUBLIC_EMULATOR_HOST` accordingly.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | The app against the emulators |
| `npm run emulators` | Builds the functions bundle, starts the suite, keeps state between runs |
| `npm -w functions run seed` | Loads the catalog into a running emulator |
| `npm run seed` | Seeds a throwaway emulator, for checking fixtures |
| `npm run simulate -- <bookingId>` | Walks a booking through the whole job (Phase 4) |
| `npm run test:rules` | Security rules, allow and deny, against the emulator |
| `npm run typecheck` | All three packages |
| `npm run lint` | ESLint over the frontend |
| `npm run build` | Static export into `frontend/out` |
| `npm run cap:android` | Builds, syncs and opens Android Studio |
| `npm run deploy:functions` | Builds shared, bundles functions, deploys |

## How it is put together

**Money is paise, everywhere.** Integers in Firestore, integers over the wire,
integers in every calculation. `formatPaise` turns one into text and that is the
only place rupees exist. GST is carved out of the total rather than added on
top, and the split is floored so `taxable + cgst + sgst` is always exactly the
total.

**The client never sends a price.** The booking draft carries what was chosen,
never what it costs. `createBooking` prices it from the catalog inside a
transaction, and the security rules refuse every client write to `bookings`,
`invoices`, `warranties` and `tracking`, so there is no second path in.

**Static export, which rules things out.** No SSR, no server actions, no route
handlers that read a request, no proxy, no redirects, no dynamic segments. Detail
screens take a query param — `/bookings/detail?id=…`, not `/bookings/[id]`. All
data is fetched client-side from Firebase.

**One vocabulary.** `packages/shared` holds the zod schemas and the enums both
sides import, including the booking status graph and which transitions it allows.
A renamed field is a compile error on both sides rather than a runtime surprise.

**Colour means state.** The palette is black and white; the only hues are
success, warning and error, and they appear on badges, dots and alerts and
nowhere else. Because there is no accent colour to spend, selection and current
state are carried structurally — `aria-pressed`, `aria-current`, and a status
label always spelled out in text beside its dot.

## Decisions still needed

Each of these is marked `DECISION NEEDED` at the place it matters.

**Before launch, and blocking.**

- `backend/seed/fixtures/businessConfig.json` — legal name, GSTIN, registered
  address, SAC code, GST rate and state code are placeholders. All six are
  printed on every invoice the app issues and must be confirmed with the CA.
- `frontend/config/brand.ts` — the trading name, and the Android `appId`, which
  has to match the Play Console package before the first upload.

**Business policy.**

- `backend/seed/seed.ts` — all twenty brand × appliance combinations are seeded
  as enabled. The business must disable the ones it does not service, or the
  brand page offers work nobody can take.
- Cancellation policy, reschedule limit and default warranty period are seeded
  with plausible values (free until 4 hours before, ₹99 after, 2 reschedules,
  30 days) and need confirming.

**Deliberately off.**

- `BRAND_LOGOS_ENABLED` is `false`. Manufacturer names appear as text wordmarks,
  with the disclaimer beside them. It flips only if an authorised partner
  agreement exists — a logo implies an endorsement this business does not have.

**Content.**

- `SCREENS_SPEC.md` was not supplied. The service descriptions, issue lists and
  diagnosis causes in `backend/seed/fixtures/` are derived from the build brief
  rather than transcribed from that document, and want reviewing against it.
- `frontend/public/appliances/*.svg` are line-art stand-ins. Appliance
  photography is the one place full colour belongs in this design, so these
  should be replaced with real photographs.

## Testing

`npm run test:rules` runs 33 cases over `firestore.rules`, each written as a
pair: the access the rule exists to allow and the access it exists to stop. The
deny half is the point — another user reaching into an address book, an owner
rewriting their own price, a review posted for a job that never happened, a
query over the whole bookings collection rather than one scoped to the caller.
