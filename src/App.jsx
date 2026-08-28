import { useEffect, useMemo, useState } from 'react'
import AddItemForm from './components/AddItemForm.jsx'
import BudgetBar from './components/BudgetBar.jsx'
import CartTabs from './components/CartTabs.jsx'
import AccountPanel from './components/AccountPanel.jsx'
import BackgroundPicker from './components/BackgroundPicker.jsx'
import CategorySection from './components/CategorySection.jsx'
import DataPanel from './components/DataPanel.jsx'
import ExpiryScreen from './components/ExpiryScreen.jsx'
import HomeScreen from './components/HomeScreen.jsx'
import GettingStarted from './components/GettingStarted.jsx'
import InstallHint from './components/InstallHint.jsx'
import Insights from './components/Insights.jsx'
import ItemSheet from './components/ItemSheet.jsx'
import NavBar from './components/NavBar.jsx'
import Onboarding from './components/Onboarding.jsx'
import RecipesScreen from './components/RecipesScreen.jsx'
import MealPlan from './components/MealPlan.jsx'
import RestockPanel from './components/RestockPanel.jsx'
import SplitShop from './components/SplitShop.jsx'
import { prunePast } from './mealplan.js'
import { splitShop } from './stores.js'
import { addRecipe, removeRecipe, updateRecipe } from './recipes.js'
import {
  applyTheme,
  loadLook,
  savePaper,
  saveAccent,
  saveSaturation,
  saveTexture,
  saveTextureStrength,
  watchColorScheme,
} from './theme.js'
import LookPopover from './components/LookPopover.jsx'
import {
  DEFAULT_STICKER_STYLE,
  STICKER_STYLE_KEY,
  setStickerStyle as applyStickerStyle,
} from './stickerStyle.js'
import SettingsScreen from './components/SettingsScreen.jsx'
import PhotoCapture from './components/PhotoCapture.jsx'
import TourScreen from './components/TourScreen.jsx'
import StoreBar from './components/StoreBar.jsx'
import StoreMap from './components/StoreMap.jsx'
import VaultScreen from './components/VaultScreen.jsx'
import StoreCompare from './components/StoreCompare.jsx'
import BasketCompare from './components/BasketCompare.jsx'
import BeforeYouGo from './components/BeforeYouGo.jsx'
import TripReceipt from './components/TripReceipt.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import {
  addCart,
  findCart,
  initialCarts,
  newId,
  removeCart,
  renameCart,
  updateCart,
} from './carts.js'
import { formatMoney, isKnownPrice, parsePrice, sumLines } from './money.js'
import {
  addPantryItem,
  dueItems,
  needsAttention,
  removePantryItem,
  reminderMessage,
  resolvePantryItem,
  suggestedExpiry,
  updatePantryItem,
} from './pantry.js'
import { askForNotifications, notificationPermission, showReminder } from './notify.js'
import { PHOTO_BACKGROUND, backgroundOf, backgroundStyle } from './backgrounds.js'
import { AISLE_ORDER_KEY, defaultAisleOrder, orderedCategories } from './aisleOrder.js'
import ProductSearch from './components/ProductSearch.jsx'
import BuyingSheet from './components/BuyingSheet.jsx'
import TrackExpirySheet from './components/TrackExpirySheet.jsx'
import ProductDetail from './components/ProductDetail.jsx'
import VaultWhySheet from './components/VaultWhySheet.jsx'
import CategoryLibrary from './components/CategoryLibrary.jsx'
import {
  downscale,
  loadListPhotos,
  readImage,
  writeListPhotos,
} from './listPhotos.js'
import { addStore, compareStores, removeStore, setStoreLocation } from './stores.js'
import { currentLocation, formatDistance, isLocation, storesByDistance } from './geo.js'
import { excludeOnList, restockDue } from './restock.js'
import { productKey, reportsFromPurchases } from './community.js'
import {
  CONTRIBUTE_KEY,
  fetchCommunityPrices,
  publishTripPrices,
} from './sync/prices.js'
import { syncAvailable } from './sync/config.js'
import { guessCategory } from './categories.js'
import { DEFAULT_UNIT } from './units.js'
import { readStored, removeStored, useLocalStorage } from './useLocalStorage.js'
import { completeTrip } from './trips.js'
import {
  forgetTripPurchases,
  lastPurchasedAt,
  priceStats,
  recordTripPurchases,
  storeComparison,
} from './purchases.js'
import {
  CATEGORY_LIBRARY_KEY,
  activeCategories,
  allCategories,
  emptyLibrary,
} from './categoryLibrary.js'
import {
  findVaultItem,
  forgetStorePrices,
  previousPriceFor,
  priceFor,
  rememberBarcode,
  rememberItem,
  rememberPrice,
  rememberUnit,
  removeVaultItem,
} from './vault.js'
import { getCurrency, setCurrency } from './currency.js'
import { loadPhotos, photoKey, writePhotos } from './photos.js'
import { TOUR_SEEN_KEY } from './tour.js'
import Icon from './icons.jsx'

const ALL = { id: 'all', label: 'All items', sticker: 'basket' }

export default function App() {
  // Carts hold the lists; the Vault, stores and trip history are shared
  // across all of them.
  const [carts, setCarts] = useLocalStorage('cartwise.carts', () =>
    initialCarts(readStored('cartwise.items'), readStored('cartwise.budget')),
  )
  const [activeCartId, setActiveCartId] = useLocalStorage('cartwise.activeCart', null)
  const [vault, setVault] = useLocalStorage('cartwise.vault', [])
  const [stores, setStores] = useLocalStorage('cartwise.stores', [])
  const [trips, setTrips] = useLocalStorage('cartwise.trips', [])
  // Every line ever actually bought. This is what price history and per-product
  // store comparison are computed from — a trip is keyed by shop, not product.
  const [purchases, setPurchases] = useLocalStorage('cartwise.purchases', [])
  const [categoryLibrary, setCategoryLibrary] = useLocalStorage(
    CATEGORY_LIBRARY_KEY,
    emptyLibrary,
  )
  const [pantry, setPantry] = useLocalStorage('cartwise.pantry', [])
  const [recipes, setRecipes] = useLocalStorage('cartwise.recipes', [])
  const [mealPlan, setMealPlan] = useLocalStorage('cartwise.mealplan', {})
  // Accent, paper, texture and the two strength sliders move together, so
  // they travel as one object rather than five pieces of state that have to
  // be kept in step.
  const [look, setLook] = useState(loadLook)
  const [lookOpen, setLookOpen] = useState(false)
  const [stickerStyle, setStickerStyle] = useLocalStorage(
    STICKER_STYLE_KEY,
    DEFAULT_STICKER_STYLE,
  )

  // Pushed into the sticker store, which every Sticker on the page subscribes
  // to, and stamped on the root so CSS can see it too.
  useEffect(() => {
    applyStickerStyle(stickerStyle)
  }, [stickerStyle])

  // Applied to the root element, so changing it repaints without re-rendering.
  // Re-applied when the system flips to dark, since the soft accent variant is
  // chosen in JavaScript and CSS cannot pick it for us.
  useEffect(() => {
    applyTheme(look)
    return watchColorScheme(() => applyTheme(look))
  }, [look])

  /** Apply and persist in one move, so no setting can be applied but not saved. */
  function changeLook(next) {
    setLook({
      accent: saveAccent(next.accent),
      texture: saveTexture(next.texture),
      paper: savePaper(next.paper),
      textureStrength: saveTextureStrength(next.textureStrength),
      saturation: saveSaturation(next.saturation),
    })
  }
  const [sortMode, setSortMode] = useLocalStorage('cartwise.sort', 'aisle')
  const [aisleOrder, setAisleOrder] = useLocalStorage(AISLE_ORDER_KEY, defaultAisleOrder)
  // The aisles as configured: renamed, reordered, archived ones dropped.
  const categories = useMemo(
    () => activeCategories(categoryLibrary, aisleOrder),
    [categoryLibrary, aisleOrder],
  )
  const allCategoriesFor = useMemo(
    () => allCategories(categoryLibrary, aisleOrder),
    [categoryLibrary, aisleOrder],
  )
  const categoryCounts = useMemo(() => {
    const counts = {}
    const bump = (id) => { counts[id] = (counts[id] ?? 0) + 1 }
    for (const cart of carts) for (const item of cart.items ?? []) bump(item.category)
    for (const item of vault) bump(item.category)
    for (const item of pantry) bump(item.category)
    return counts
  }, [carts, vault, pantry])
  // Opt-in, off by default. A price leaving the device is the one thing here
  // that is not purely local, so it happens because someone said yes.
  const [contributing, setContributing] = useLocalStorage(CONTRIBUTE_KEY, false)
  // What other shoppers have reported. Empty until a backend is configured.
  const [communityPrices, setCommunityPrices] = useState([])

  const ownReports = useMemo(
    () => reportsFromPurchases(purchases, vault),
    [purchases, vault],
  )
  const priceReports = useMemo(
    () => [...ownReports, ...communityPrices],
    [ownReports, communityPrices],
  )


  // "Aug 27 Today" while shopping, so the header says which trip this is.
  const tripDateLabel = useMemo(() => {
    const now = new Date()
    const stamp = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(now)
    return `${stamp} Today`
  }, [])

  const categoryFor = (id) =>
    categories.find((c) => c.id === id) ??
    categories.find((c) => c.id === 'other') ?? { id: 'other', label: 'Other', sticker: 'basket' }
  // Photos used as list backgrounds. Outside useLocalStorage for the same
  // reason product cut-outs are: a write can fail, and that has to be sayable.
  const [listPhotos, setListPhotos] = useState(loadListPhotos)
  const [photoNote, setPhotoNote] = useState(null)
  const [mode, setMode] = useState('planning')
  // 'home' | 'list' | 'expiry' | 'trips' | 'settings'
  const [view, setView] = useState('home')
  const [displayName, setDisplayName] = useLocalStorage('cartwise.name', '')
  // Mirrors the module-level currency so changing it re-renders every price.
  const [currency, setCurrencyState] = useState(getCurrency)
  // Photo cut-outs live outside useLocalStorage: they're the one thing big
  // enough to fail a write, and a silently dropped sticker is worse than an
  // error message.
  const [photos, setPhotos] = useState(loadPhotos)
  const [photoTarget, setPhotoTarget] = useState(null)
  // The full item editor: a draft for a new item, or an existing row.
  const [sheetItem, setSheetItem] = useState(null)
  const [pickingBackground, setPickingBackground] = useState(false)
  // The tour opens itself once, for someone who has never used the app.
  const [tourSeen, setTourSeen] = useLocalStorage(TOUR_SEEN_KEY, false)
  const [showTour, setShowTour] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [searching, setSearching] = useState(false)
  const [whyVault, setWhyVault] = useState(false)
  // The Vault product open in the receipt view, by id.
  const [detailId, setDetailId] = useState(null)
  // The item being confirmed at the shelf, and the product being put away.
  const [buying, setBuying] = useState(null)
  const [trackTarget, setTrackTarget] = useState(null)
  // Search is reused as the product picker for expiry tracking; this says
  // which of the two jobs it is doing.
  const [searchFor, setSearchFor] = useState('list')
  // Lifted out of AddItemForm and VaultPanel so the search sheet's buttons can
  // actually open them. Both components still manage themselves by default.
  const [scanRequested, setScanRequested] = useState(false)
  const [vaultOpen, setVaultOpen] = useState(false)
  // Where you are, asked for only when you tap something that needs it — a
  // permission prompt nobody invited is how an app loses that permission.
  const [here, setHere] = useState(null)
  const [geoNote, setGeoNote] = useState(null)
  // The add form starts closed; the floating + opens it.
  const [addOpen, setAddOpen] = useState(false)

  /** Save the shop you are standing in. */
  async function saveStoreLocation(storeId) {
    setGeoNote(null)
    try {
      const location = await currentLocation()
      setStores((prev) => setStoreLocation(prev, storeId, location))
      setHere(location)
    } catch (error) {
      setGeoNote(
        error.message === 'denied'
          ? 'Location is switched off for CartWise in your browser settings.'
          : "Couldn't get a location fix. Try again outdoors or near a window.",
      )
    }
  }

  async function locateMe() {
    setGeoNote(null)
    try {
      setHere(await currentLocation())
    } catch (error) {
      setGeoNote(
        error.message === 'denied'
          ? 'Location is switched off for CartWise in your browser settings.'
          : "Couldn't get a location fix.",
      )
    }
  }

  function savePhoto(dataUrl) {
    const key = photoKey(photoTarget.name)
    const next = { ...photos, [key]: dataUrl }
    const result = writePhotos(next)
    if (!result.ok) {
      window.alert(
        result.reason === 'full'
          ? "This device's storage is full, so the sticker wasn't saved. Remove a few photo stickers and try again."
          : "This device blocked saving the sticker.",
      )
      return
    }
    setPhotos(next)
    setPhotoTarget(null)
  }

  function deletePhoto() {
    const { [photoKey(photoTarget.name)]: _gone, ...rest } = photos
    writePhotos(rest)
    setPhotos(rest)
    setPhotoTarget(null)
  }

  /**
   * Take a picture from the camera roll and make it this list's background.
   *
   * Downscaled before it is stored, and the list is only switched over once
   * the write succeeds — pointing a list at a photo that failed to save would
   * leave it showing nothing.
   */
  async function saveListPhoto(cartId, file) {
    setPhotoNote(null)
    try {
      const image = await readImage(file)
      const next = { ...listPhotos, [cartId]: downscale(image) }
      const result = writeListPhotos(next)
      if (!result.ok) {
        setPhotoNote(
          result.reason === 'full'
            ? "This device's storage is full. Remove a photo background or a few stickers and try again."
            : 'This device blocked saving the photo.',
        )
        return
      }
      setListPhotos(next)
      patchCart({ background: PHOTO_BACKGROUND }, cartId)
    } catch (e) {
      setPhotoNote(e.message)
    }
  }

  function removeListPhoto(cartId) {
    const { [cartId]: _gone, ...rest } = listPhotos
    writeListPhotos(rest)
    setListPhotos(rest)
    setPhotoNote(null)
    if (activeCart?.background === PHOTO_BACKGROUND) patchCart({ background: 'plain' }, cartId)
  }

  function changeCurrency(code) {
    setCurrencyState(setCurrency(code))
  }
  // The trip being reviewed in the receipt sheet, before it's logged.
  const [pendingTrip, setPendingTrip] = useState(null)

  // The v1 single-list keys have been folded into a cart by now.
  useEffect(() => {
    removeStored('cartwise.items')
    removeStored('cartwise.budget')
    removeStored('cartwise.activeStore')
    // Days that have been and gone, so the plan does not grow forever.
    setMealPlan((prev) => prunePast(prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Onboard once, and only someone with nothing in the app yet — anyone with
  // lists already has worked it out without our help.
  useEffect(() => {
    if (!tourSeen) {
      const untouched = carts.every((c) => c.items.length === 0) && trips.length === 0
      if (untouched) setShowOnboarding(true)
      else setTourSeen(true)
    }
    // Runs once on mount; later state changes must not reopen it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Turn the two answers into real data, so the app is already useful rather
   * than empty. Skipping either is fine — both are optional.
   */
  function finishOnboarding({ store, sticker }) {
    if (store) setStores((prev) => addStore(prev, store))

    if (sticker) {
      const next = { ...photos, [photoKey(sticker.name)]: sticker.dataUrl }
      if (writePhotos(next).ok) setPhotos(next)
      // Remembering it means the sticker shows the moment they add it to a list.
      setVault((prev) =>
        rememberItem(prev, {
          name: sticker.name,
          category: guessCategory(sticker.name),
          price: null,
          qty: 1,
          unit: DEFAULT_UNIT,
        }),
      )
    }

    setShowOnboarding(false)
    setTourSeen(true)
  }

  function closeTour() {
    setShowTour(false)
    setTourSeen(true)
  }

  // --- expiry reminders ----------------------------------------------------

  const [notifyState, setNotifyState] = useState(notificationPermission)

  async function enableNotifications() {
    setNotifyState(await askForNotifications())
  }

  /**
   * Fire the daily reminder when the app opens. A web app cannot wake itself
   * up, so this is the honest moment to tell you — and it happens to be the
   * moment it is most useful, since you open the list before you shop.
   */
  useEffect(() => {
    if (notifyState !== 'granted') return
    const due = dueItems(pantry)
    const body = reminderMessage(due)
    if (!body) return
    showReminder({
      title: `${due.length} ${due.length === 1 ? 'item needs' : 'items need'} eating`,
      body,
      base: import.meta.env.BASE_URL ?? '/',
    })
  }, [notifyState, pantry])

  // A stored id can point at a cart that's since been deleted.
  const activeCart = findCart(carts, activeCartId) ?? carts[0]
  const activeStoreId = activeCart?.storeId ?? null
  const items = useMemo(() => activeCart?.items ?? [], [activeCart])

  // Ask the pool about the things on this list. No-ops entirely when Supabase
  // is not configured, so an unconfigured build makes no requests at all.
  useEffect(() => {
    if (!syncAvailable() || items.length === 0) return undefined
    let cancelled = false
    const keys = items.map((i) => productKey(i)?.key).filter(Boolean)
    fetchCommunityPrices(keys).then((rows) => {
      if (!cancelled) setCommunityPrices(rows)
    })
    return () => {
      cancelled = true
    }
    // Keyed on what is actually asked for, not the array identity.
  }, [items.map((i) => i.name).join('|')])

  const { listTotal, unpriced, cartTotal, checkedCount, grouped, names } = useMemo(() => {
    const { total: listTotal, unpriced } = sumLines(items)
    const checked = items.filter((i) => i.checked)
    const { total: cartTotal } = sumLines(checked)

    // 'aisle' groups into sections in the order you walk the shop; 'all' and
    // 'az' are both one list, differing only in whether it is sorted.
    let grouped
    if (sortMode === 'az') {
      grouped = [{ category: ALL, items: [...items].sort((a, b) => a.name.localeCompare(b.name)) }]
    } else if (sortMode === 'all') {
      grouped = [{ category: ALL, items }]
    } else {
      grouped = orderedCategories(aisleOrder)
        .map((category) => ({
          category,
          items: items.filter((i) => i.category === category.id),
        }))
        .filter((group) => group.items.length > 0)
    }

    return {
      listTotal,
      unpriced,
      cartTotal,
      checkedCount: checked.length,
      grouped,
      names: items.map((i) => i.name),
    }
  }, [items, sortMode, aisleOrder])

  // How each item's price compares to what you last paid for it here.
  const deltas = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      const previous = previousPriceFor(findVaultItem(vault, item.name), activeStoreId)
      if (previous != null && isKnownPrice(item.price) && item.price !== previous) {
        map.set(item.id, item.price - previous)
      }
    }
    return map
  }, [items, vault, activeStoreId])

  const comparison = useMemo(
    () => compareStores(stores, vault, items),
    [stores, vault, items],
  )

  const split = useMemo(() => splitShop(stores, vault, items), [stores, vault, items])

  // The one-line version of everything in "Before you go". Computed here
  // because this is where the data already is; the card only renders it.
  const planningSummary = useMemo(() => {
    const lines = []
    // `cheapest` wraps the store rather than being it — reading .name off the
    // row printed "undefined saves ₱91.75" until it was looked at.
    if (comparison?.cheapest?.store && comparison.savings > 0) {
      lines.push(`${comparison.cheapest.store.name} saves ${formatMoney(comparison.savings)}`)
    }
    if (split?.saving > 0) {
      lines.push(`split and save ${formatMoney(split.saving)}`)
    }
    const due = excludeOnList(restockDue(trips), items).length
    if (due > 0) lines.push(`${due} due a restock`)
    return lines
  }, [comparison, split, trips, items])


  // --- cart plumbing -------------------------------------------------------

  // `id` defaults to the open list, which is what almost every caller means.
  const patchCart = (patch, id = activeCart?.id) =>
    setCarts((prev) => updateCart(prev, id, patch))

  const setItems = (updater) =>
    patchCart((cart) => ({
      items: typeof updater === 'function' ? updater(cart.items) : updater,
    }))

  function createCart(name, purpose) {
    const next = addCart(carts, name, purpose)
    setCarts(next)
    setActiveCartId(next[next.length - 1].id)
    setView('list')
  }

  function openCart(id) {
    setActiveCartId(id)
    setMode('planning')
    setView('list')
  }

  function deleteCart(id) {
    const cart = findCart(carts, id)
    if (
      cart?.items.length &&
      !window.confirm(`Delete "${cart.name}" and its ${cart.items.length} items?`)
    ) {
      return
    }
    const remaining = removeCart(carts, id)
    setCarts(remaining)
    if (activeCartId === id) setActiveCartId(remaining[0]?.id ?? null)
  }

  // --- items ---------------------------------------------------------------

  /**
   * Add to the list and remember in the Vault. Adding something already on
   * the list bumps its quantity instead of creating a duplicate row.
   */
  function addItem({ name, qty, price, unit, category, barcode, brand, packageSize, storeId }) {
    const parsed = parsePrice(price)
    const itemUnit = unit ?? DEFAULT_UNIT
    const priceStore = storeId ?? activeStoreId

    setItems((prev) => {
      const existing = prev.find(
        (i) =>
          i.name.toLowerCase() === name.toLowerCase() &&
          i.category === category &&
          !i.checked,
      )
      if (existing) {
        return prev.map((i) =>
          i.id === existing.id ? { ...i, qty: i.qty + qty } : i,
        )
      }
      return [
        ...prev,
        {
          id: newId(),
          name,
          qty,
          price: parsed,
          unit: itemUnit,
          category,
          brand: brand ?? null,
          packageSize: packageSize ?? null,
          checked: false,
          // Added mid-shop rather than planned beforehand.
          impulse: mode === 'shopping',
        },
      ]
    })

    setVault((prev) => {
      const remembered = rememberItem(prev, {
        name,
        category,
        price: parsed,
        qty,
        unit: itemUnit,
        brand,
        packageSize,
        storeId: priceStore,
      })
      // Attach the scanned code after the item exists, so the next scan of
      // this product recognises it without any lookup.
      return barcode ? rememberBarcode(remembered, name, barcode) : remembered
    })
  }

  const quickAddFromVault = (vaultItem) =>
    addItem({
      name: vaultItem.name,
      qty: vaultItem.defaultQty ?? 1,
      price: priceFor(vaultItem, activeStoreId),
      unit: vaultItem.unit ?? DEFAULT_UNIT,
      category: vaultItem.category,
    })

  /* ------------------------------------------------ product search + detail */

  /** Add from search, then close — the point of searching was to add it. */
  /**
   * A product picked from the bundled catalogue. Everything the catalogue
   * knows goes in — name, brand, barcode, pack size, guessed aisle — and the
   * price stays unknown, because Open Food Facts has none and the shelf is the
   * only honest source. Scanning that barcode later will now recognise it.
   */
  function addFromCatalogue(draft) {
    setSearching(false)
    if (searchFor === 'expiry') {
      setTrackTarget({ ...draft, id: null })
      return
    }
    addItem({
      name: draft.name,
      qty: draft.qty,
      price: null,
      unit: DEFAULT_UNIT,
      category: draft.category,
      barcode: draft.barcode,
      brand: draft.brand,
      packageSize: draft.packageSize,
    })
  }

  function addFromSearch(vaultItem) {
    setSearching(false)
    if (searchFor === 'expiry') {
      setTrackTarget(vaultItem)
      return
    }
    quickAddFromVault(vaultItem)
  }

  /**
   * "Manual" from the search sheet, and the landing spot for an online result:
   * open the full editor pre-filled with whatever we know, which may be
   * nothing but the words that were typed.
   */
  function manualFromSearch(name, product = null) {
    setSearching(false)
    setSheetItem({
      name: name ?? '',
      brand: product?.brand ?? null,
      category: product?.category ?? guessCategory(name ?? ''),
      barcode: product?.barcode ?? null,
      qty: 1,
      price: null,
      unit: DEFAULT_UNIT,
    })
  }

  /** Save an edit made in the product receipt back to the Vault. */
  function saveProduct(id, patch) {
    setVault((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch, id } : v)))
    setDetailId(null)
  }

  /**
   * Put a product in the fridge with a use-by. Links back to the Vault entry
   * and to the most recent purchase of it, so a future "money wasted" figure
   * has a price to work from and the item knows what it is.
   */
  function trackExpiry({ expiresAt, place, remindDays }) {
    const product = trackTarget
    setTrackTarget(null)
    if (!product) return

    const lastBuy = [...purchases]
      .filter((purchase) => purchase.productId === product.id)
      .sort((a, b) => b.purchasedAt - a.purchasedAt)[0]

    setPantry((prev) =>
      addPantryItem(prev, {
        name: product.name,
        category: product.category,
        qty: product.defaultQty ?? 1,
        unit: product.unit ?? DEFAULT_UNIT,
        expiresAt,
        place,
        remindDays,
        productId: product.id,
        purchaseId: lastBuy?.id ?? null,
        unitPrice: lastBuy?.price ?? priceFor(product, activeStoreId),
      }),
    )
  }

  function forgetProduct(id) {
    const product = vault.find((v) => v.id === id)
    if (!window.confirm(`Forget ${product?.name ?? 'this product'}? Its price history goes too.`)) {
      return
    }
    setVault((prev) => removeVaultItem(prev, id))
    setPurchases((prev) => prev.filter((purchase) => purchase.productId !== id))
    setDetailId(null)
  }

  /** A deleted custom category leaves its items somewhere real, not nowhere. */
  function reassignCategory(fromId, toId = 'other') {
    const fix = (item) => (item.category === fromId ? { ...item, category: toId } : item)
    setCarts((prev) => prev.map((c) => ({ ...c, items: (c.items ?? []).map(fix) })))
    setVault((prev) => prev.map(fix))
    setPantry((prev) => prev.map(fix))
  }

  const toggleItem = (id) => {
    const item = items.find((i) => i.id === id)
    // Only on the way into the trolley, and only while actually shopping —
    // asking on every tick during planning would be exhausting, and unticking
    // something is not a purchase.
    if (mode === 'shopping' && item && !item.checked) {
      setBuying(item)
      return
    }
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)))
  }

  /**
   * What you actually paid, from the shelf. Ticks the item, corrects the line,
   * and teaches the Vault — which is what makes the next list's estimate real.
   */
  function confirmBuying({ qty, price, storeId }) {
    const item = buying
    setBuying(null)
    if (!item) return

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, qty, price, storeId, checked: true } : i)),
    )

    // Remember the corrected price against the shop it was seen at. The
    // historical record is written on trip completion, so nothing already
    // archived is touched by this.
    if (isKnownPrice(price)) {
      setVault((prev) => rememberPrice(prev, item.name, price, storeId ?? activeStoreId))
    }
  }

  function updateItem(id, patch) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))

    const item = items.find((i) => i.id === id)
    if (!item) return

    // Correcting a price in the list teaches the Vault what it really costs,
    // at the store you're currently shopping.
    if (patch.price !== undefined && isKnownPrice(patch.price)) {
      setVault((prev) => rememberPrice(prev, item.name, patch.price, activeStoreId))
    }
    if (patch.unit !== undefined) {
      setVault((prev) => rememberUnit(prev, item.name, patch.unit))
    }
  }

  /**
   * Save from the full editor. An id means an edit in place; no id means a
   * new item, which goes through addItem so the Vault learns from it too.
   */
  function saveFromSheet(draft) {
    const { id, storeId, ...rest } = draft

    if (id) {
      updateItem(id, {
        ...rest,
        price: rest.price,
        qty: rest.qty,
      })
      setVault((prev) =>
        rememberItem(prev, {
          name: rest.name,
          category: rest.category,
          price: rest.price,
          qty: rest.qty,
          unit: rest.unit,
          brand: rest.brand,
          packageSize: rest.packageSize,
          storeId: storeId ?? activeStoreId,
        }),
      )
    } else {
      addItem({ ...rest, storeId: storeId ?? activeStoreId })
    }
    setSheetItem(null)
  }

  /**
   * Put a recipe's ingredients on a list. An ingredient already there gets
   * more of it rather than a duplicate row — two recipes both wanting onions
   * should mean more onions.
   */
  function addIngredientsToCart(cartId, ingredients) {
    setCarts((prev) =>
      updateCart(prev, cartId, (cart) => {
        const next = [...cart.items]
        for (const ing of ingredients) {
          const key = ing.name.trim().toLowerCase()
          const existing = next.find((i) => i.name.trim().toLowerCase() === key && !i.checked)
          if (existing) {
            next[next.indexOf(existing)] = { ...existing, qty: existing.qty + ing.qty }
          } else {
            next.push({
              id: newId(),
              name: ing.name,
              qty: ing.qty,
              unit: ing.unit,
              price: priceFor(findVaultItem(vault, ing.name), activeStoreId),
              category: ing.category,
              brand: null,
              packageSize: null,
              checked: false,
              impulse: false,
            })
          }
        }
        return { items: next }
      }),
    )
  }

  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id))

  const clearChecked = () => setItems((prev) => prev.filter((i) => !i.checked))

  function clearAll() {
    if (window.confirm('Clear this list? Your Vault and trip history are kept.')) {
      setItems([])
    }
  }

  // --- stores --------------------------------------------------------------

  /**
   * Switching stores re-prices the list from the Vault. Only items with a
   * real price on file at the new store move — an unpriced item keeps
   * whatever it had rather than being wiped.
   */
  function selectStore(storeId) {
    patchCart((cart) => ({
      storeId,
      items: storeId
        ? cart.items.map((item) => {
            const known = priceFor(findVaultItem(vault, item.name), storeId, {
              strict: true,
            })
            return known == null ? item : { ...item, price: known }
          })
        : cart.items,
    }))
  }

  const createStore = (name) => setStores((prev) => addStore(prev, name))

  function deleteStore(id) {
    setStores((prev) => removeStore(prev, id))
    setVault((prev) => forgetStorePrices(prev, id))
    // Any cart pointing at the deleted store falls back to no store.
    setCarts((prev) =>
      prev.map((c) => (c.storeId === id ? { ...c, storeId: null } : c)),
    )
  }

  // --- trips ---------------------------------------------------------------

  function reviewTrip() {
    const store = stores.find((s) => s.id === activeStoreId) ?? null
    const trip = completeTrip(activeCart, store)
    if (trip) setPendingTrip(trip)
  }

  function logPendingTrip(toTrack = []) {
    setTrips((prev) => [...prev, pendingTrip])
    // The Vault already knows the latest price; this is the record of every
    // price, which is what a history can be drawn from.
    setPurchases((prev) => recordTripPurchases(prev, pendingTrip, vault))
    // Fire and forget: a failed contribution must never interrupt finishing a
    // shop, and publishTripPrices reports rather than throws.
    publishTripPrices(pendingTrip, vault, { currency })

    if (toTrack.length > 0) {
      setPantry((prev) =>
        toTrack.reduce(
          (acc, item) =>
            addPantryItem(acc, {
              name: item.name,
              category: item.category,
              qty: item.qty,
              unit: item.unit,
              expiresAt: suggestedExpiry(item.category),
            }),
          prev,
        ),
      )
    }

    clearChecked()
    setPendingTrip(null)
    setMode('planning')
    setView('home')
  }

  const deleteTrip = (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id))
    // Otherwise the history would still show prices from a trip you deleted.
    setPurchases((prev) => forgetTripPurchases(prev, id))
  }

  /**
   * Write a validated backup straight to storage and reload. Reloading rather
   * than setting a dozen pieces of state keeps this honest — every hook
   * re-reads from storage on mount, so there's no chance of a stale slice
   * surviving the restore.
   */
  function restoreBackup(data) {
    try {
      for (const [key, value] of Object.entries(data)) {
        window.localStorage.setItem(key, JSON.stringify(value))
      }
      window.location.reload()
    } catch {
      window.alert("Couldn't write the restored data to this device's storage.")
    }
  }

  // --- render --------------------------------------------------------------

  const activeStore = stores.find((s) => s.id === activeStoreId) ?? null

  // First run, before anything else on screen.
  if (showOnboarding) {
    return <Onboarding base={import.meta.env.BASE_URL ?? '/'} onFinish={finishOnboarding} />
  }

  // The tour covers everything, including the nav.
  if (showTour) {
    return <TourScreen onDone={closeTour} />
  }

  /**
   * The rail belongs to Home. Anywhere else it is replaced by a single Back
   * control, so a section screen is the section and nothing else — and there
   * is only ever one way out of it.
   */
  /**
   * The swatch button and its popover. The list screen builds its own header
   * rather than going through chrome(), so this lives in both — changing the
   * look should be one tap from wherever you are, and the screen you are most
   * likely to be looking at is the list.
   */
  const lookControl = () => (
    <div className="app__look">
      <button
        className={`lookbtn ${lookOpen ? 'lookbtn--on' : ''}`}
        type="button"
        onClick={() => setLookOpen((open) => !open)}
        aria-label="Appearance"
        aria-expanded={lookOpen}
      >
        <span className="lookbtn__swatch" aria-hidden="true" />
      </button>
      {lookOpen && (
        <LookPopover look={look} onChange={changeLook} onClose={() => setLookOpen(false)} />
      )}
    </div>
  )

  /**
   * Sheets that any screen can raise. They used to live inside the list view's
   * JSX, which meant the Expiry screen could set `searching` and have nothing
   * appear — the flag was fine, the component was simply not mounted.
   */
  const overlays = () => (
    <>
    {searching && (
      <ProductSearch
        vault={vault}
        purchases={purchases}
        stores={stores}
        activeStoreId={activeStoreId}
        categoryFor={categoryFor}
        purpose={searchFor}
        onAdd={addFromSearch}
        onScan={() => {
          setSearching(false)
          setScanRequested(true)
        }}
        onManual={manualFromSearch}
        onOpenVault={() => {
          setSearching(false)
          setVaultOpen(true)
        }}
        onClose={() => setSearching(false)}
      />
    )}

    {whyVault && <VaultWhySheet onClose={() => setWhyVault(false)} />}

    {buying && (
      <BuyingSheet
        item={buying}
        stores={stores}
        activeStoreId={activeStoreId}
        categoryFor={categoryFor}
        onConfirm={confirmBuying}
        onCancel={() => setBuying(null)}
      />
    )}

    {trackTarget && (
      <TrackExpirySheet
        product={trackTarget}
        storeName={activeStore?.name ?? null}
        categoryFor={categoryFor}
        notifyState={notifyState}
        onEnableNotifications={enableNotifications}
        onAdd={trackExpiry}
        onCancel={() => setTrackTarget(null)}
      />
    )}

    {detailId && vault.find((v) => v.id === detailId) && (
      <ProductDetail
        item={vault.find((v) => v.id === detailId)}
        purchases={purchases}
        stores={stores}
        categories={categories}
        onSave={(patch) => saveProduct(detailId, patch)}
        onTrackExpiry={() => {
          const product = vault.find((v) => v.id === detailId)
          setDetailId(null)
          setTrackTarget(product)
        }}
        onDelete={() => forgetProduct(detailId)}
        onClose={() => setDetailId(null)}
      />
    )}

    </>
  )

  const chrome = (children) => {
    const atHome = view === 'home'
    return (
      <>
        <div className={`app ${atHome ? 'app--tabbed' : 'app--inner'}`} key={view}>
          <header className="app__header">
            {atHome ? (
              <span className="app__brand">
                <Icon name="cart" size={22} strokeWidth={1.9} /> CartWise
              </span>
            ) : (
              <button className="backbtn" type="button" onClick={() => setView('home')}>
                <span className="backbtn__chevron" aria-hidden="true">
                  ‹
                </span>
                Home
              </button>
            )}

            {lookControl()}
          </header>
          {children}
        </div>
        {atHome && (
          <NavBar view={view} onNavigate={setView} alerts={needsAttention(pantry)} />
        )}
        {overlays()}
      </>
    )
  }

  if (view === 'expiry') {
    return chrome(
      <ExpiryScreen
        pantry={pantry}
        vault={vault}
        photos={photos}
        notifyState={notifyState}
        onEnableNotifications={enableNotifications}
        onAdd={(item) => setPantry((prev) => addPantryItem(prev, item))}
        onRemove={(id) => setPantry((prev) => removePantryItem(prev, id))}
        onResolve={(id, status) => setPantry((prev) => resolvePantryItem(prev, id, status))}
        onUpdate={(id, patch) => setPantry((prev) => updatePantryItem(prev, id, patch))}
        onPhoto={(name, category) => setPhotoTarget({ name, category })}
        onTrackPurchased={() => {
          setSearchFor('expiry')
          setSearching(true)
        }}
      />,
    )
  }

  if (view === 'recipes') {
    return chrome(
      <>
        <RecipesScreen
          recipes={recipes}
          carts={carts}
          onCreate={(name) => setRecipes((prev) => addRecipe(prev, name))}
          onUpdate={(id, patch) => setRecipes((prev) => updateRecipe(prev, id, patch))}
          onRemove={(id) => setRecipes((prev) => removeRecipe(prev, id))}
          onAddToList={addIngredientsToCart}
        />
        <MealPlan
          plan={mealPlan}
          recipes={recipes}
          carts={carts}
          onChange={setMealPlan}
          onAddToList={addIngredientsToCart}
        />
      </>,
    )
  }

  if (view === 'trips') {
    const shopRows = storesByDistance(stores, here)
    return chrome(
      <div className="tripsview">
        <header className="screen-head">
          <h1 className="screen-head__title">Trips</h1>
          <button className="btn btn--ghost btn--small" type="button" onClick={locateMe}>
            {here ? 'Update my location' : 'Where am I?'}
          </button>
        </header>

        {stores.length > 0 && (
          <section className="shopsview">
            <h2 className="screen-sub">Where you shop</h2>
            {geoNote && <p className="mapbox__note mapbox__note--offline">{geoNote}</p>}
            <StoreMap stores={stores} here={here} />
            <ul className="shoplist">
              {shopRows.map(({ store, km }) => (
                <li className="shoprow" key={store.id}>
                  <span className="shoprow__text">
                    <span className="shoprow__name">{store.name}</span>
                    <span className="shoprow__meta">
                      {km !== null
                        ? formatDistance(km)
                        : isLocation(store.location)
                          ? 'Location saved'
                          : 'No location yet'}
                    </span>
                  </span>
                  <button
                    className="btn btn--ghost btn--small"
                    type="button"
                    onClick={() => saveStoreLocation(store.id)}
                  >
                    {isLocation(store.location) ? 'Update' : 'Save this location'}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mapbox__note">
              Locations are saved per shop and never leave this device. Community
              price reports carry the shop name and the day, never a coordinate.
            </p>
          </section>
        )}

        <h2 className="screen-sub">History</h2>
        {trips.length === 0 ? (
          <p className="empty">
            Your shopping history starts here. Finish a trip and CartWise keeps
            what you bought, what it cost, and how it landed against your
            budget — which is what everything else here is built from.
          </p>
        ) : (
          <Insights trips={trips} onDeleteTrip={deleteTrip} startOpen />
        )}
      </div>,
    )
  }

  if (view === 'vault') {
    return chrome(
      <VaultScreen
        vault={vault}
        purchases={purchases}
        aisleOrder={aisleOrder}
        categoryFor={categoryFor}
        onList={items.map((i) => i.name)}
        onOpenProduct={setDetailId}
        onWhy={() => setWhyVault(true)}
        onAddToList={(item) => {
          quickAddFromVault(item)
          setView('list')
        }}
      />,
    )
  }

  if (view === 'categories') {
    return chrome(
      <CategoryLibrary
        categories={allCategoriesFor}
        library={categoryLibrary}
        order={aisleOrder}
        counts={categoryCounts}
        onLibraryChange={setCategoryLibrary}
        onOrderChange={setAisleOrder}
        onReassign={reassignCategory}
      />,
    )
  }

  if (view === 'settings') {
    return chrome(
      <SettingsScreen
        name={displayName}
        onNameChange={setDisplayName}
        currency={currency}
        onCurrencyChange={changeCurrency}
        accent={look.accent}
        onAccentChange={(id) => changeLook({ ...look, accent: id })}
        texture={look.texture}
        onTextureChange={(id) => changeLook({ ...look, texture: id })}
        stickerStyle={stickerStyle}
        onStickerStyleChange={setStickerStyle}
        onRestore={restoreBackup}
        onShowTour={() => setShowTour(true)}
        onOpenCategories={() => setView('categories')}
        contributing={contributing}
        onContributingChange={setContributing}
        syncReady={syncAvailable()}
      />,
    )
  }

  if (view === 'home') {
    return chrome(
      <>
      <InstallHint />
      <GettingStarted carts={carts} trips={trips} purchases={purchases} vault={vault} />
      <HomeScreen
        carts={carts}
        trips={trips}
        pantry={pantry}
        listPhotos={listPhotos}
        name={displayName}
        onOpenCart={openCart}
        onNewCart={createCart}
        onOpenExpiry={() => setView('expiry')}
        vault={vault}
        purchases={purchases}
        onOpenVault={() => setView('vault')}
      />
      </>,
    )
  }

  if (!activeCart) {
    return (
      <div className="app">
        <p className="empty">
          No lists yet.{' '}
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => createCart('Groceries')}
          >
            Start one
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app__header">
        <button className="backbtn" type="button" onClick={() => setView('home')}>
          <span className="backbtn__chevron" aria-hidden="true">
            ‹
          </span>
          Home
        </button>
        <span className="app__breadcrumb">
          {mode === 'planning' ? 'Planning' : 'Shopping'}
          {mode === 'shopping' && <> · {tripDateLabel}</>}
          {activeStore && <> · {activeStore.name}</>}
        </span>
        {lookControl()}
      </header>

      <CartTabs
        carts={carts}
        activeId={activeCart.id}
        onSelect={openCart}
        onAdd={createCart}
        onRename={(id, name) => setCarts((prev) => renameCart(prev, id, name))}
        onRemove={deleteCart}
      />

      <BudgetBar
        title={activeCart.name}
        budget={activeCart.budget}
        onBudgetChange={(budget) => patchCart({ budget })}
        listTotal={listTotal}
        cartTotal={cartTotal}
        unpriced={unpriced}
        background={backgroundStyle(
          backgroundOf(activeCart, listPhotos[activeCart.id]),
          listPhotos[activeCart.id],
        )}
        onPhoto={backgroundOf(activeCart, listPhotos[activeCart.id]) === PHOTO_BACKGROUND}
        onPickBackground={() => setPickingBackground(true)}
      />

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Mode">
          {['planning', 'shopping'].map((m) => (
            <button
              key={m}
              type="button"
              className={`segmented__btn ${mode === m ? 'segmented__btn--on' : ''}`}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
            >
              {m === 'planning' ? 'Planning' : 'Shopping'}
            </button>
          ))}
        </div>

        <div className="sortbar">
          <button
            className="searchbtn"
            type="button"
            onClick={() => {
              setSearchFor('list')
              setSearching(true)
            }}
            aria-label="Search for a product"
            title="Search for a product to add"
          >
            <Icon name="search" size={16} />
          </button>
          <div className="segmented segmented--sort" role="group" aria-label="Sort">
            <button
              type="button"
              className={`segmented__btn ${sortMode === 'aisle' ? 'segmented__btn--on' : ''}`}
              onClick={() => setSortMode('aisle')}
              aria-pressed={sortMode === 'aisle'}
              title="Group by aisle"
            >
              <Icon name="basket" size={16} />
            </button>
            <button
              type="button"
              className={`segmented__btn ${sortMode === 'all' ? 'segmented__btn--on' : ''}`}
              onClick={() => setSortMode('all')}
              aria-pressed={sortMode === 'all'}
              title="One list, no aisles"
            >
              All
            </button>
            <button
              type="button"
              className={`segmented__btn ${sortMode === 'az' ? 'segmented__btn--on' : ''}`}
              onClick={() => setSortMode('az')}
              aria-pressed={sortMode === 'az'}
              title="Sort A–Z"
            >
              Abc
            </button>
          </div>

        </div>
      </div>

      {/* Available in both modes: forgetting something is exactly what happens
          mid-shop, and those additions are what impulse tracking measures.
          Collapsed by default now — it was ~200px of form above every list,
          and the floating + is the way in. */}
      <AddItemForm
        collapsed={!addOpen}
        onCollapsedChange={(next) => setAddOpen(!next)}
        categories={categories}
        openScanner={scanRequested}
        onScannerHandled={() => setScanRequested(false)}
        onAdd={addItem}
        onOpenSheet={(draft) => setSheetItem(draft)}
        vault={vault}
        activeStoreId={activeStoreId}
      />

      {mode === 'planning' && (
        <>
          <StoreBar
            stores={stores}
            activeId={activeStoreId}
            onSelect={selectStore}
            onAdd={createStore}
            onRemove={deleteStore}
          />

          {vaultOpen && (
          <VaultPanel
            open={vaultOpen}
            onOpenChange={setVaultOpen}
            purchases={purchases}
            categoryFor={categoryFor}
            onWhy={() => setWhyVault(true)}
            onOpenProduct={setDetailId}
            onTrackExpiry={setTrackTarget}
            vault={vault}
            stores={stores}
            aisleOrder={aisleOrder}
            activeStoreId={activeStoreId}
            onQuickAdd={quickAddFromVault}
            onRemove={(id) => setVault((prev) => removeVaultItem(prev, id))}
            onList={names}
          />
          )}

          <BeforeYouGo summary={planningSummary}>
            <BasketCompare items={items} reports={priceReports} currency={currency} />

            <StoreCompare
              comparison={comparison}
              stores={stores}
              activeId={activeStoreId}
              onSelect={selectStore}
            />

            <SplitShop plan={split} stores={stores} />

            <RestockPanel
              trips={trips}
              items={items}
              onAdd={(suggestion) =>
                addItem({
                  name: suggestion.name,
                  qty: 1,
                  price: priceFor(findVaultItem(vault, suggestion.name), activeStoreId),
                  unit: suggestion.unit ?? DEFAULT_UNIT,
                  category: suggestion.category,
                })
              }
            />
          </BeforeYouGo>
        </>
      )}

      <main className="app__list">
        {grouped.length === 0 ? (
          <p className="empty">
            Nothing on this list yet. Add your first item above — CartWise sorts
            it into the right aisle and remembers the price for next time.
          </p>
        ) : (
          grouped.map(({ category, items: groupItems }) => (
            <CategorySection
              key={category.id}
              category={category}
              items={groupItems}
              deltas={deltas}
              shopping={mode === 'shopping'}
              photos={photos}
              onPhoto={(name, category) => setPhotoTarget({ name, category })}
              onEdit={(row) => setSheetItem(row)}
              onToggle={toggleItem}
              onUpdate={updateItem}
              onRemove={removeItem}
            />
          ))
        )}
      </main>

      {/* The running state of the trip, in words, above the sticky bar — which
          only ever has room for the count and the total. */}
      {mode === 'shopping' && items.length > 0 && (
        <p className="fulfilled">
          {checkedCount}/{items.length} items fulfilled, totalling{' '}
          <strong>{formatMoney(cartTotal)}</strong>
          {activeCart.budget > 0 && (
            <>
              {' · '}
              <span
                className={
                  listTotal > activeCart.budget ? 'fulfilled__over' : 'fulfilled__left'
                }
              >
                {listTotal > activeCart.budget
                  ? `${formatMoney(listTotal - activeCart.budget)} over budget`
                  : `${formatMoney(activeCart.budget - cartTotal)} left`}
              </span>
            </>
          )}
        </p>
      )}

      {mode === 'planning' && <Insights trips={trips} onDeleteTrip={deleteTrip} />}

      {/* One obvious way to add something, in the corner a thumb reaches.
          Opens the search sheet, which already carries Scan, Manual and Vault
          — so nothing that used to be on this screen became unreachable. */}
      <button
        className={`fab ${items.length > 0 ? 'fab--raised' : ''}`}
        type="button"
        onClick={() => {
          setSearchFor('list')
          setSearching(true)
        }}
        aria-label="Add an item"
      >
        <span aria-hidden="true">+</span>
      </button>

      {items.length > 0 && (
        <div className="basket">
          <span className="basket__count" aria-hidden="true">
            {checkedCount}
          </span>
          <span className="basket__text">
            {checkedCount}/{items.length} in the cart ·{' '}
            <strong>{formatMoney(cartTotal)}</strong>
          </span>
          <button
            className="btn btn--primary"
            type="button"
            onClick={reviewTrip}
            disabled={checkedCount === 0}
          >
            Finish trip
          </button>
        </div>
      )}

      <TripReceipt
        trip={pendingTrip}
        photos={photos}
        onConfirm={logPendingTrip}
        onCancel={() => setPendingTrip(null)}
      />

      {pickingBackground && (
        <BackgroundPicker
          listName={activeCart.name}
          current={backgroundOf(activeCart, listPhotos[activeCart.id])}
          photo={listPhotos[activeCart.id]}
          note={photoNote}
          onPick={(background) => patchCart({ background })}
          onPickPhoto={(file) => saveListPhoto(activeCart.id, file)}
          onRemovePhoto={() => removeListPhoto(activeCart.id)}
          onClose={() => {
            setPhotoNote(null)
            setPickingBackground(false)
          }}
        />
      )}

      {overlays()}

      {sheetItem && (
        <ItemSheet
          categories={categories}
          item={sheetItem}
          stores={stores}
          activeStoreId={activeStoreId}
          photos={photos}
          onSave={saveFromSheet}
          onPhoto={(name, category) => setPhotoTarget({ name, category })}
          onCancel={() => setSheetItem(null)}
        />
      )}

      {photoTarget && (
        <PhotoCapture
          name={photoTarget.name}
          existing={photos[photoKey(photoTarget.name)] ?? null}
          onSave={savePhoto}
          onRemove={deletePhoto}
          onCancel={() => setPhotoTarget(null)}
        />
      )}

      {items.length > 0 && mode === 'planning' && (
        <footer className="app__footer">
          <button
            className="btn btn--ghost"
            type="button"
            onClick={clearChecked}
            disabled={checkedCount === 0}
          >
            Clear checked
          </button>
          <button className="btn btn--ghost btn--danger" type="button" onClick={clearAll}>
            Clear all
          </button>
        </footer>
      )}
    </div>
  )
}
