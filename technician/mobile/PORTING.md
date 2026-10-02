# Porting a technician web screen to the native app

The native app (`technician/mobile`, Expo SDK 57 + Expo Router + Uniwind) is a
port of the Next.js technician app (`technician/`). Same copy, same design
tokens, same on-device store. These are the rules every ported file follows.

## Where things go

| Web | Native |
| --- | --- |
| `technician/app/<tab>/page.tsx` for home, jobs, ai, earnings, profile | `mobile/src/app/(tabs)/<tab>.tsx` |
| any other `technician/app/<path>/page.tsx` | `mobile/src/app/<path>.tsx` (e.g. `jobs/detail.tsx`, `ai/chat.tsx`) |
| `technician/components/X.tsx` | `mobile/src/components/X.tsx` — same name, same exports, same props where they make sense |
| `technician/lib/*` | `mobile/src/lib/*` — already ported; import from `@/lib/...` exactly as the web does |

Keep the web file's comments that explain *why*; drop ones about DOM/browser
details that no longer apply. Keep every user-facing string identical.

## The kit — `@/components/ui`

Same names as the web's `components/ui.tsx`: `Button`, `Chip`, `StatusChip`,
`PriorityBadge`, `Card`, `SectionTitle`, `Label`, `Toggle`, `inputClass`,
`Field`, `Segmented`, `FilterChip`, `ScreenHeader`, `Page`, `ActionDock`,
`Sheet`, `Empty`, `Avatar`, `toneRail`, plus native extras:

- **Text**: `Text` (re-exported from `@/components/ui`). Never `Text` from
  `react-native`. Every string must be inside a `<Text>`. Weight =
  `font-medium|semibold|bold|extrabold`.
- **Inheritance**: RN text takes nothing from its parent View. Where the web
  put `text-sm font-bold text-white` on a box and relied on children
  inheriting it, wrap the children in `<Inherit className="…">`. `Button`,
  `Chip`, `FilterChip`, `Segmented` and `SectionTitle` already do, and turn
  bare strings into Text — so `<Button>Accept</Button>` works as on the web.
  `Labelled` does the same string-wrapping for your own boxes.
- **Icons**: `<Icon as={ArrowLeft} className="size-5 text-brand" />`, icons
  from `lucide-react-native` (same names as `lucide-react`). An Icon without
  a colour class takes the inherited one. A filled star:
  `fill="#c9730f"`. For a raw colour string: `useColor('text-brand')`.
- **Pressables**: `Tappable` (`href` → router.push, `replace` →
  router.replace, `onPress` → button). `active:` classes style the pressed
  state (it dims by default — add `active:opacity-100` with an `active:bg-…`).
- `Button` takes `onPress` (not onClick), `disabled`, `variant`, `size`,
  `className` (box) and `textClassName` (label).
- `toneText(tone)` gives the tone's text colour class.
- `Blink` is the web's `animate-blink` dot.
- `ApplianceGlyph`, `BrandTag` (`@/components/glyphs`), `Logo`, `MenuButton`.

## Screen shape

```tsx
export default function JobsScreen() {
  return (
    <>
      <ScreenHeader title="Jobs" right={…} />
      <Page>…</Page>
      <ActionDock>…</ActionDock>
    </>
  )
}
```

- `ScreenHeader` owns the top safe area and already has the MenuButton.
  `back` keeps its meaning (`back="/jobs"` = fallback when there is no
  previous screen).
- `Page` is the ScrollView (canvas background, `px-4 pt-4`, bottom inset
  handled). Drop the web's `pb-32` / `lg:` classes. `scrollRef` gives you the
  ScrollView for scroll-to-end.
- `ActionDock` sits *under* the page (not over it) and handles the bottom
  inset; `withNav` is ignored.
- Long chat-style screens that need the keyboard: wrap in
  `KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1"`.
- No desktop: drop every `lg:`/`sm:` variant and desktop-only markup.

## Translating web idioms

- `next/link` `<Link href>` → `Tappable href`. `useRouter()` → `router` from
  `expo-router` (`push`, `replace`, `back`, `canGoBack`, `navigate`).
  `useSearchParams()` → `useLocalSearchParams<{ id?: string }>()`.
  `usePathname` → from expo-router. `Route` type → `Href`.
- Hrefs keep the web strings minus the trailing slash:
  `/jobs/detail/?id=X` → `/jobs/detail?id=X`. Use `jobHref`/`stepHref`.
- `useBack(fallback)` from `@/lib/nav` keeps its signature.
- CSS that RN lacks: no `grid` (use `flex-row flex-wrap` with `w-[48%]` or
  `flex-1` children), no `hover:`, no `group-*`, no `sr-only`
  (`accessibilityLabel`), no `truncate` (`numberOfLines={1}`), no
  `line-clamp-*` (`numberOfLines`), no `space-y-*` / `divide-*` (use `gap-*`
  / `border-t` on items), no `inline-flex` (`flex-row self-start`), no
  `place-items-center` (`items-center justify-center`), no gradients in
  className (`LinearGradient` from expo-linear-gradient), no `backdrop-blur`,
  no `transition-*`, no `cursor-*`, no `whitespace-*`, no `fixed`/`sticky`.
  `flex` is a column by default — add `flex-row` where the web relied on row.
- `<button>` → `Tappable`; `<input>`/`<textarea>` → `TextInput` from
  react-native with `className={inputClass}` and
  `placeholderTextColor="#8a93a3"`; `<select>` → a `Sheet` with a list of
  options, or a `Segmented`. `type="tel"/"number"` → `keyboardType`.
- `<img>` → `Image` from react-native (`source={{ uri }}`) or `expo-image`.
- `<svg>` → `react-native-svg` (`Svg`, `Path`, `Circle`, `Rect`, `G`, `Line`,
  `Polyline`, `Text as SvgText`); colours as strings (`useColor('text-brand')`)
  — there is no currentColor.
- Keyframe animations (`animate-*`) → `react-native-reanimated`
  (`entering={FadeInDown}`, `withRepeat`, …) with `ReduceMotion.System`.
- `navigator.clipboard` → `expo-clipboard` (`setStringAsync`).
  `navigator.share` → `Share.share` from react-native. `tel:` / `mailto:` /
  `upi:` / maps links → `Linking.openURL`. Downloading a file →
  `expo-file-system` + `expo-sharing`.
- `<input type="file" accept="image/*" capture>` → `expo-image-picker`
  (`launchCameraAsync` / `launchImageLibraryAsync`), then shrink with
  `expo-image-manipulator` to a base64 JPEG data URL like the web did.
- `speechSynthesis` → `expo-speech`. `chime()` from `@/lib/chime` works.
- `window.confirm` → a `Sheet`/modal; never `Alert` for app flows.
- Numbers keep the `num` class (tabular figures).

## Checking

```bash
npm run typecheck                                      # must be clean
npx expo export --platform web --output-dir dist-web   # web preview build
MSYS_NO_PATHCONV=1 node scripts/shot.mjs <outDir> /home /jobs --full
```
