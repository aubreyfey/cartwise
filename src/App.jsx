import { useEffect, useMemo, useState } from 'react'
import AddItemForm from './components/AddItemForm.jsx'
import BudgetBar from './components/BudgetBar.jsx'
import CartTabs from './components/CartTabs.jsx'
import AccountPanel from './components/AccountPanel.jsx'
import CategorySection from './components/CategorySection.jsx'
import DataPanel from './components/DataPanel.jsx'
import ExpiryScreen from './components/ExpiryScreen.jsx'
import HomeScreen from './components/HomeScreen.jsx'
import Insights from './components/Insights.jsx'
import ItemSheet from './components/ItemSheet.jsx'
import PhotoCapture from './components/PhotoCapture.jsx'
import TourScreen from './components/TourScreen.jsx'
import StoreBar from './components/StoreBar.jsx'
import StoreCompare from './components/StoreCompare.jsx'
import TripReceipt from './components/TripReceipt.jsx'
import VaultPanel from './components/VaultPanel.jsx'
import { CATEGORIES } from './categories.js'
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
  removePantryItem,
  suggestedExpiry,
  updatePantryItem,
} from './pantry.js'
import { addStore, compareStores, removeStore } from './stores.js'
import { DEFAULT_UNIT } from './units.js'
import { readStored, removeStored, useLocalStorage } from './useLocalStorage.js'
import { completeTrip } from './trips.js'
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
  const [pantry, setPantry] = useLocalStorage('cartwise.pantry', [])
  const [sortMode, setSortMode] = useLocalStorage('cartwise.sort', 'aisle')
  const [mode, setMode] = useState('planning')
  // 'home' | 'list' | 'expiry'
  const [view, setView] = useState('home')
  // Mirrors the module-level currency so changing it re-renders every price.
  const [currency, setCurrencyState] = useState(getCurrency)
  // Photo cut-outs live outside useLocalStorage: they're the one thing big
  // enough to fail a write, and a silently dropped sticker is worse than an
  // error message.
  const [photos, setPhotos] = useState(loadPhotos)
  const [photoTarget, setPhotoTarget] = useState(null)
  // The full item editor: a draft for a new item, or an existing row.
  const [sheetItem, setSheetItem] = useState(null)
  // The tour opens itself once, for someone who has never used the app.
  const [tourSeen, setTourSeen] = useLocalStorage(TOUR_SEEN_KEY, false)
  const [showTour, setShowTour] = useState(false)

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
  }, [])

  // Show the tour once, and only to someone with nothing in the app yet —
  // anyone with lists already has worked it out without our help.
  useEffect(() => {
    if (!tourSeen) {
      const untouched = carts.every((c) => c.items.length === 0) && trips.length === 0
      if (untouched) setShowTour(true)
      else setTourSeen(true)
    }
    // Runs once on mount; later state changes must not reopen it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function closeTour() {
    setShowTour(false)
    setTourSeen(true)
  }

  // A stored id can point at a cart that's since been deleted.
  const activeCart = findCart(carts, activeCartId) ?? carts[0]
  const activeStoreId = activeCart?.storeId ?? null
  const items = useMemo(() => activeCart?.items ?? [], [activeCart])

  const { listTotal, unpriced, cartTotal, checkedCount, grouped, names } = useMemo(() => {
    const { total: listTotal, unpriced } = sumLines(items)
    const checked = items.filter((i) => i.checked)
    const { total: cartTotal } = sumLines(checked)

    const grouped =
      sortMode === 'az'
        ? [
            {
              category: ALL,
              items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
            },
          ]
        : // Keep CATEGORIES order (store walk order) and drop empty aisles.
          CATEGORIES.map((category) => ({
            category,
            items: items.filter((i) => i.category === category.id),
          })).filter((group) => group.items.length > 0)

    return {
      listTotal,
      unpriced,
      cartTotal,
      checkedCount: checked.length,
      grouped,
      names: items.map((i) => i.name),
    }
  }, [items, sortMode])

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

  // --- cart plumbing -------------------------------------------------------

  const patchCart = (patch) =>
    setCarts((prev) => updateCart(prev, activeCart.id, patch))

  const setItems = (updater) =>
    patchCart((cart) => ({
      items: typeof updater === 'function' ? updater(cart.items) : updater,
    }))

  function createCart(name) {
    const next = addCart(carts, name)
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

  const toggleItem = (id) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
    )

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

  const deleteTrip = (id) => setTrips((prev) => prev.filter((t) => t.id !== id))

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

  if (view === 'expiry') {
    return (
      <div className="app">
        <ExpiryScreen
          pantry={pantry}
          vault={vault}
          onAdd={(item) => setPantry((prev) => addPantryItem(prev, item))}
          onRemove={(id) => setPantry((prev) => removePantryItem(prev, id))}
          onUpdate={(id, patch) => setPantry((prev) => updatePantryItem(prev, id, patch))}
          onBack={() => setView('home')}
        />
      </div>
    )
  }

  if (showTour) {
    return <TourScreen onDone={closeTour} />
  }

  if (view === 'home') {
    return (
      <div className="app">
        <header className="app__header">
          <span className="app__brand">
            <Icon name="cart" size={22} strokeWidth={1.9} /> Cartwise
          </span>
        </header>
        <HomeScreen
          carts={carts}
          trips={trips}
          pantry={pantry}
          currency={currency}
          onCurrencyChange={changeCurrency}
          onOpenCart={openCart}
          onNewCart={() => createCart()}
          onOpenExpiry={() => setView('expiry')}
          onDeleteTrip={deleteTrip}
        />
        <button className="tour__open" type="button" onClick={() => setShowTour(true)}>
          <Icon name="sparkle" size={17} /> What Cartwise does
        </button>
        <AccountPanel />
        <DataPanel onRestore={restoreBackup} />
      </div>
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
        <button className="screen-head__back" type="button" onClick={() => setView('home')}>
          ‹ Home
        </button>
        <span className="app__breadcrumb">
          {mode === 'planning' ? 'Planning' : 'Shopping'}
          {activeStore && <> · {activeStore.name}</>}
        </span>
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
            className={`segmented__btn ${sortMode === 'az' ? 'segmented__btn--on' : ''}`}
            onClick={() => setSortMode('az')}
            aria-pressed={sortMode === 'az'}
            title="Sort A–Z"
          >
            Abc
          </button>
        </div>
      </div>

      {/* Available in both modes: forgetting something is exactly what happens
          mid-shop, and those additions are what impulse tracking measures. */}
      <AddItemForm
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

          <VaultPanel
            vault={vault}
            activeStoreId={activeStoreId}
            onQuickAdd={quickAddFromVault}
            onRemove={(id) => setVault((prev) => removeVaultItem(prev, id))}
            onList={names}
          />

          <StoreCompare
            comparison={comparison}
            stores={stores}
            activeId={activeStoreId}
            onSelect={selectStore}
          />
        </>
      )}

      <main className="app__list">
        {grouped.length === 0 ? (
          <p className="empty">
            Nothing on this list yet. Add your first item above — Cartwise sorts
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

      {mode === 'planning' && <Insights trips={trips} onDeleteTrip={deleteTrip} />}

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

      {sheetItem && (
        <ItemSheet
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
