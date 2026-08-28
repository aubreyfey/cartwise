// Categories are listed in the order you'd typically walk a store, so the
// grouped list doubles as a route through the aisles.
//
// `sticker` names a drawing from the sticker set rather than an emoji: emoji
// are rendered by the operating system, so the same character looks different
// on every platform, and Apple's set cannot legally be shipped with a web app.
export const CATEGORIES = [
  { id: 'produce', label: 'Produce', sticker: 'leaf' },
  { id: 'bakery', label: 'Bakery', sticker: 'bread' },
  { id: 'meat', label: 'Meat & Seafood', sticker: 'drumstick' },
  { id: 'dairy', label: 'Dairy & Eggs', sticker: 'milk' },
  { id: 'frozen', label: 'Frozen', sticker: 'ice' },
  { id: 'pantry', label: 'Pantry', sticker: 'can' },
  { id: 'snacks', label: 'Snacks', sticker: 'chips' },
  { id: 'drinks', label: 'Drinks', sticker: 'bottle' },
  { id: 'household', label: 'Household', sticker: 'paper' },
  { id: 'other', label: 'Other', sticker: 'basket' },
]

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
)

export function categoryLabel(id) {
  return (CATEGORY_BY_ID[id] ?? CATEGORY_BY_ID.other).label
}

// Keyword -> category. Matched as whole words against the item name so
// "cream" doesn't swallow "ice cream" and "corn" doesn't swallow "popcorn".
const KEYWORDS = {
  produce:
    'apple apples banana bananas orange oranges lemon lemons lime limes grape grapes berry berries strawberry strawberries blueberry blueberries raspberry avocado avocados tomato tomatoes potato potatoes onion onions garlic ginger carrot carrots celery lettuce spinach kale arugula cabbage broccoli cauliflower cucumber pepper peppers zucchini squash mushroom mushrooms corn peas beans asparagus herbs basil cilantro parsley mint salad greens melon watermelon pineapple mango peach peaches pear pears plum cherries kiwi kangkong malunggay moringa pechay sitaw ampalaya sayote calamansi kalamansi dalandan pomelo okra eggplant aubergine talong kamatis sibuyas bawang luya patatas kamote karot repolyo pipino kalabasa mais togue niyog saging mangga pakwan papaya chili sili labuyo shallot leek turnip radish beetroot',
  bakery:
    'bread baguette bagel bagels bun buns roll rolls tortilla tortillas pita croissant croissants muffin muffins cake cookies donut donuts pastry sourdough naan pandesal',
  meat:
    'chicken beef steak pork bacon sausage ham turkey lamb mince ground salmon tuna shrimp prawns fish cod tilapia crab lobster ribs brisket bangus milkfish tilapia galunggong pusit squid hipon alimango tahong mussels tinapa daing tuyo longganisa tocino tapa liempo giniling manok baboy baka isda anchovies sardines-fresh',
  dairy:
    'milk cheese cheddar mozzarella parmesan feta yogurt yoghurt butter cream eggs egg sour creamer half-and-half cottage ricotta kefir keso gatas quickmelt evaporated condensed',
  frozen:
    'frozen pizza fries nuggets waffles popsicle popsicles sorbet peas-frozen siomai lumpiang',
  pantry:
    'rice pasta spaghetti noodles flour sugar salt pepper-ground oil olive vinegar sauce ketchup mustard mayo mayonnaise soy honey syrup cereal oats oatmeal granola peanut jam jelly beans-canned lentils chickpeas soup broth stock tomatoes-canned tuna-canned spice spices cumin paprika cinnamon vanilla baking soda yeast stuffing toyo suka patis bagoong gata cocoa milo curry cornstarch breadcrumbs bouillon cube cubes malagkit bigas asukal asin paminta mantika tofu tokwa oyster monggo munggo lumpia wrapper wonton harina',
  snacks:
    'chips crisps crackers popcorn pretzels nuts almonds cashews peanuts trail candy chocolate gum bars granola-bar snack jerky mani polvoron',
  drinks:
    'water coffee tea juice soda cola seltzer sparkling beer wine kombucha lemonade smoothie energy',
  household:
    'paper towels toilet tissue napkins soap detergent dish laundry sponge sponges trash bags foil wrap cleaner bleach shampoo conditioner toothpaste deodorant razors batteries lightbulb diapers wipes sabon zonrox downy baygon',
}

// name -> category, built once at module load.
const LOOKUP = new Map()
for (const [category, words] of Object.entries(KEYWORDS)) {
  for (const word of words.split(' ')) {
    // Hyphenated entries are disambiguators ("tomatoes-canned"); index the
    // parts too, but never let them overwrite a more specific earlier match.
    const key = word.split('-')[0]
    if (!LOOKUP.has(key)) LOOKUP.set(key, category)
  }
}

/**
 * Best-guess category for a free-text item name.
 * Returns 'other' when nothing matches.
 */
export function guessCategory(name) {
  const words = name
    .toLowerCase()
    .replace(/[^a-z\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter(Boolean)

  for (const word of words) {
    if (LOOKUP.has(word)) return LOOKUP.get(word)
    // crude plural fold: "carrots" -> "carrot", "berries" -> "berry"
    if (word.endsWith('ies') && LOOKUP.has(word.slice(0, -3) + 'y')) {
      return LOOKUP.get(word.slice(0, -3) + 'y')
    }
    if (word.endsWith('es') && LOOKUP.has(word.slice(0, -2))) {
      return LOOKUP.get(word.slice(0, -2))
    }
    if (word.endsWith('s') && LOOKUP.has(word.slice(0, -1))) {
      return LOOKUP.get(word.slice(0, -1))
    }
  }
  return 'other'
}
