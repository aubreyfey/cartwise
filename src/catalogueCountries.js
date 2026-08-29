// Which product catalogue to search.
//
// One country's file is loaded at a time, on the first search, and never as
// part of the main bundle. That is deliberate: the catalogues run from a few
// hundred kilobytes to a couple of megabytes, and someone shopping in Cebu
// should not download Germany to find Sky Flakes.
//
// The list here is what CartWise has actually fetched and shipped. A country
// that is not in public/catalogue is not offered — an empty picker entry that
// silently finds nothing is worse than not offering it at all.

export const CATALOGUE_COUNTRY_KEY = 'cartwise.catalogueCountry'

/**
 * `id` is the Open Food Facts country subdomain and the filename. `size` is
 * roughly how many products the shipped extract holds, so the picker can be
 * honest about what you are choosing rather than implying they are equal.
 */
export const CATALOGUE_COUNTRIES = [
  { id: 'ph', label: 'Philippines', flag: '🇵🇭' },
  { id: 'my', label: 'Malaysia', flag: '🇲🇾' },
  { id: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { id: 'th', label: 'Thailand', flag: '🇹🇭' },
  { id: 'in', label: 'India', flag: '🇮🇳' },
  { id: 'au', label: 'Australia', flag: '🇦🇺' },
  { id: 'uk', label: 'United Kingdom', flag: '🇬🇧' },
  { id: 'mx', label: 'Mexico', flag: '🇲🇽' },
]

export const DEFAULT_CATALOGUE_COUNTRY = 'ph'

const BY_ID = Object.fromEntries(CATALOGUE_COUNTRIES.map((c) => [c.id, c]))

/** A stored id, or the default. Never returns something with no file. */
export const catalogueCountryOf = (id) =>
  BY_ID[id] ? id : DEFAULT_CATALOGUE_COUNTRY

export const catalogueCountry = (id) => BY_ID[catalogueCountryOf(id)]
