# Brand logos

Three of them are here. `lg.svg`, `samsung.svg` and `bosch.svg` come from
[simple-icons](https://simpleicons.org), whose SVG files are CC0 — the shapes
are the manufacturers' own marks, redrawn as vectors by that project and
released for reuse. The trademarks themselves still belong to the
manufacturers, which is what the disclaimer under the grid is for.

IFB is not in that set, so it shows its wordmark. That is the fallback working
as intended, not a gap waiting to be filled with something traced by hand.

## What goes here

One SVG per brand, named after its id in the catalog:

    lg.svg  samsung.svg  bosch.svg  ifb.svg

Then set `logo: "/brands/lg.svg"` on that brand in
`backend/seed/fixtures/brands.json` and reseed. A brand without a `logo`
falls back to its wordmark, which is what every brand does today — nothing
breaks while the folder is empty.

## Adding another one

Either take it from simple-icons, if it has that brand, or from the
manufacturer. Each one publishes its own logo files and the terms for using
them,
usually under "brand assets", "press" or "media kit" on their corporate site.
Download them from there. Two rules they all state in some form, and both are
worth keeping to whether or not anybody checks:

- **Do not redraw it.** A logo traced by hand is both an unauthorised
  reproduction and, because it is never quite right, the thing that makes a
  page look fake. Use the file they publish or use the wordmark.
- **Do not imply endorsement.** Servicing an appliance is not a partnership.
  The disclaimer under the grid says so, and it is generated from the brand
  list so it cannot fall out of step with what is on screen.

## What they should look like

- SVG, so they stay sharp at any size and weigh nothing.
- Trimmed to the mark itself — no padding baked in, or the tile will centre
  the whitespace instead of the logo.
- Single colour where the brand publishes a monochrome version. The grid is
  greyscale tiles, and eleven brand palettes side by side is a fruit salad.
  Where only the colour version exists, use it; the tile is neutral enough.
- Under about 20 KB each. A logo grid is not worth a second of loading.
