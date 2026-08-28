// The things people actually write on a grocery list.
//
// The bundled catalogue comes from Open Food Facts, which is a database of
// *packaged* food. It is excellent at Sky Flakes and Bear Brand and knows
// essentially nothing about a carrot. Searching the shipped Philippine
// catalogue finds zero results for "carrot" and zero for "cabbage", and the
// five hits for "rice" are all rice crackers.
//
// Which is a problem, because a grocery list is mostly unbranded staples:
// rice, eggs, onions, chicken, cooking oil. Someone typing "rice" wants
// "Rice", not "Nissin Rice Crackers 60g".
//
// So this is the other half of search: a curated list of generic items with a
// sensible aisle and unit. No barcodes and no brands, because these are
// categories of thing rather than products. It is small enough to sit in the
// main bundle, needs no network, and works in any country — regional entries
// are additive, so a Filipino shopper finds kangkong and everyone else still
// finds spinach.
//
// Entries are [name, category, unit, ...aliases]. Aliases carry the local or
// alternative names people actually type.

const S = (name, category, unit = 'pc', ...aliases) => ({ name, category, unit, aliases })

export const STAPLES = [
  // --- Produce -------------------------------------------------------------
  S('Bananas', 'produce', 'kg', 'saging'),
  S('Apples', 'produce', 'kg'),
  S('Oranges', 'produce', 'kg'),
  S('Calamansi', 'produce', 'kg', 'kalamansi'),
  S('Lemons', 'produce', 'pc'),
  S('Limes', 'produce', 'pc'),
  S('Mangoes', 'produce', 'kg', 'mangga'),
  S('Papaya', 'produce', 'kg'),
  S('Pineapple', 'produce', 'pc'),
  S('Watermelon', 'produce', 'pc', 'pakwan'),
  S('Grapes', 'produce', 'kg'),
  S('Avocado', 'produce', 'pc'),
  S('Strawberries', 'produce', 'pack'),
  S('Melon', 'produce', 'pc'),
  S('Tomatoes', 'produce', 'kg', 'kamatis'),
  S('Onions', 'produce', 'kg', 'sibuyas'),
  S('Red onions', 'produce', 'kg'),
  S('Spring onions', 'produce', 'bunch', 'scallions', 'green onions'),
  S('Garlic', 'produce', 'kg', 'bawang'),
  S('Ginger', 'produce', 'kg', 'luya'),
  S('Potatoes', 'produce', 'kg', 'patatas'),
  S('Sweet potato', 'produce', 'kg', 'kamote'),
  S('Carrots', 'produce', 'kg', 'karot'),
  S('Cabbage', 'produce', 'pc', 'repolyo'),
  S('Lettuce', 'produce', 'pc'),
  S('Spinach', 'produce', 'bunch'),
  S('Kangkong', 'produce', 'bunch', 'water spinach'),
  S('Malunggay', 'produce', 'bunch', 'moringa'),
  S('Pechay', 'produce', 'bunch', 'bok choy', 'pak choi'),
  S('Broccoli', 'produce', 'pc'),
  S('Cauliflower', 'produce', 'pc'),
  S('Cucumber', 'produce', 'pc', 'pipino'),
  S('Eggplant', 'produce', 'kg', 'talong', 'aubergine'),
  S('Okra', 'produce', 'kg'),
  S('Sitaw', 'produce', 'bunch', 'string beans', 'long beans'),
  S('Green beans', 'produce', 'kg'),
  S('Bell pepper', 'produce', 'pc', 'capsicum', 'siling bell'),
  S('Chili', 'produce', 'pack', 'sili', 'siling labuyo'),
  S('Squash', 'produce', 'kg', 'kalabasa', 'pumpkin'),
  S('Ampalaya', 'produce', 'kg', 'bitter gourd', 'bitter melon'),
  S('Sayote', 'produce', 'kg', 'chayote'),
  S('Corn', 'produce', 'pc', 'mais'),
  S('Mushrooms', 'produce', 'pack'),
  S('Celery', 'produce', 'bunch'),
  S('Beansprouts', 'produce', 'pack', 'togue'),
  S('Coconut', 'produce', 'pc', 'niyog'),

  // --- Meat & seafood ------------------------------------------------------
  S('Chicken', 'meat', 'kg', 'manok'),
  S('Chicken breast', 'meat', 'kg'),
  S('Chicken thighs', 'meat', 'kg'),
  S('Chicken wings', 'meat', 'kg'),
  S('Whole chicken', 'meat', 'pc'),
  S('Pork', 'meat', 'kg', 'baboy'),
  S('Pork belly', 'meat', 'kg', 'liempo'),
  S('Ground pork', 'meat', 'kg', 'giniling'),
  S('Pork chops', 'meat', 'kg'),
  S('Beef', 'meat', 'kg', 'baka'),
  S('Ground beef', 'meat', 'kg', 'mince'),
  S('Beef brisket', 'meat', 'kg'),
  S('Bacon', 'meat', 'pack'),
  S('Hotdogs', 'meat', 'pack'),
  S('Longganisa', 'meat', 'pack', 'sausage'),
  S('Tocino', 'meat', 'pack'),
  S('Tapa', 'meat', 'pack'),
  S('Ham', 'meat', 'pack'),
  S('Fish', 'meat', 'kg', 'isda'),
  S('Bangus', 'meat', 'kg', 'milkfish'),
  S('Tilapia', 'meat', 'kg'),
  S('Galunggong', 'meat', 'kg', 'round scad'),
  S('Tuna', 'meat', 'kg'),
  S('Salmon', 'meat', 'kg'),
  S('Shrimp', 'meat', 'kg', 'hipon', 'prawns'),
  S('Squid', 'meat', 'kg', 'pusit'),
  S('Crab', 'meat', 'kg', 'alimango'),
  S('Mussels', 'meat', 'kg', 'tahong'),
  S('Tinapa', 'meat', 'pack', 'smoked fish'),
  S('Daing', 'meat', 'pack', 'dried fish', 'tuyo'),

  // --- Dairy & eggs --------------------------------------------------------
  S('Eggs', 'dairy', 'tray', 'itlog'),
  S('Milk', 'dairy', 'L', 'gatas'),
  S('Fresh milk', 'dairy', 'L'),
  S('Evaporated milk', 'dairy', 'can'),
  S('Condensed milk', 'dairy', 'can'),
  S('Powdered milk', 'dairy', 'pack'),
  S('Butter', 'dairy', 'pack', 'mantikilya'),
  S('Margarine', 'dairy', 'tub'),
  S('Cheese', 'dairy', 'pack', 'keso'),
  S('Cheddar cheese', 'dairy', 'pack'),
  S('Quickmelt cheese', 'dairy', 'pack'),
  S('Cream cheese', 'dairy', 'pack'),
  S('Yogurt', 'dairy', 'tub'),
  S('Cream', 'dairy', 'pack', 'all purpose cream'),
  S('Ice cream', 'frozen', 'tub'),

  // --- Bakery --------------------------------------------------------------
  S('Bread', 'bakery', 'loaf', 'tinapay'),
  S('White bread', 'bakery', 'loaf'),
  S('Wheat bread', 'bakery', 'loaf'),
  S('Pandesal', 'bakery', 'pack'),
  S('Buns', 'bakery', 'pack'),
  S('Tortillas', 'bakery', 'pack'),
  S('Cake', 'bakery', 'pc'),
  S('Doughnuts', 'bakery', 'pack', 'donuts'),
  S('Croissant', 'bakery', 'pc'),

  // --- Pantry --------------------------------------------------------------
  S('Rice', 'pantry', 'kg', 'bigas'),
  S('Brown rice', 'pantry', 'kg'),
  S('Glutinous rice', 'pantry', 'kg', 'malagkit'),
  S('Flour', 'pantry', 'kg', 'harina'),
  S('Sugar', 'pantry', 'kg', 'asukal'),
  S('Brown sugar', 'pantry', 'kg'),
  S('Salt', 'pantry', 'pack', 'asin'),
  S('Pepper', 'pantry', 'pack', 'paminta'),
  S('Cooking oil', 'pantry', 'L', 'mantika'),
  S('Olive oil', 'pantry', 'bottle'),
  S('Vinegar', 'pantry', 'bottle', 'suka'),
  S('Soy sauce', 'pantry', 'bottle', 'toyo'),
  S('Fish sauce', 'pantry', 'bottle', 'patis'),
  S('Oyster sauce', 'pantry', 'bottle'),
  S('Bagoong', 'pantry', 'jar', 'shrimp paste'),
  S('Ketchup', 'pantry', 'bottle', 'catsup'),
  S('Mayonnaise', 'pantry', 'jar'),
  S('Tomato sauce', 'pantry', 'pack'),
  S('Tomato paste', 'pantry', 'can'),
  S('Pasta', 'pantry', 'pack', 'spaghetti', 'macaroni'),
  S('Noodles', 'pantry', 'pack', 'pancit', 'bihon'),
  S('Instant noodles', 'pantry', 'pack', 'ramen'),
  S('Canned tuna', 'pantry', 'can'),
  S('Sardines', 'pantry', 'can'),
  S('Corned beef', 'pantry', 'can'),
  S('Luncheon meat', 'pantry', 'can', 'spam'),
  S('Beans', 'pantry', 'can'),
  S('Peanut butter', 'pantry', 'jar'),
  S('Jam', 'pantry', 'jar'),
  S('Honey', 'pantry', 'bottle'),
  S('Oats', 'pantry', 'pack', 'oatmeal'),
  S('Cereal', 'pantry', 'box'),
  S('Coffee', 'pantry', 'pack', 'kape'),
  S('Instant coffee', 'pantry', 'pack'),
  S('Tea', 'pantry', 'box'),
  S('Cocoa', 'pantry', 'pack', 'milo'),
  S('Baking powder', 'pantry', 'pack'),
  S('Baking soda', 'pantry', 'pack'),
  S('Yeast', 'pantry', 'pack'),
  S('Cornstarch', 'pantry', 'pack'),
  S('Breadcrumbs', 'pantry', 'pack'),
  S('Bouillon cubes', 'pantry', 'pack', 'magic sarap', 'knorr cubes'),
  S('Curry powder', 'pantry', 'pack'),
  S('Chili sauce', 'pantry', 'bottle'),
  S('Coconut milk', 'pantry', 'can', 'gata'),
  S('Tofu', 'pantry', 'pack', 'tokwa'),

  // --- Frozen --------------------------------------------------------------
  S('Frozen vegetables', 'frozen', 'pack'),
  S('Frozen fries', 'frozen', 'pack'),
  S('Frozen pizza', 'frozen', 'pc'),
  S('Fish fillet', 'frozen', 'pack'),
  S('Nuggets', 'frozen', 'pack'),
  S('Siomai', 'frozen', 'pack'),
  S('Lumpia wrapper', 'frozen', 'pack'),
  S('Ice', 'frozen', 'bag'),

  // --- Snacks --------------------------------------------------------------
  S('Chips', 'snacks', 'pack'),
  S('Biscuits', 'snacks', 'pack', 'crackers'),
  S('Chocolate', 'snacks', 'bar', 'tsokolate'),
  S('Candy', 'snacks', 'pack'),
  S('Nuts', 'snacks', 'pack', 'peanuts', 'mani'),
  S('Popcorn', 'snacks', 'pack'),
  S('Cookies', 'snacks', 'pack'),

  // --- Drinks --------------------------------------------------------------
  S('Water', 'drinks', 'bottle', 'tubig', 'mineral water'),
  S('Soda', 'drinks', 'bottle', 'softdrinks', 'coke', 'cola'),
  S('Juice', 'drinks', 'bottle'),
  S('Beer', 'drinks', 'pack'),
  S('Wine', 'drinks', 'bottle'),
  S('Sports drink', 'drinks', 'bottle', 'gatorade'),
  S('Iced tea', 'drinks', 'pack'),
  S('Energy drink', 'drinks', 'can'),

  // --- Household -----------------------------------------------------------
  S('Dish soap', 'household', 'bottle', 'dishwashing liquid'),
  S('Laundry detergent', 'household', 'pack', 'sabon panlaba'),
  S('Fabric conditioner', 'household', 'pack', 'downy'),
  S('Bleach', 'household', 'bottle', 'zonrox'),
  S('Toilet paper', 'household', 'pack', 'tissue'),
  S('Paper towels', 'household', 'pack'),
  S('Trash bags', 'household', 'pack', 'garbage bags'),
  S('Sponge', 'household', 'pc'),
  S('Dishwashing paste', 'household', 'tub'),
  S('Floor cleaner', 'household', 'bottle'),
  S('Insect spray', 'household', 'can', 'baygon'),
  S('Air freshener', 'household', 'can'),
  S('Aluminium foil', 'household', 'roll'),
  S('Cling wrap', 'household', 'roll'),
  S('Batteries', 'household', 'pack'),
  S('Light bulb', 'household', 'pc'),
  S('Matches', 'household', 'box'),
  S('Candles', 'household', 'pack'),

  // --- Personal care (household aisle, since there is no toiletries aisle) --
  S('Shampoo', 'household', 'bottle'),
  S('Conditioner', 'household', 'bottle'),
  S('Soap', 'household', 'pack', 'sabon'),
  S('Body wash', 'household', 'bottle'),
  S('Toothpaste', 'household', 'tube'),
  S('Toothbrush', 'household', 'pc'),
  S('Deodorant', 'household', 'pc'),
  S('Razor', 'household', 'pack'),
  S('Shaving cream', 'household', 'can'),
  S('Sanitary pads', 'household', 'pack', 'napkins'),
  S('Diapers', 'household', 'pack'),
  S('Baby wipes', 'household', 'pack'),
  S('Cotton buds', 'household', 'pack'),
  S('Alcohol', 'household', 'bottle', 'rubbing alcohol'),
  S('Hand sanitiser', 'household', 'bottle', 'hand sanitizer'),
  S('Face mask', 'household', 'pack'),
  S('Plasters', 'household', 'pack', 'band aid'),
  S('Paracetamol', 'household', 'pack', 'biogesic'),
  S('Vitamins', 'household', 'bottle'),
  S('Pet food', 'household', 'pack', 'dog food', 'cat food'),
]

/** Strip a name to something matchable. Mirrors catalogue.js exactly. */
const normalise = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

// Indexed once at module load. There are a couple of hundred of these, so the
// cost is nothing and it keeps searchStaples free of per-keystroke work.
const INDEXED = STAPLES.map((item) => ({
  ...item,
  haystack: normalise([item.name, ...item.aliases].join(' ')),
  // The name alone, for deciding whether a match is on the real name or only
  // on an alias.
  nameKey: normalise(item.name),
}))

export const stapleCount = () => STAPLES.length

/**
 * Search the staples.
 *
 * Ranked like the catalogue so the two can share one result list: an exact
 * name first, then a name that starts with the query, then a word inside it,
 * then an alias match. Someone typing "rice" gets Rice before Brown rice and
 * long before Rice Crackers.
 */
export function searchStaples(query, { limit = 8 } = {}) {
  const q = normalise(query)
  if (!q) return []

  const out = []
  for (const item of INDEXED) {
    let rank
    if (item.nameKey === q) rank = 0
    else if (item.nameKey.startsWith(q)) rank = 1
    else if (item.nameKey.includes(` ${q}`)) rank = 2
    else if (item.haystack.startsWith(q) || item.haystack.includes(` ${q}`)) rank = 3
    else if (item.haystack.includes(q)) rank = 4
    else continue
    out.push({ item, rank })
  }

  return out
    .sort((a, b) => a.rank - b.rank || a.item.name.length - b.item.name.length)
    .slice(0, limit)
    .map((hit) => hit.item)
}

/**
 * A staple as something the list can hold.
 *
 * No price and no barcode: these are kinds of thing rather than products, and
 * a made-up price would poison the budget and the Vault exactly as it would
 * from any other source.
 */
export function stapleToListItem(item) {
  return {
    name: item.name,
    brand: null,
    barcode: null,
    category: item.category,
    qty: 1,
    price: null,
    unit: item.unit,
    packageSize: null,
  }
}
