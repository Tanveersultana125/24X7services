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
| 2 | Splash, location + serviceability, Home, Search, Services, Appliance | **Done** |
| 3 | Sign-in, the booking flow, `createBooking`, payments, webhook, hold expiry | **Done** |
| 4 | Assignment, tracking, progress, approval, OTPs, invoice, warranty, review | **Done** |
| 5 | Bookings tabs, cancel/reschedule, profile, support, legal | **Done** |
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

The seed writes to the emulator unless `SEED_ALLOW_PRODUCTION=1` says otherwise.
It is that way round because `FIRESTORE_EMULATOR_HOST` is only set for processes
the emulator spawns, so a second terminal never sees it.

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
| `npm run simulate -- <bookingId>` | Walks a booking through the whole job; `--fast`, `--no-repair` |
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

**A slot is held, then booked, and the hold is given back.** Paying online
creates the booking in `pending_payment` and takes a hold on the window; paying
after the service takes the place outright. `expireSlotHolds` runs every five
minutes and releases holds nobody paid for, as `cancelled` rather than `failed`
— nothing failed, somebody changed their mind. Without it an abandoned checkout
keeps a place forever and the day quietly stops selling.

**Payment is confirmed twice, and the second one is the one that counts.**
`verifyPayment` runs when the customer's checkout returns, which is fast but not
guaranteed; the webhook runs when Razorpay says the money was captured, which is
slow but always happens. Both call the same idempotent function, so whichever
arrives first does the work and the other finds it done.

**One place changes a booking's status.** `BOOKING_STATUS_TRANSITIONS` in the
shared package is the state machine; `applyTransition` is what makes it binding.
The payment, the expiry sweep, the assignment trigger, the approval callable and
the technician simulator all go through it, so an out-of-order write is a
rejected transition rather than a booking stuck somewhere nothing can reach. The
timeline entry is written in the same operation as the status change, so the two
cannot disagree.

**Cancelling and moving are the same two slot movements, done atomically.**
A booking gives its old window back and takes a new one; done separately, a
failure between them either double-books the customer or loses them the slot.
Moving inside one day is the same document twice, so it is read once and both
changes are applied to one array. What cancelling costs is computed by the
server and shown before it is charged — `previewCancellation` and
`cancelBooking` run the same function over the same policy, so the figure in
the dialog is the figure applied.

**Closing an account removes the person, not the invoices.** A customer may ask
for their data to be removed and a business that has issued a GST invoice has
to keep it. So the profile, addresses, saved appliances, notifications and
support threads go; the bookings and invoices stay with the name replaced. The
confirmation says so before they agree to it, because finding out afterwards
that something remained is what breaks trust.

**A bill is settled when nothing is owed, not when a flag says paid.**
`payment.status` records that money came in once. Approving a repair afterwards
raises the total, and those two facts stop being the same thing — so the invoice
derives its settlement from the amounts, and `createPaymentOrder` gates on
`price.due` rather than on the flag. Otherwise a customer ends up holding a bill
the app refuses to take money for.

**Sign-in happens where the app first stores something.** Brand, appliance,
problem and possible causes are open to anyone. The media step is the first
thing kept on a customer's behalf, so that is the gate — the draft is persisted
across it, including the trip out to the SMS app and back.

**Static export, which rules things out.** No SSR, no server actions, no route
handlers that read a request, no proxy, no redirects, no dynamic segments. Detail
screens take a query param — `/bookings/detail?id=…`, not `/bookings/[id]`. All
data is fetched client-side from Firebase.

**One vocabulary.** `packages/shared` holds the zod schemas and the enums both
sides import, including the booking status graph and which transitions it allows.
A renamed field is a compile error on both sides rather than a runtime surprise.

**The region is stated on every callable, not just globally.** Imports evaluate
before the importing module's body, so `setGlobalOptions` in `index.ts` runs
after each handler has already built its `onCall` and the handlers deploy to
us-central1 while the app calls asia-south1. That 404s, and a 404 from a
callable reads as a dropped network request rather than a misconfiguration.
Options live in `functions/src/lib/options.ts`, which `defineCallable` imports,
and `defineCallable` names the region again on every `onCall`.

**Callables return absent, never null.** The callable encoder turns an
`undefined` field into a JSON `null`, and the shared schemas' `.optional()`
rejects null — so a handler that sets an optional field to undefined fails
validation on the client, after the server has done all the work. Handlers omit
the key instead.

**The booking draft is not in Redux.** `packages/shared` describes it as
living there. It lives in the same external store as everything else the app
keeps on the device — one object, written a field at a time, read through
`useSyncExternalStore`. A second state library for a single slice would be two
idioms where one does. `@reduxjs/toolkit` and `react-redux` are still in
`frontend/package.json` and now unused; they come out, or something uses them.

**localStorage is an external store, and is read as one.** The saved location
and the recent searches go through `useSyncExternalStore`, not an effect that
reads storage and calls setState. An effect renders once with the wrong answer
and again with the right one, and every screen has to handle the gap; the
snapshot carries `ready` so the one screen that genuinely needs to tell "nothing
saved" from "not read yet" — the splash — can.

**Colour means state.** The palette is black and white; the only hues are
success, warning and error, and they appear on badges, dots and alerts and
nowhere else. Because there is no accent colour to spend, selection and current
state are carried structurally — `aria-pressed`, `aria-current`, and a status
label always spelled out in text beside its dot.

## Decisions still needed

Each of these is marked `DECISION NEEDED` at the place it matters.

**Before launch, and blocking.**

- `frontend/app/legal/*` — the three legal documents are a plain-English
  statement of how the app actually behaves, written so a customer is not
  misled. They are not a lawyer's draft. All three need review, and the version
  approved becomes `termsVersion` in the business config, which is what every
  consent record points at.
- `backend/functions/src/booking/maskedNumber.ts` — no telephony provider is
  configured, so a customer cannot call their expert and the callable says so
  rather than handing back the support line pretending to be one. Pick a
  provider (Exotel or Knowlarity, usually, in India), put the credentials in
  `config/private`, and implement the allocation.

- `frontend/components/TrackingMap.tsx` — `NEXT_PUBLIC_MAPS_KEY` is unset, so
  the map has never been run. The rest of the tracking screen works without it
  and the map degrades to a panel. Set a key restricted by HTTP referrer and by
  Android package name, and check it. This is the one Google API a client may
  hold a key for; geocoding is not.

- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are
  Cloud Functions secrets and are not set. Until they are, payments only work
  against the emulator, which signs a stand-in response the emulated functions
  accept. The webhook URL also has to be registered in the Razorpay dashboard
  for `payment.captured`, or a payment that the customer's checkout fails to
  report is never confirmed at all.
- `backend/functions/src/auth/onUserCreate.ts` — a 1st-generation auth trigger,
  which means us-central1: the one thing in this backend that is not in Mumbai.
  It sees a uid and a phone number and writes to Firestore in Mumbai. The
  alternative is a v2 blocking function, which needs Identity Platform enabled.
  The answer is a data-residency statement under DPDP, so confirm it.
- `frontend/lib/auth.ts` — phone sign-in uses reCAPTCHA, which cannot complete
  inside the Android WebView. `@capacitor-firebase/authentication` is already a
  dependency for this; wiring it is Phase 6, and `startPhoneSignIn` is the only
  seam it replaces.

- `frontend/app/location/LocationScreen.tsx` — there is no "detect my location"
  button. Turning a coordinate into a pincode needs a geocoding call, and a web
  service key cannot be restricted by referrer, so one compiled into the bundle
  gets lifted and billed to us. If detection is wanted it belongs behind a
  callable, which is an addition to the shared registry.
- `backend/functions/src/index.ts` — all four Phase 2 callables are open to
  callers who have not signed in, which is deliberate: a customer checks whether
  we cover their area before there is any reason to give us a phone number. App
  Check (Phase 6) is what keeps them from being called from outside the app.

- `backend/seed/fixtures/businessConfig.json` — legal name, GSTIN, registered
  address, SAC code, GST rate and state code are placeholders. All six are
  printed on every invoice the app issues and must be confirmed with the CA.
- `frontend/config/brand.ts` — the trading name, and the Android `appId`, which
  has to match the Play Console package before the first upload.

**Business policy.**

- `backend/functions/src/support/tickets.ts` — the first reply is a router, not
  an assistant: it reads the category and answers with what the app already
  knows, and never invents anything. Making it an actual assistant is a Claude
  API call from `replyTo`, and needs an `ANTHROPIC_API_KEY` secret, the
  `@anthropic-ai/sdk` dependency, and a decision about what the booking data in
  the prompt may be used for. `claude-haiku-4-5` suits this shape of task;
  `claude-opus-5` if answers must reason over booking history rather than
  restate it.
- `backend/functions/src/booking/reschedule.ts` — an assigned booking that moves
  keeps its expert, who may not be free in the new window. There is no path back
  to `confirmed` in the state machine, so assignment cannot re-run. Either that
  transition is added, or operations pick these up by hand.
- `backend/functions/src/account/account.ts` — how long kept invoices are
  retained is a question for the CA. Indian GST rules are commonly read as six
  years from the end of the financial year; nothing deletes them on any schedule
  yet.

- `backend/functions/src/booking/complete.ts` — the warranty's covers and
  excludes are one set of terms for every service. The warranty schema describes
  them as copied from the service and the catalog has nowhere to put them:
  either `catalogServices` grows the two fields, or the business confirms one
  set covers everything it does.
- `backend/functions/src/booking/review.ts` — every seeded technician rating is
  fictional, so real reviews are kept beside it as `reviewStats` rather than
  averaged into it. The displayed rating should switch to the computed average
  once there are enough real ones, and the business decides what enough is.
- `backend/functions/src/booking/jobOtp.ts` — the Phase 1 note said job OTPs
  would be stored hashed. They are not, and cannot be while the customer has to
  read one back. What protects them is that `bookings/{id}/private` is denied to
  every client in both directions. If that is not enough, the answer is a second
  factor on the technician side.

- `backend/functions/src/lib/pricing.ts` — every area we service is in
  Telangana and so is the seller, so every supply is intra-state and the tax is
  CGST plus SGST. `serviceAreas` carries no state code. The day the business
  crosses a border, one has to be added and compared against `config.stateCode`,
  or every invoice from that day carries the wrong tax heads.
- `frontend/app/book/details/DetailsScreen.tsx` — the catalog lets an appliance
  declare several detail fields, but the draft carries a single
  `applianceType`, so only the deciding one is asked. Either the draft grows a
  `details` map, or the extra fields come out of the fixtures.

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

## Watching a job happen

There is no technician app in this repository, so the half of the product that
happens after the booking has nothing to drive it. `npm run simulate` is that
driver: it moves a booking through `applyTransition` against the same state
machine the callables use, writes the same timeline entries and the same
tracking document, and pauses at `awaiting_approval` until the customer answers
in the app.

```bash
npm run dev                          # the app
npm run simulate -- <bookingId>      # the expert, in another terminal
```

Book something, pay for it, and the assignment trigger picks it up within a
second or two. Take the booking id from the URL of the confirmation screen.

## Testing

`npm run test:rules` runs 33 cases over `firestore.rules`, each written as a
pair: the access the rule exists to allow and the access it exists to stop. The
deny half is the point — another user reaching into an address book, an owner
rewriting their own price, a review posted for a job that never happened, a
query over the whole bookings collection rather than one scoped to the caller.
