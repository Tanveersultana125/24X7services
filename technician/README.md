# 24X7 Technician Partner

The technician app: Expo SDK 57 + Expo Router + Uniwind (Tailwind on React
Native). It runs on Android and iOS, and as a web preview. The seeded demo
day is kept on the device (expo-sqlite kv-store; localStorage on the web).

It replaced the Next.js technician web app on 2026-10-05; that app is in git
history up to commit 58082da.

```bash
npm install
npm start            # Expo dev server — scan the QR with Expo Go / a dev build
npm run web          # web preview on :3320
npm run typecheck
```

How screens are written (the kit, layout, web-idiom translations):
`PORTING.md`.

## Web preview on Vercel

The Vercel project `24-x7services-bird` (root directory `technician`) builds
it with `vercel.json`: `scripts/web-deploy.mjs` exports the web build and
moves package assets out of `assets/node_modules/`, which Vercel will not
serve. Pushes do not deploy; deploy by hand.
