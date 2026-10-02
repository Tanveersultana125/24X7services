# Porting a web screen to the native app

The native app (`customerapp/mobile`, Expo SDK 57 + Expo Router + Uniwind) is a
port of the Next.js web app (`customerapp/frontend`). Same copy, same design
tokens, same data layer. These are the rules every ported screen follows.

## Where things go

| Web | Native |
| --- | --- |
| `frontend/app/<path>/page.tsx` (+ its `*Screen.tsx`) | `mobile/src/app/<path>.tsx` (or `<path>/index.tsx` when it has children). Tabs live in `src/app/(tabs)/`. |
| `frontend/components/X.tsx` | `mobile/src/components/X.tsx` — same name, same exports, same props where they make sense |
| `frontend/lib/*.ts` | `mobile/src/lib/*.ts` — already ported; import from `@/lib/...` exactly as the web does |
| `frontend/config/brand.ts` | `mobile/src/config/brand.ts` |
| `frontend/public/...` | bundled from `mobile/assets/public` by `npm run sync:public` |

Keep the web file's comments that explain *why*; drop ones about DOM/browser
details that no longer apply. Keep every user-facing string identical.

## Primitives — always use these, never the raw RN ones

- **Text**: `import { Text } from '@/components/ui/Text'`. Never `Text` from
  `react-native` (no font, wrong colour in dark mode). Every string must be
  inside a `<Text>`. Weight = `font-medium|semibold|bold|extrabold`.
- **Icons**: `<Icon as={ArrowLeft} className="size-5 text-brand" />` from
  `@/components/ui/Icon`, icons from `lucide-react-native` (same names as
  `lucide-react`). For a raw colour string: `useColor('text-brand')`.
- **Pressables**: `Tappable` (`href` → navigates, `onPress` → button,
  `replace` for router.replace). `active:` classes style the pressed state.
- `Button`, `Card`/`CardLink`/`CardButton`, `Chip`/`Tag`, `Input`/`Textarea`
  (`@/components/ui/Field`), `Switch`/`SwitchRow`, `Img` (`src="/photos/…"`).
- `BottomSheet`, `Modal`, `ConfirmModal` (`@/components/BottomSheet`, `@/components/Modal`).
- `EmptyState`, `ErrorState`, `OfflineBanner`, `Skeleton`, `SkeletonGroup`,
  `SkeletonText`, `StatusBadge`, `ToneBadge` (`@/components/States`, also
  re-exported from the web file names).
- `useToast()` from `@/components/Toast`.
- Layout: `Screen`, `Header`, `HeaderAction`, `Section`, `StickyCTA` from
  `@/components/Screen`.

## Screen shape

```tsx
export default function BookingsScreen() {
  return (
    <Screen tab header={<Header title="Bookings" />}>
      <Section title="Upcoming">…</Section>
    </Screen>
  )
}
```

- Tab screens pass `tab`. Pushed screens use `<Header title showBack />`.
- A pinned action goes in `footer={<StickyCTA>…</StickyCTA>}` (pass `tab` to
  StickyCTA on tab screens). No `StickySpacer` — the footer sits under the scroll.
- Long uniform lists: `Screen scroll={false}` + `FlatList`.
- Horizontal rails: `ScrollView horizontal showsHorizontalScrollIndicator={false}`
  with `contentContainerClassName="gap-3 px-4"` and `className="-mx-4"`.
- `AppShell`, `BookingShell`, `ProfileShell`, `AuthShell` → port as thin wrappers
  around `Screen` with the same props, so screens port line-for-line.

## Translating web idioms

- `next/link` `<Link href>` → `Tappable href` / `CardLink`. `useRouter()` from
  `next/navigation` → `router` from `expo-router` (`push`, `replace`, `back`,
  `canGoBack`). `useSearchParams()` → `useLocalSearchParams<{ a?: string }>()`.
  `usePathname` → `usePathname` from expo-router. `Route` type → `Href`.
- Hrefs keep the web strings, query included: `/services/appliance?a=ac`.
  Drop trailing slashes (`/services/appliance/?a=` → `/services/appliance?a=`).
- `next/image` → `Img`. `fill` → `className="absolute inset-0"`.
- CSS that RN lacks: no `grid` (use `flex-row flex-wrap` with fixed widths like
  `w-[48%]`), no `hover:`, no `group-*`, no `sr-only` (use
  `accessibilityLabel`), no `truncate` (use `numberOfLines={1}`), no
  `line-clamp-*` (`numberOfLines`), no `space-y-*` (use `gap-*`), no
  `inline-flex` (use `flex-row self-start`), no gradients in className (use
  `expo-linear-gradient`'s `LinearGradient` with `useColor`). `flex` is
  column by default — add `flex-row` where the web relied on row.
- Keyframe animations / `motion-safe:` → `react-native-reanimated`
  (`entering={FadeInDown}`, `withRepeat`, …) with `ReduceMotion.System`.
- `<video>` / ServiceClip → `expo-video` (`useVideoPlayer`, `VideoView`, muted,
  loop, `nativeControls={false}`).
- `window.localStorage` → already handled inside `lib/` (`lib/storage.ts`).
- `navigator.share` / clipboard → `lib/share.ts`. `tel:` / `mailto:` →
  `Linking.openURL`. Files to download → `expo-sharing`.
- Text sizes: the 7-step scale (`text-xs … text-3xl`) plus arbitrary px like
  `text-[11px]`. Colours: the theme tokens only (`text-ink`, `bg-surface`,
  `border-border`, `text-brand`, `bg-brand-soft`, `text-white` on colour,
  `bg-plate` behind photos, `bg-night` for scrims, `text-royal` on white pills).
- Desktop-only markup (`lg:` layouts, `DesktopNav`) is dropped.

## Checking a screen

```bash
npm run typecheck                                     # must be clean
npx expo export --platform web --output-dir dist-web  # web preview build
MSYS_NO_PATHCONV=1 node scripts/shot.mjs <outDir> /home /services   # screenshots (+ --dark)
```
