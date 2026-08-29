// How to actually cook the things in the cookbook.
//
// A recipe with an ingredient list and no method is a shopping list wearing a
// recipe's name. It tells you what to buy and abandons you at the stove.
//
// These are deliberately short — four to seven steps, no timings pretending to
// be precise, no "season to taste" filler. Someone who has cooked adobo before
// needs a reminder of the order, not a lecture; someone who has not needs to
// know that the vinegar goes in and is left alone rather than stirred.
//
// Kept apart from recipeLibrary.js so that file stays a readable list of what
// goes in the basket, which is what most of the app cares about.

export const RECIPE_STEPS = {
  'Chicken Adobo': [
    'Brown the chicken in a little oil, then set it aside.',
    'Soften the crushed garlic in the same pan.',
    'Return the chicken with the soy sauce, vinegar and pepper.',
    'Let it come to the boil without stirring — stirring early makes the vinegar sharp.',
    'Cover and simmer 30 minutes, then uncover and reduce until the sauce coats the chicken.',
  ],
  'Pork Adobo': [
    'Brown the pork in batches so it colours rather than steams.',
    'Add the onion and garlic and cook until soft.',
    'Pour in the soy sauce and vinegar and bring to the boil untouched.',
    'Cover and simmer 45 minutes until the pork gives to a fork.',
    'Uncover and reduce until the sauce is glossy.',
  ],
  'Sinigang na Baboy': [
    'Boil the pork with the onion and tomatoes until tender, skimming the top.',
    'Add your souring agent and taste — it should be sour enough to notice.',
    'Add the harder vegetables first: eggplant, okra, sitaw.',
    'Add the kangkong last and turn off the heat; it wilts in the residual heat.',
    'Season with fish sauce at the end, not the beginning.',
  ],
  'Sinigang na Hipon': [
    'Soften the onion and tomatoes in a little oil.',
    'Add water and your souring agent and bring to the boil.',
    'Add the sitaw and cook until just tender.',
    'Add the shrimp — two minutes, no more, or they turn to rubber.',
    'Kangkong in, heat off, fish sauce to finish.',
  ],
  'Tinolang Manok': [
    'Fry the ginger, garlic and onion until fragrant.',
    'Add the chicken and let it colour on all sides.',
    'Cover with water and simmer until the chicken is tender.',
    'Add the squash and cook until it softens but holds together.',
    'Malunggay in at the very end, then fish sauce.',
  ],
  'Beef Kaldereta': [
    'Brown the beef well — this is where the flavour comes from.',
    'Soften the onion and garlic, then add the tomato sauce.',
    'Cover and simmer 1½ to 2 hours until the beef is tender.',
    'Add the potatoes and carrots and cook until soft.',
    'Stir in the cheese and bell pepper at the end.',
  ],
  'Pork Menudo': [
    'Brown the pork, then set it aside.',
    'Soften the onion and garlic in the same pan.',
    'Return the pork with the tomato sauce and simmer 30 minutes.',
    'Add the potatoes and carrots and cook until tender.',
    'Bell pepper last so it keeps its bite.',
  ],
  'Chicken Afritada': [
    'Brown the chicken pieces and set aside.',
    'Soften the onion, then add the tomato sauce.',
    'Return the chicken, cover and simmer 25 minutes.',
    'Add the potatoes and carrots until tender.',
    'Bell pepper in for the last few minutes.',
  ],
  'Pancit Bihon': [
    'Soak the noodles in warm water until pliable, then drain.',
    'Cook the chicken through and set it aside.',
    'Stir-fry the garlic, then the carrots and cabbage.',
    'Add stock and soy sauce, bring to the boil, then the noodles.',
    'Toss until the noodles have drunk the liquid. Calamansi at the table.',
  ],
  'Pancit Canton': [
    'Cook the pork and shrimp separately and set aside.',
    'Stir-fry the carrots and cabbage until just tender.',
    'Add stock and oyster sauce and bring to the boil.',
    'Add the noodles and toss until they soften and absorb.',
    'Return the meat and shrimp, toss once more.',
  ],
  'Lumpiang Shanghai': [
    'Mix the pork, finely chopped carrot, onion, garlic and egg.',
    'Spoon a line onto each wrapper and roll tight — loose rolls burst.',
    'Seal the edge with water.',
    'Fry in medium oil until golden, turning once.',
    'Drain standing up rather than flat, so they stay crisp.',
  ],
  'Ginisang Munggo': [
    'Boil the beans until they collapse — an hour or so.',
    'Fry the pork until crisp, then the garlic, onion and tomatoes.',
    'Tip in the beans with some of their water.',
    'Simmer 10 minutes so it thickens.',
    'Malunggay in at the end.',
  ],
  Chopsuey: [
    'Cook the shrimp briefly and set aside.',
    'Stir-fry the garlic, then the carrots and cauliflower.',
    'Add the cabbage and bell pepper — they need less time.',
    'Oyster sauce and a splash of stock, tossed through.',
    'Return the shrimp. Serve while the vegetables still have bite.',
  ],
  Pinakbet: [
    'Fry the bagoong with garlic until it smells nutty.',
    'Add the tomatoes and let them break down.',
    'Squash and sitaw first — they take longest.',
    'Then eggplant, okra and ampalaya.',
    'Cover and steam; shake the pan rather than stirring, or it turns to mush.',
  ],
  'Ginataang Gulay': [
    'Fry the ginger and chili in a little oil.',
    'Add half the coconut milk and bring to a gentle simmer.',
    'Add the squash and cook until nearly tender.',
    'Sitaw and shrimp in, plus the rest of the coconut milk.',
    'Simmer gently — a hard boil splits the coconut milk.',
  ],
  'Bistek Tagalog': [
    'Marinate the beef in soy sauce and calamansi for at least 30 minutes.',
    'Fry the onion rings until soft, then lift them out.',
    'Sear the beef quickly over high heat.',
    'Pour in the marinade and simmer until it thickens.',
    'Return the onions on top.',
  ],
  'Tortang Talong': [
    'Grill or fry the eggplants until the skin blisters and the flesh softens.',
    'Peel while warm, keeping the stem on, and flatten with a fork.',
    'Beat the eggs with the chopped onion.',
    'Dip each eggplant into the egg, letting it soak.',
    'Fry until set on both sides.',
  ],
  'Arroz Caldo': [
    'Fry the ginger, garlic and onion until fragrant.',
    'Add the chicken and cook until it colours.',
    'Add the rice and stir until coated.',
    'Pour in plenty of stock and simmer, stirring, until it thickens.',
    'Top with boiled egg, spring onion and fried garlic. Calamansi at the table.',
  ],
  Tapsilog: [
    'Fry the tapa in a little oil until caramelised at the edges.',
    'Fry the garlic, then toss through day-old rice.',
    'Fry the eggs, keeping the yolks soft.',
    'Plate all three together. That is the whole point of the name.',
  ],
  Champorado: [
    'Boil the rice in plenty of water, stirring often.',
    'When it starts to thicken, stir in the cocoa.',
    'Add sugar and cook until it is thick but still pourable.',
    'Serve with condensed milk poured over rather than stirred in.',
  ],
  'Fried Rice': [
    'Use cold, day-old rice — fresh rice steams and clumps.',
    'Fry the garlic in hot oil until it just turns gold.',
    'Push it aside and scramble the eggs in the same pan.',
    'Add the rice and toss until every grain is coated and heated.',
    'Spring onions at the end.',
  ],
  'Scrambled Eggs on Toast': [
    'Beat the eggs with a splash of milk.',
    'Melt butter in a cold pan, then add the eggs.',
    'Stir slowly over low heat — low and slow is the whole technique.',
    'Take them off while still slightly wet; they finish on the plate.',
    'Toast, butter, eggs.',
  ],
  'Tuna Pasta': [
    'Boil the pasta in well-salted water.',
    'Soften the onion and garlic in oil.',
    'Add the tomato sauce and drained tuna and simmer 10 minutes.',
    'Toss the drained pasta through the sauce, not the other way round.',
    'Cheese over the top.',
  ],
  'Grilled Cheese': [
    'Butter the outside of the bread, not the inside.',
    'Cheese between, pan on medium-low.',
    'Press gently and cook until deep gold, then turn.',
    'Rest a minute before cutting or the cheese runs out.',
  ],
  'Vegetable Stir Fry': [
    'Have everything chopped before you start — this cooks fast.',
    'Garlic in hot oil, a few seconds only.',
    'Carrots and broccoli first, they take longest.',
    'Bell pepper last so it stays crisp.',
    'Soy sauce at the end, tossed through. Serve on rice.',
  ],
  Pancakes: [
    'Whisk the dry ingredients together first.',
    'Beat in the eggs and milk until just combined — lumps are fine.',
    'Rest the batter 10 minutes if you can.',
    'Ladle onto a medium pan; flip when the bubbles stay open.',
    'Butter while hot.',
  ],
  'Spaghetti Bolognese': [
    'Soften the onion, carrot and garlic slowly in oil.',
    'Add the beef and brown it properly, breaking it up.',
    'Add the tomato sauce and simmer at least 30 minutes — longer is better.',
    'Boil the pasta while it finishes.',
    'Toss the pasta through the sauce, then cheese.',
  ],
  Carbonara: [
    'Fry the bacon until crisp; keep the fat.',
    'Beat the eggs with the cream and most of the cheese.',
    'Boil the pasta and save a cup of its water.',
    'Off the heat, toss the hot pasta with the egg mixture — off the heat, or you get scrambled eggs.',
    'Loosen with the pasta water until glossy.',
  ],
  'Chicken Curry': [
    'Brown the chicken and set it aside.',
    'Fry the onion, garlic and ginger, then the curry powder for a minute.',
    'Return the chicken with the coconut milk.',
    'Add potatoes and carrots and simmer until tender.',
    'Do not let it boil hard — the coconut milk will split.',
  ],
  'Beef Tacos': [
    'Brown the beef with the onion, breaking it up as it cooks.',
    'Season and let the liquid cook off.',
    'Warm the tortillas in a dry pan.',
    'Chop the tomatoes and shred the lettuce.',
    'Build at the table so nothing goes soggy.',
  ],
  Omelette: [
    'Beat the eggs just until the yolks and whites combine.',
    'Melt butter in a pan over medium heat.',
    'Pour in the eggs and pull the set edges towards the centre.',
    'When the top is barely wet, add the filling to one half.',
    'Fold and slide onto the plate.',
  ],
  'Tomato Soup': [
    'Soften the onion and garlic without colouring them.',
    'Add the chopped tomatoes and simmer 20 minutes.',
    'Blend until smooth.',
    'Stir in the cream off the heat.',
    'Serve with bread for dipping.',
  ],
}

/** Steps for a recipe, or an empty list. Matching is by name and forgiving. */
export function stepsFor(name) {
  if (!name) return []
  const key = String(name).trim()
  if (RECIPE_STEPS[key]) return RECIPE_STEPS[key]
  const lower = key.toLowerCase()
  const match = Object.keys(RECIPE_STEPS).find((k) => k.toLowerCase() === lower)
  return match ? RECIPE_STEPS[match] : []
}

export const stepCount = () => Object.keys(RECIPE_STEPS).length
