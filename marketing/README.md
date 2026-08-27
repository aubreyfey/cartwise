# App Store screenshots

Eight panels at **1290 × 2796**, the size Apple wants for 6.7"/6.9" iPhones.
PNG, no alpha channel — App Store Connect rejects screenshots with one.

| File | Headline |
| --- | --- |
| `appstore-01.png` | Cartwise — the grocery list that remembers what things cost |
| `appstore-02.png` | Know the total before the till |
| `appstore-03.png` | It remembers every price |
| `appstore-04.png` | Which shop is actually cheaper? |
| `appstore-05.png` | Every trip, remembered |
| `appstore-06.png` | Know what to eat first |
| `appstore-07.png` | See where the money went |
| `appstore-08.png` | Stays on your phone |

Every phone in these panels is a real screenshot of the app, not a mockup, and
every claim on them is something the app actually does.

## Regenerating

The panels are rendered from HTML, so changing a headline means editing text
rather than re-doing a graphic.

1. `npm run dev`
2. `npm run shots` — walks the running app with headless Edge and writes the
   eight source screens into `marketing/shots/`. `shotgen.html` seeds a
   realistic list first, so the screens have plausible prices on them, and
   each shot's click path and scroll offset live in `scripts/shots.mjs`.
3. Render each panel from `promo.html?p=1` … `?p=8` at 1290 × 2796
4. `npm run tour:images` — resizes the panels into `public/tour/` for the
   in-app tour

Both helper pages live at the project root and are dev-only — Vite builds
`index.html` alone, so neither ships in `dist/`. The source screens live in
`marketing/shots/` rather than `public/` for the same reason: anything in
`public/` is copied into the deployed app, and 700 KB of marketing PNGs has no
business being downloaded by users.

## Sizes Apple accepts

A 6.7"/6.9" set alone is enough — Apple scales it down for smaller devices.
Add a 13" iPad set (2064 × 2752) only if you ship an iPad build.

## Note on the artwork

Every phone in these panels is a real screenshot, and any sticker inside one is
an original vector from `src/stickers.jsx`. No third-party product photography
or branding appears anywhere, which is deliberate: marketing material carrying
other companies' packaging is a trademark problem App Review is entitled to
raise.

The panels carry no decoration of their own — ink or paper, an accent-coloured
eyebrow, a serif headline, and the phone. Stickers scattered around the
headline made the set read as a craft app rather than a tool.
