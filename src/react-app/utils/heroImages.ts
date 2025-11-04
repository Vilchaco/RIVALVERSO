/**
 * Utility function to get hero image URLs from the uploaded assets
 * Maps hero names to their corresponding prestige image URLs
 */

export function getHeroImageUrl(heroName: string): string | null {
  if (!heroName) return null;
  
  // Clean and normalize the hero name for URL matching
  const cleanName = heroName.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim();

  // Manual mapping for known heroes with their exact asset URLs
  const heroImageMap: Record<string, string> = {
    'adam-warlock': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/adam-warlock_prestige.png',
    'adam warlock': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/adam-warlock_prestige.png',
    'captain-america': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/captain-america_prestige.png',
    'captain america': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/captain-america_prestige.png',
    'capitán américa': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/captain-america_prestige.png',
    'blade': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/blade_prestige.png',
    'black-widow': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/black-widow_prestige.png',
    'black widow': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/black-widow_prestige.png',
    'viuda negra': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/black-widow_prestige.png',
    'black-panther': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/black-panther_prestige.png',
    'black panther': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/black-panther_prestige.png',
    'pantera negra': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/black-panther_prestige.png',
    'doctor-strange': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/doctor-strange_prestige.png',
    'doctor strange': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/doctor-strange_prestige.png',
    'dr strange': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/doctor-strange_prestige.png',
    'cloak-and-dagger': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/cloak-and-dagger_prestige.png',
    'cloak and dagger': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/cloak-and-dagger_prestige.png',
    'cloak & dagger': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/cloak-and-dagger_prestige.png',
    'groot': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/groot_prestige.png',
    'hawkeye': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/hawkeye_prestige.png',
    'ojo de halcón': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/hawkeye_prestige.png',
    'emma-frost': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/emma-frost_prestige.png',
    'emma frost': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/emma-frost_prestige.png',
    'hulk': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/hulk_prestige.png',
    'hela': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/hela_prestige.png',
    'human-torch': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/human-torch_prestige.png',
    'human torch': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/human-torch_prestige.png',
    'antorcha humana': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/human-torch_prestige.png',
    'invisible-woman': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/invisible-woman_prestige.png',
    'invisible woman': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/invisible-woman_prestige.png',
    'mujer invisible': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/invisible-woman_prestige.png',
    'iron-fist': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/iron-fist_prestige.png',
    'iron fist': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/iron-fist_prestige.png',
    'puño de hierro': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/iron-fist_prestige.png',
    'iron-man': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/iron-man_prestige.png',
    'iron man': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/iron-man_prestige.png',
    'hombre de hierro': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/iron-man_prestige.png',
    'magik': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/magik_prestige.png',
    'loki': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/loki_prestige.png',
    'luna-snow': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/luna-snow_prestige.png',
    'luna snow': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/luna-snow_prestige.png',
    'moon-knight': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/moon-knight_prestige.png',
    'moon knight': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/moon-knight_prestige.png',
    'caballero luna': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/moon-knight_prestige.png',
    'magneto': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/magneto_prestige.png',
    'mister-fantastic': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/mister-fantastic_prestige.png',
    'mister fantastic': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/mister-fantastic_prestige.png',
    'mr fantastic': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/mister-fantastic_prestige.png',
    'namor': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/namor_prestige.png',
    'peni-parker': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/peni-parker_prestige.png',
    'peni parker': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/peni-parker_prestige.png',
    'phoenix': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/phoenix_prestige.png',
    'fénix': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/phoenix_prestige.png',
    'psylocke': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/psylocke_prestige.png',
    'rocket-raccoon': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/rocket-raccoon_prestige.png',
    'rocket raccoon': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/rocket-raccoon_prestige.png',
    'rocket': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/rocket-raccoon_prestige.png',
    'scarlet-witch': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/scarlet-witch_prestige.png',
    'scarlet witch': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/scarlet-witch_prestige.png',
    'bruja escarlata': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/scarlet-witch_prestige.png',
    'wanda': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/scarlet-witch_prestige.png',
    'spider-man': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/spider-man_prestige.png',
    'spiderman': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/spider-man_prestige.png',
    'spider man': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/spider-man_prestige.png',
    'hombre araña': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/spider-man_prestige.png',
    'squirrel-girl': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/squirrel-girl_prestige.png',
    'squirrel girl': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/squirrel-girl_prestige.png',
    'star-lord': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/star-lord_prestige.png',
    'star lord': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/star-lord_prestige.png',
    'señor de las estrellas': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/star-lord_prestige.png',
    'storm': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/storm_prestige.png',
    'tormenta': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/storm_prestige.png',
    'the-punisher': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/the-punisher_prestige.png',
    'punisher': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/the-punisher_prestige.png',
    'the punisher': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/the-punisher_prestige.png',
    'castigador': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/the-punisher_prestige.png',
    'venom': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/venom_prestige.png',
    'winter-soldier': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/winter-soldier_prestige.png',
    'winter soldier': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/winter-soldier_prestige.png',
    'soldado del invierno': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/winter-soldier_prestige.png',
    'bucky': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/winter-soldier_prestige.png',
    'thor': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/thor_prestige.png',
    'ultron': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/ultron_prestige.png',
    'wolverine': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/wolverine_prestige.png',
    'lobezno': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/wolverine_prestige.png',
    'mantis': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/mantis_prestige.png',
    'angela': 'https://mocha-cdn.com/0199440f-b65f-7cab-a552-eca69173e4c7/angela_restige.png',
    'bruce-banner': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/hulk_prestige.png',
    'bruce banner': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/hulk_prestige.png',
    'jeff-the-land-shark': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/jeff-the-land-shark_prestige.png',
    'jeff the land shark': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/jeff-the-land-shark_prestige.png',
    'jeff': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/jeff-the-land-shark_prestige.png',
    'the-thing': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/the-thing_prestige.png',
    'the thing': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/the-thing_prestige.png',
    'thing': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/the-thing_prestige.png',
    'la cosa': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/the-thing_prestige.png',
  };

  // Try direct match first
  if (heroImageMap[cleanName]) {
    return heroImageMap[cleanName];
  }

  // Try original name in case it's already clean
  if (heroImageMap[heroName.toLowerCase()]) {
    return heroImageMap[heroName.toLowerCase()];
  }

  // Try partial matches for fallback
  for (const [key, url] of Object.entries(heroImageMap)) {
    if (key.includes(cleanName) || cleanName.includes(key)) {
      return url;
    }
  }

  return null;
}

/**
 * Utility function to get hero signature image URLs from the uploaded assets
 * Maps hero names to their corresponding signature image URLs
 */
export function getHeroSignatureImageUrl(heroName: string): string | null {
  if (!heroName) return null;
  
  // Clean and normalize the hero name for URL matching
  const cleanName = heroName.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim();

  // Manual mapping for known heroes with their exact signature asset URLs
  const heroSignatureMap: Record<string, string> = {
    'adam-warlock': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Adam-Warlock-Signature.png',
    'adam warlock': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Adam-Warlock-Signature.png',
    'black-panther': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Black-Panther-Signature.png',
    'black panther': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Black-Panther-Signature.png',
    'pantera negra': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Black-Panther-Signature.png',
    'black-widow': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Black-Widow-Signature.png',
    'black widow': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Black-Widow-Signature.png',
    'viuda negra': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Black-Widow-Signature.png',
    'blade': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Blade-Signature.png',
    'captain-america': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Captain-America-Signature.png',
    'captain america': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Captain-America-Signature.png',
    'capitán américa': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Captain-America-Signature.png',
    'cloak-and-dagger': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Cloak-Dagger-Signature.png',
    'cloak and dagger': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Cloak-Dagger-Signature.png',
    'cloak & dagger': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Cloak-Dagger-Signature.png',
    'doctor-strange': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Doctor-Strange-Signature.png',
    'doctor strange': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Doctor-Strange-Signature.png',
    'dr strange': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Doctor-Strange-Signature.png',
    'emma-frost': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Emma-Frost-Signature.png',
    'emma frost': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Emma-Frost-Signature.png',
    'groot': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Groot-Signature.png',
    'hawkeye': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Hawkeye-Signature.png',
    'ojo de halcón': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Hawkeye-Signature.png',
    'hela': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Hela-Signature.png',
    'hulk': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Hulk-Signature.png',
    'human-torch': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Human-Torch-Signature.png',
    'human torch': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Human-Torch-Signature.png',
    'antorcha humana': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Human-Torch-Signature.png',
    'invisible-woman': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Invisible-Woman-Signature.png',
    'invisible woman': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Invisible-Woman-Signature.png',
    'mujer invisible': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Invisible-Woman-Signature.png',
    'iron-fist': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Iron-Fist-Signature.png',
    'iron fist': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Iron-Fist-Signature.png',
    'puño de hierro': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Iron-Fist-Signature.png',
    'iron-man': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Iron-Man-Signature.png',
    'iron man': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Iron-Man-Signature.png',
    'hombre de hierro': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Iron-Man-Signature.png',
    'jeff-the-land-shark': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Jeff-the-Land-Shark-Signature.png',
    'jeff the land shark': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Jeff-the-Land-Shark-Signature.png',
    'jeff': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Jeff-the-Land-Shark-Signature.png',
    'loki': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Loki-Signature.png',
    'luna-snow': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Luna-Snow-Signature.png',
    'luna snow': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Luna-Snow-Signature.png',
    'magik': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Magik-Signature.png',
    'magneto': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Magneto-Signature.png',
    'mantis': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Mantis-Signature.png',
    'mister-fantastic': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Mister-Fantastic-Signature.png',
    'mister fantastic': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Mister-Fantastic-Signature.png',
    'mr fantastic': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Mister-Fantastic-Signature.png',
    'moon-knight': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Moon-Knight-Signature.png',
    'moon knight': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Moon-Knight-Signature.png',
    'caballero luna': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Moon-Knight-Signature.png',
    'namor': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Namor-Signature.png',
    'peni-parker': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Peni-Parker-Signature.png',
    'peni parker': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Peni-Parker-Signature.png',
    'phoenix': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Phoenix-Signature.png',
    'fénix': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Phoenix-Signature.png',
    'psylocke': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Psylocke-Signature.png',
    'rocket-raccoon': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Rocket-Raccoon-Signature.png',
    'rocket raccoon': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Rocket-Raccoon-Signature.png',
    'rocket': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Rocket-Raccoon-Signature.png',
    'scarlet-witch': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Scarlet-Witch-Signature.png',
    'scarlet witch': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Scarlet-Witch-Signature.png',
    'bruja escarlata': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Scarlet-Witch-Signature.png',
    'wanda': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Scarlet-Witch-Signature.png',
    'spider-man': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Spider-Man-Signature.png',
    'spiderman': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Spider-Man-Signature.png',
    'spider man': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Spider-Man-Signature.png',
    'hombre araña': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Spider-Man-Signature.png',
    'squirrel-girl': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Squirrel-Girl-Signature.png',
    'squirrel girl': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Squirrel-Girl-Signature.png',
    'star-lord': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Star-Lord-Signature.png',
    'star lord': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Star-Lord-Signature.png',
    'señor de las estrellas': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Star-Lord-Signature.png',
    'storm': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Storm-Signature.png',
    'tormenta': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Storm-Signature.png',
    'the-punisher': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/The-Punisher-Signature.png',
    'punisher': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/The-Punisher-Signature.png',
    'the punisher': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/The-Punisher-Signature.png',
    'castigador': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/The-Punisher-Signature.png',
    'the-thing': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/The-Thing-Signature.png',
    'the thing': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/The-Thing-Signature.png',
    'thing': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/The-Thing-Signature.png',
    'la cosa': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/The-Thing-Signature.png',
    'thor': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Thor-Signature.png',
    'ultron': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Ultron-Signature.png',
    'venom': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Venom-Signature.png',
    'winter-soldier': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Winter-Soldier-Signature.png',
    'winter soldier': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Winter-Soldier-Signature.png',
    'soldado del invierno': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Winter-Soldier-Signature.png',
    'bucky': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Winter-Soldier-Signature.png',
    'wolverine': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Wolverine-Signature.png',
    'lobezno': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Wolverine-Signature.png',
    'angela': 'https://mocha-cdn.com/0199440f-b65f-7cab-a552-eca69173e4c7/Angela-Signature.png',
    'bruce-banner': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Hulk-Signature.png',
    'bruce banner': 'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/Hulk-Signature.png',
  };

  // Try direct match first
  if (heroSignatureMap[cleanName]) {
    return heroSignatureMap[cleanName];
  }

  // Try original name in case it's already clean
  if (heroSignatureMap[heroName.toLowerCase()]) {
    return heroSignatureMap[heroName.toLowerCase()];
  }

  // Try partial matches for fallback
  for (const [key, url] of Object.entries(heroSignatureMap)) {
    if (key.includes(cleanName) || cleanName.includes(key)) {
      return url;
    }
  }

  return null;
}

/**
 * Get multiple hero images for use in background elements
 */
export function getBackgroundHeroImages(): string[] {
  return [
    'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/iron-man_prestige.png',
    'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/spider-man_prestige.png',
    'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/captain-america_prestige.png',
    'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/thor_prestige.png',
    'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/hulk_prestige.png',
    'https://mocha-cdn.com/0198dfb9-058b-7c9c-88f3-83d73ec11743/scarlet-witch_prestige.png',
  ];
}
