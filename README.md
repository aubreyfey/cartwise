# Cartwise

A grocery list that groups items by aisle, remembers what things cost you, and
keeps a running total against a budget. Everything stays on your device.

## Running it

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
npm install
npm run dev
```

Then open http://localhost:5173 (the dev server opens it for you).

To build for production:

```bash
npm run build
npm run preview
```

Tests cover the pure logic — category guessing, money parsing, Vault price
memory, and the store comparison. No test framework needed; it's Node's
built-in runner:

```bash
npm test
```

## What it does

**The Vault.** Every item you add is remembered with the last price you paid.
Start typing a name you've bought before and it autocompletes with that price,
quantity, and aisle already filled in. Correct a price in the list and the
Vault learns the new one. Open the Vault panel to see everything you buy,
sorted by how often you buy it, and tap any of it straight onto the list.

**Barcode scanning.** Tap Scan, point at a product, and it becomes an item
with its own sticker, ready for a price. Scan the same thing next week and it
fills in the name, price, unit and aisle from your Vault — instantly, offline,
because it's your data.

A barcode you've never scanned is unknown by definition, so you either name it
yourself or press "Look up" to ask Open Food Facts. Either way the code sticks
to that item and the next scan is instant.

Two decoders sit behind that, chosen at runtime. The native `BarcodeDetector`
where it exists — free, instant, nothing to download — which in practice means
Android and ChromeOS only, *not* Windows desktop and *not* iOS Safari. So
ZXing is imported dynamically as the fallback: Vite splits it into its own
chunk, it's fetched only when someone first opens the scanner, and the service
worker caches it like any other hashed asset. Anyone who never scans never
downloads it.

**Currency.** Thirty-five currencies, guessed from your browser's locale on
first run and changeable on the home screen. Decimal places follow the
currency, so yen and won print whole while pesos and dollars get their two
places, with no special-casing.

**Installable and offline.** There's a web app manifest and a service worker,
so it installs to a phone home screen and runs without a connection. All state
is in `localStorage` already; the service worker only caches the app shell.

Navigations are network-first so a new build reaches you the moment you're
online. Hashed build assets are cache-first, which is safe precisely because
their filename changes whenever their contents do.

**Shopping mode.** The Shopping tab strips out the planning tools, enlarges
the tap targets, sinks picked-up items to the bottom of their aisle, and hides
the delete buttons — a stray tap in a supermarket shouldn't lose an item.

**Home screen.** Lands on a greeting with your savings, a card per list
showing its stickers and progress, and a History tab of past trips.

The savings line reports **two** numbers, not one: money kept back on trips
that came in under budget, and money overspent on trips that didn't. They are
never netted against each other. A single combined figure can read as a win
during a month you actually overspent, which is the opposite of what a budget
app is for.

**Expiry.** Track what's in the fridge and what needs eating first. Items sort
into Expired / Today / Next 3 days / This week / Later / No date, and the home
screen carries a badge when something's urgent.

Finishing a trip offers to track whatever perishables you just bought, ticked
by default, with a suggested use-by date. Only aisles that actually go off get
a suggestion — guessing an expiry for a tin of beans is worse than leaving the
field empty.

Dates are stored as plain `YYYY-MM-DD` and compared at day granularity. Note
`parseDate` in `src/pantry.js` builds the date part-by-part rather than calling
`new Date(str)` — the latter parses a bare date as UTC, so anyone west of
Greenwich would see everything expire a day early.

**Stickers.** Every item gets an illustrated sticker, matched on its name
first and its aisle as a fallback — "olive oil" gets the bottle, not a generic
tin. They're original flat vectors drawn in `src/stickers.jsx`, about 4 KB of
inline SVG for the whole set. The die-cut white border comes from
`paint-order: stroke`, so each shape is drawn once rather than twice.

No third-party product art is used anywhere, deliberately. Real packaging
shots would be other companies' trademarks, and they'd cost tens of megabytes
for something these vectors do at any resolution.

**Trip receipt.** Finishing a trip opens a torn-paper receipt: a collage of
what you bought, Budget / Spent / Saved, and every line with its quantity and
unit. The scalloped edge is a three-layer CSS mask — notches along the top,
notches along the bottom, and a solid rectangle covering the middle. Leave
that third layer out and the card vanishes, because its middle then falls
outside every mask layer.

**Multiple lists.** Keep as many as you like — a weekly shop, a party list, a
bulk run. Each has its own items, budget and store. Click the open tab again
to rename it. The Vault, your stores and your trip history are shared across
all of them.

**Finish a trip.** When you're done shopping, "Finish trip" archives what you
actually bought — checked items leave the list, anything unchecked stays for
next time. Prices are copied into the record, so correcting a price later
never rewrites what a past trip cost.

**Trip insights.** Total spent, average trip, where the money goes by category
and by store, and how often you land under budget. Two deliberate choices in
that maths: only trips that actually had a budget count toward the under-budget
tally, and money kept back is never netted against overspend — they're reported
as separate numbers, because one figure that combines them tells you nothing.

**Per-store prices.** Add the stores you actually shop at, then tap one to
make it active. Prices you enter are filed against that store, and switching
stores re-prices the whole list from the Vault — items with no price on file
at the new store keep what they had rather than dropping to zero. When two or
more stores have prices, a comparison panel shows what the list costs at each.

That comparison only counts items priced at *every* store being compared, and
says how many items that covers. Totalling each store over whatever prices it
happens to have would make the store with the fewest prices look cheapest —
the honest number is the one over the overlap.

**Aisle grouping.** Type "bananas" and it lands in Produce. Sections render in
store-walk order (Produce → Bakery → Meat → Dairy → Frozen → Pantry → Snacks →
Drinks → Household), so the list doubles as a route through the store. Empty
aisles are hidden. The dropdown overrides the guess, and once you pick an aisle
by hand it stops re-guessing while you keep typing.

**Budget.** Tap to set one. The bar tracks the list total against it and turns
red with how far over you are. Three numbers stay visible: the list total, the
"in cart" total of checked items, and a per-aisle subtotal in each section
header.

**Almost nothing leaves the device.** State lives in `localStorage` — no
account, no analytics, no sync, no telemetry.

There is exactly one outbound request in the whole app, and you have to press
a button for it: looking up a barcode you've never scanned before. It sends
the barcode digits to Open Food Facts and nothing else — no list contents, no
prices, no identifier. Never automatic, and everything still works if you
never touch it. It lives in `src/lookup.js`, which is the only file in the
project that calls `fetch`.

## Layout

```
public/
  manifest.webmanifest  PWA metadata
  sw.js                 offline app shell
  icon.svg              app icon (+ maskable variant)
src/
  App.jsx              state wiring, totals, aisle grouping
  stickers.jsx         original SVG sticker set + name/aisle matching
  currency.js          currency list, locale detection, money formatting
  lookup.js            optional barcode lookup — the only fetch in the app
  pantry.js            expiry dates, urgency buckets, local-midnight maths
  units.js             sold-by units, fractional quantities
  carts.js             multiple lists + v1 storage migration
  trips.js             trip archiving and spend aggregation
  vault.js             remembered items, per-store prices, suggestion ranking
  stores.js            store list + honest cross-store comparison
  categories.js        aisle list + keyword-based category guesser
  money.js             currency formatting and lenient price parsing
  useLocalStorage.js   persisted useState
  index.css            all styles (light + dark via prefers-color-scheme)
  logic.test.js        vault, stores, categories, money, units
  carts.test.js        carts, migration, trips, insights
  pantry.test.js       expiry dates and urgency bucketing
  components/
    HomeScreen.jsx     greeting, list cards, trip history
    ExpiryScreen.jsx   what's in the fridge and what goes off when
    AddItemForm.jsx    add box with Vault autocomplete and scanning
    BarcodeScanner.jsx camera + native/ZXing decoding
    VaultPanel.jsx     browse and quick-add remembered items
    CartTabs.jsx       switch, rename and delete lists
    StoreBar.jsx       store chips, add/remove, active selection
    StoreCompare.jsx   what the list costs at each store
    TripReceipt.jsx    torn-paper trip summary before logging
    Insights.jsx       spend breakdowns and trip history
    BudgetBar.jsx
    CategorySection.jsx
    ItemRow.jsx
```

Prices are formatted as USD. To change that, edit the `currency` in
`src/money.js`.

## Storage keys

- `cartwise.carts` — every list, with its items, budget and store
- `cartwise.activeCart` — which list is open
- `cartwise.vault` — remembered items and their per-store prices
- `cartwise.stores` — the stores you shop at
- `cartwise.trips` — completed trips
- `cartwise.pantry` — tracked items and their use-by dates
- `cartwise.currency` — the chosen currency code

Clearing a list never touches the Vault or your history. Deleting a store also
drops that store's prices from every Vault item, and any list pointing at it
falls back to no store.

Version 1 stored a single list under `cartwise.items` with a top-level
`cartwise.budget`. Those are folded into one cart on first load and then
removed — see `initialCarts` in `src/carts.js`.
