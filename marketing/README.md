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
2. Capture the app screens (`shotgen.html` seeds a realistic list, then
   screenshot at 430 × 932 into `marketing/shots/`)
3. Render each panel from `promo.html?p=1` … `?p=8` at 1290 × 2796

Both helper pages live at the project root and are dev-only — Vite builds
`index.html` alone, so neither ships in `dist/`. The source screens live in
`marketing/shots/` rather than `public/` for the same reason: anything in
`public/` is copied into the deployed app, and 700 KB of marketing PNGs has no
business being downloaded by users.

## Sizes Apple accepts

A 6.7"/6.9" set alone is enough — Apple scales it down for smaller devices.
Add a 13" iPad set (2064 × 2752) only if you ship an iPad build.

## Note on the artwork

All stickers are the original vectors from `src/stickers.jsx`. No third-party
product photography or branding appears anywhere in these panels, which is
deliberate: marketing material carrying other companies' packaging is a
trademark problem that App Review is entitled to raise.
