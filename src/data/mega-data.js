const INITIAL_PRICE = 6000;
const INTERMEDIATE_PRICE = 9000;
const POWERFUL_PRICE = 11000;
const PSEUDO_LEGENDARY_PRICE = 14000;
const LEGENDARY_PRICE = 20000;

const SHOWDOWN_POKEDEX_URL = "https://play.pokemonshowdown.com/data/pokedex.json";
const SHOWDOWN_SPRITE_BASE = "https://play.pokemonshowdown.com/sprites";
const NEW_MEGA_CACHE_KEY = "idle-jorneymon-new-mega-data-v1";

const TYPE_LABELS_PT = {
  Normal: "Normal",
  Fighting: "Lutador",
  Flying: "Voador",
  Poison: "Veneno",
  Ground: "Terra",
  Rock: "Pedra",
  Bug: "Inseto",
  Ghost: "Fantasma",
  Steel: "Aço",
  Fire: "Fogo",
  Water: "Água",
  Grass: "Planta",
  Electric: "Elétrico",
  Psychic: "Psíquico",
  Ice: "Gelo",
  Dragon: "Dragão",
  Dark: "Sombrio",
  Fairy: "Fada"
};

const NEW_MEGA_STONES = [
  { id: "dragoninite", name: "Dragoninite", baseSpeciesId: 149, baseName: "Dragonite", formId: "dragonitemega", showdownKey: "dragonitemega", spriteSlug: "dragonite-mega", megaName: "Mega Dragonite", type: "Dragão/Voador", price: PSEUDO_LEGENDARY_PRICE, newMega: true },
  { id: "victreebelite", name: "Victreebelite", baseSpeciesId: 71, baseName: "Victreebel", formId: "victreebelmega", showdownKey: "victreebelmega", spriteSlug: "victreebel-mega", megaName: "Mega Victreebel", type: "Planta/Veneno", price: INTERMEDIATE_PRICE, newMega: true },
  { id: "hawluchanite", name: "Hawluchanite", baseSpeciesId: 701, baseName: "Hawlucha", formId: "hawluchamega", showdownKey: "hawluchamega", spriteSlug: "hawlucha-mega", megaName: "Mega Hawlucha", type: "Lutador/Voador", price: POWERFUL_PRICE, newMega: true },
  { id: "malamarite", name: "Malamarite", baseSpeciesId: 687, baseName: "Malamar", formId: "malamarmega", showdownKey: "malamarmega", spriteSlug: "malamar-mega", megaName: "Mega Malamar", type: "Sombrio/Psíquico", price: INTERMEDIATE_PRICE, newMega: true },
  { id: "chesnaughtite", name: "Chesnaughtite", baseSpeciesId: 652, baseName: "Chesnaught", formId: "chesnaughtmega", showdownKey: "chesnaughtmega", spriteSlug: "chesnaught-mega", megaName: "Mega Chesnaught", type: "Planta/Lutador", price: INTERMEDIATE_PRICE, newMega: true },
  { id: "delphoxite", name: "Delphoxite", baseSpeciesId: 655, baseName: "Delphox", formId: "delphoxmega", showdownKey: "delphoxmega", spriteSlug: "delphox-mega", megaName: "Mega Delphox", type: "Fogo/Psíquico", price: INTERMEDIATE_PRICE, newMega: true },
  { id: "greninjite", name: "Greninjite", baseSpeciesId: 658, baseName: "Greninja", formId: "greninjamega", showdownKey: "greninjamega", spriteSlug: "greninja-mega", megaName: "Mega Greninja", type: "Água/Sombrio", price: POWERFUL_PRICE, newMega: true },
  { id: "meganiumite", name: "Meganiumite", baseSpeciesId: 154, baseName: "Meganium", formId: "meganiummega", showdownKey: "meganiummega", spriteSlug: "meganium-mega", megaName: "Mega Meganium", type: "Planta/Fada", price: INTERMEDIATE_PRICE, newMega: true },
  { id: "emboarite", name: "Emboarite", baseSpeciesId: 500, baseName: "Emboar", formId: "emboarmega", showdownKey: "emboarmega", spriteSlug: "emboar-mega", megaName: "Mega Emboar", type: "Fogo/Lutador", price: INTERMEDIATE_PRICE, newMega: true },
  { id: "feraligite", name: "Feraligite", baseSpeciesId: 160, baseName: "Feraligatr", formId: "feraligatrmega", showdownKey: "feraligatrmega", spriteSlug: "feraligatr-mega", megaName: "Mega Feraligatr", type: "Água/Dragão", price: POWERFUL_PRICE, newMega: true },
  { id: "eelektrossite", name: "Eelektrossite", baseSpeciesId: 604, baseName: "Eelektross", formId: "eelektrossmega", showdownKey: "eelektrossmega", spriteSlug: "eelektross-mega", megaName: "Mega Eelektross", type: "Elétrico", price: POWERFUL_PRICE, newMega: true },
  { id: "raichunite-x", name: "Raichunite X", baseSpeciesId: 26, baseName: "Raichu", formId: "raichumegax", showdownKey: "raichumegax", spriteSlug: "raichu-megax", megaName: "Mega Raichu X", type: "Elétrico", price: POWERFUL_PRICE, newMega: true },
  { id: "raichunite-y", name: "Raichunite Y", baseSpeciesId: 26, baseName: "Raichu", formId: "raichumegay", showdownKey: "raichumegay", spriteSlug: "raichu-megay", megaName: "Mega Raichu Y", type: "Elétrico", price: POWERFUL_PRICE, newMega: true },
  { id: "chimechoite", name: "Chimechoite", baseSpeciesId: 358, baseName: "Chimecho", formId: "chimechomega", showdownKey: "chimechomega", spriteSlug: "chimecho-mega", megaName: "Mega Chimecho", type: "Psíquico", price: INTERMEDIATE_PRICE, newMega: true },
  { id: "baxcalibrite", name: "Baxcalibrite", baseSpeciesId: 998, baseName: "Baxcalibur", formId: "baxcaliburmega", showdownKey: "baxcaliburmega", spriteSlug: "baxcalibur-mega", megaName: "Mega Baxcalibur", type: "Dragão/Gelo", price: PSEUDO_LEGENDARY_PRICE, newMega: true },
  { id: "zeraorite", name: "Zeraorite", baseSpeciesId: 807, baseName: "Zeraora", formId: "zeraoramega", showdownKey: "zeraoramega", spriteSlug: "zeraora-mega", megaName: "Mega Zeraora", type: "Elétrico", price: LEGENDARY_PRICE, legendary: true, newMega: true },
  { id: "lucarionite-z", name: "Lucarionite Z", baseSpeciesId: 448, baseName: "Lucario", formId: "lucariomegaz", showdownKey: "lucariomegaz", spriteSlug: "lucario-megaz", spriteUrl: "https://static.rotomlabs.net/images/sprites/legends-z-a/0448-lucario-mega-z.png", shinySpriteUrl: "https://static.rotomlabs.net/images/sprites/legends-z-a/0448-lucario-mega-z-shiny.png", megaName: "Mega Lucario Z", type: "Lutador/Aço", price: POWERFUL_PRICE, newMega: true },
  { id: "garchompite-z", name: "Garchompite Z", baseSpeciesId: 445, baseName: "Garchomp", formId: "garchompmegaz", showdownKey: "garchompmegaz", spriteSlug: "garchomp-megaz", spriteUrl: "https://static.rotomlabs.net/images/sprites/mega-dimension/0445-garchomp-mega-z.png", shinySpriteUrl: "https://static.rotomlabs.net/images/sprites/mega-dimension/0445-garchomp-mega-z-shiny.png", megaName: "Mega Garchomp Z", type: "Dragão/Terra", price: PSEUDO_LEGENDARY_PRICE, newMega: true }
];

export const MEGA_STONES = [
  { id: "venusaurite", name: "Venusaurite", baseSpeciesId: 3, baseName: "Venusaur", formId: 10033, megaName: "Mega Venusaur", type: "Planta/Veneno", price: INTERMEDIATE_PRICE },
  { id: "charizardite-x", name: "Charizardite X", baseSpeciesId: 6, baseName: "Charizard", formId: 10034, megaName: "Mega Charizard X", type: "Fogo/Dragão", price: POWERFUL_PRICE },
  { id: "charizardite-y", name: "Charizardite Y", baseSpeciesId: 6, baseName: "Charizard", formId: 10035, megaName: "Mega Charizard Y", type: "Fogo/Voador", price: POWERFUL_PRICE },
  { id: "blastoisinite", name: "Blastoisinite", baseSpeciesId: 9, baseName: "Blastoise", formId: 10036, megaName: "Mega Blastoise", type: "Água", price: INTERMEDIATE_PRICE },
  { id: "beedrillite", name: "Beedrillite", baseSpeciesId: 15, baseName: "Beedrill", formId: 10090, megaName: "Mega Beedrill", type: "Inseto/Veneno", price: INITIAL_PRICE },
  { id: "pidgeotite", name: "Pidgeotite", baseSpeciesId: 18, baseName: "Pidgeot", formId: 10073, megaName: "Mega Pidgeot", type: "Normal/Voador", price: INITIAL_PRICE },
  { id: "alakazite", name: "Alakazite", baseSpeciesId: 65, baseName: "Alakazam", formId: 10037, megaName: "Mega Alakazam", type: "Psíquico", price: INTERMEDIATE_PRICE },
  { id: "slowbronite", name: "Slowbronite", baseSpeciesId: 80, baseName: "Slowbro", formId: 10071, megaName: "Mega Slowbro", type: "Água/Psíquico", price: INTERMEDIATE_PRICE },
  { id: "gengarite", name: "Gengarite", baseSpeciesId: 94, baseName: "Gengar", formId: 10038, megaName: "Mega Gengar", type: "Fantasma/Veneno", price: INTERMEDIATE_PRICE },
  { id: "kangaskhanite", name: "Kangaskhanite", baseSpeciesId: 115, baseName: "Kangaskhan", formId: 10039, megaName: "Mega Kangaskhan", type: "Normal", price: POWERFUL_PRICE },
  { id: "pinsirite", name: "Pinsirite", baseSpeciesId: 127, baseName: "Pinsir", formId: 10040, megaName: "Mega Pinsir", type: "Inseto/Voador", price: POWERFUL_PRICE },
  { id: "gyaradosite", name: "Gyaradosite", baseSpeciesId: 130, baseName: "Gyarados", formId: 10041, megaName: "Mega Gyarados", type: "Água/Sombrio", price: POWERFUL_PRICE },
  { id: "aerodactylite", name: "Aerodactylite", baseSpeciesId: 142, baseName: "Aerodactyl", formId: 10042, megaName: "Mega Aerodactyl", type: "Pedra/Voador", price: POWERFUL_PRICE },
  { id: "mewtwonite-x", name: "Mewtwonite X", baseSpeciesId: 150, baseName: "Mewtwo", formId: 10043, megaName: "Mega Mewtwo X", type: "Psíquico/Lutador", price: LEGENDARY_PRICE, legendary: true },
  { id: "mewtwonite-y", name: "Mewtwonite Y", baseSpeciesId: 150, baseName: "Mewtwo", formId: 10044, megaName: "Mega Mewtwo Y", type: "Psíquico", price: LEGENDARY_PRICE, legendary: true },
  { id: "ampharosite", name: "Ampharosite", baseSpeciesId: 181, baseName: "Ampharos", formId: 10045, megaName: "Mega Ampharos", type: "Elétrico/Dragão", price: INTERMEDIATE_PRICE },
  { id: "steelixite", name: "Steelixite", baseSpeciesId: 208, baseName: "Steelix", formId: 10072, megaName: "Mega Steelix", type: "Aço/Terra", price: INTERMEDIATE_PRICE },
  { id: "scizorite", name: "Scizorite", baseSpeciesId: 212, baseName: "Scizor", formId: 10046, megaName: "Mega Scizor", type: "Inseto/Aço", price: POWERFUL_PRICE },
  { id: "heracronite", name: "Heracronite", baseSpeciesId: 214, baseName: "Heracross", formId: 10047, megaName: "Mega Heracross", type: "Inseto/Lutador", price: POWERFUL_PRICE },
  { id: "houndoominite", name: "Houndoominite", baseSpeciesId: 229, baseName: "Houndoom", formId: 10048, megaName: "Mega Houndoom", type: "Sombrio/Fogo", price: INTERMEDIATE_PRICE },
  { id: "tyranitarite", name: "Tyranitarite", baseSpeciesId: 248, baseName: "Tyranitar", formId: 10049, megaName: "Mega Tyranitar", type: "Pedra/Sombrio", price: PSEUDO_LEGENDARY_PRICE },
  { id: "sceptilite", name: "Sceptilite", baseSpeciesId: 254, baseName: "Sceptile", formId: 10065, megaName: "Mega Sceptile", type: "Planta/Dragão", price: INTERMEDIATE_PRICE },
  { id: "blazikenite", name: "Blazikenite", baseSpeciesId: 257, baseName: "Blaziken", formId: 10050, megaName: "Mega Blaziken", type: "Fogo/Lutador", price: INTERMEDIATE_PRICE },
  { id: "swampertite", name: "Swampertite", baseSpeciesId: 260, baseName: "Swampert", formId: 10064, megaName: "Mega Swampert", type: "Água/Terra", price: INTERMEDIATE_PRICE },
  { id: "gardevoirite", name: "Gardevoirite", baseSpeciesId: 282, baseName: "Gardevoir", formId: 10051, megaName: "Mega Gardevoir", type: "Psíquico/Fada", price: INTERMEDIATE_PRICE },
  { id: "sablenite", name: "Sablenite", baseSpeciesId: 302, baseName: "Sableye", formId: 10066, megaName: "Mega Sableye", type: "Sombrio/Fantasma", price: INTERMEDIATE_PRICE },
  { id: "mawilite", name: "Mawilite", baseSpeciesId: 303, baseName: "Mawile", formId: 10052, megaName: "Mega Mawile", type: "Aço/Fada", price: POWERFUL_PRICE },
  { id: "aggronite", name: "Aggronite", baseSpeciesId: 306, baseName: "Aggron", formId: 10053, megaName: "Mega Aggron", type: "Aço", price: INTERMEDIATE_PRICE },
  { id: "medichamite", name: "Medichamite", baseSpeciesId: 308, baseName: "Medicham", formId: 10054, megaName: "Mega Medicham", type: "Lutador/Psíquico", price: INTERMEDIATE_PRICE },
  { id: "manectite", name: "Manectite", baseSpeciesId: 310, baseName: "Manectric", formId: 10055, megaName: "Mega Manectric", type: "Elétrico", price: INTERMEDIATE_PRICE },
  { id: "sharpedonite", name: "Sharpedonite", baseSpeciesId: 319, baseName: "Sharpedo", formId: 10070, megaName: "Mega Sharpedo", type: "Água/Sombrio", price: POWERFUL_PRICE },
  { id: "cameruptite", name: "Cameruptite", baseSpeciesId: 323, baseName: "Camerupt", formId: 10087, megaName: "Mega Camerupt", type: "Fogo/Terra", price: INTERMEDIATE_PRICE },
  { id: "altarianite", name: "Altarianite", baseSpeciesId: 334, baseName: "Altaria", formId: 10067, megaName: "Mega Altaria", type: "Dragão/Fada", price: INTERMEDIATE_PRICE },
  { id: "banettite", name: "Banettite", baseSpeciesId: 354, baseName: "Banette", formId: 10056, megaName: "Mega Banette", type: "Fantasma", price: INTERMEDIATE_PRICE },
  { id: "absolite", name: "Absolite", baseSpeciesId: 359, baseName: "Absol", formId: 10057, megaName: "Mega Absol", type: "Sombrio", price: POWERFUL_PRICE },
  { id: "glalitite", name: "Glalitite", baseSpeciesId: 362, baseName: "Glalie", formId: 10074, megaName: "Mega Glalie", type: "Gelo", price: INTERMEDIATE_PRICE },
  { id: "salamencite", name: "Salamencite", baseSpeciesId: 373, baseName: "Salamence", formId: 10089, megaName: "Mega Salamence", type: "Dragão/Voador", price: PSEUDO_LEGENDARY_PRICE },
  { id: "metagrossite", name: "Metagrossite", baseSpeciesId: 376, baseName: "Metagross", formId: 10076, megaName: "Mega Metagross", type: "Aço/Psíquico", price: PSEUDO_LEGENDARY_PRICE },
  { id: "latiasite", name: "Latiasite", baseSpeciesId: 380, baseName: "Latias", formId: 10062, megaName: "Mega Latias", type: "Dragão/Psíquico", price: LEGENDARY_PRICE, legendary: true },
  { id: "latiosite", name: "Latiosite", baseSpeciesId: 381, baseName: "Latios", formId: 10063, megaName: "Mega Latios", type: "Dragão/Psíquico", price: LEGENDARY_PRICE, legendary: true },
  { id: "rayquazite", name: "Rayquazite", baseSpeciesId: 384, baseName: "Rayquaza", formId: 10079, megaName: "Mega Rayquaza", type: "Dragão/Voador", price: LEGENDARY_PRICE, legendary: true },
  { id: "lopunnite", name: "Lopunnite", baseSpeciesId: 428, baseName: "Lopunny", formId: 10088, megaName: "Mega Lopunny", type: "Normal/Lutador", price: POWERFUL_PRICE },
  { id: "garchompite", name: "Garchompite", baseSpeciesId: 445, baseName: "Garchomp", formId: 10058, megaName: "Mega Garchomp", type: "Dragão/Terra", price: PSEUDO_LEGENDARY_PRICE },
  { id: "lucarionite", name: "Lucarionite", baseSpeciesId: 448, baseName: "Lucario", formId: 10059, megaName: "Mega Lucario", type: "Lutador/Aço", price: POWERFUL_PRICE },
  { id: "abomasite", name: "Abomasite", baseSpeciesId: 460, baseName: "Abomasnow", formId: 10060, megaName: "Mega Abomasnow", type: "Planta/Gelo", price: INTERMEDIATE_PRICE },
  { id: "galladite", name: "Galladite", baseSpeciesId: 475, baseName: "Gallade", formId: 10068, megaName: "Mega Gallade", type: "Psíquico/Lutador", price: INTERMEDIATE_PRICE },
  { id: "audinite", name: "Audinite", baseSpeciesId: 531, baseName: "Audino", formId: 10069, megaName: "Mega Audino", type: "Normal/Fada", price: INTERMEDIATE_PRICE },
  { id: "diancite", name: "Diancite", baseSpeciesId: 719, baseName: "Diancie", formId: 10075, megaName: "Mega Diancie", type: "Pedra/Fada", price: LEGENDARY_PRICE, legendary: true },
  ...NEW_MEGA_STONES
];

const loadedMegaFormData = new Map();

function translatedType(types = []) {
  return types.map((type) => TYPE_LABELS_PT[type] || type).join("/");
}

function normalizeShowdownEntry(entry = {}) {
  const stats = entry.baseStats || {};
  const baseStats = {
    hp: Math.max(1, Number(stats.hp) || 1),
    attack: Math.max(1, Number(stats.atk) || 1),
    defense: Math.max(1, Number(stats.def) || 1),
    specialAttack: Math.max(1, Number(stats.spa) || 1),
    specialDefense: Math.max(1, Number(stats.spd) || 1),
    speed: Math.max(1, Number(stats.spe) || 1)
  };

  return {
    baseStats,
    type: translatedType(Array.isArray(entry.types) ? entry.types : []),
    heightDm: Math.max(1, Math.round((Number(entry.heightm) || 1) * 10)),
    requiredItem: entry.requiredItem ? String(entry.requiredItem) : ""
  };
}

function applyLoadedMegaData(stone, data) {
  if (!stone || !data?.baseStats) return false;
  loadedMegaFormData.set(stone.id, data);
  if (data.type) stone.type = data.type;
  if (data.requiredItem) stone.name = data.requiredItem;
  return true;
}

function restoreCachedMegaData() {
  if (typeof localStorage === "undefined") return 0;
  try {
    const cached = JSON.parse(localStorage.getItem(NEW_MEGA_CACHE_KEY) || "{}");
    let restored = 0;
    NEW_MEGA_STONES.forEach((stone) => {
      if (applyLoadedMegaData(stone, cached[stone.showdownKey])) restored += 1;
    });
    return restored;
  } catch {
    localStorage.removeItem(NEW_MEGA_CACHE_KEY);
    return 0;
  }
}

restoreCachedMegaData();

export async function loadMegaFormData() {
  const cachedCount = loadedMegaFormData.size;
  try {
    const response = await fetch(SHOWDOWN_POKEDEX_URL, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Falha ao carregar novas Megas: ${response.status}`);
    const pokedex = await response.json();
    const cache = {};
    let loaded = 0;

    NEW_MEGA_STONES.forEach((stone) => {
      const entry = pokedex?.[stone.showdownKey];
      if (!entry?.baseStats) return;
      const normalized = normalizeShowdownEntry(entry);
      cache[stone.showdownKey] = normalized;
      if (applyLoadedMegaData(stone, normalized)) loaded += 1;
    });

    if (typeof localStorage !== "undefined" && loaded) {
      localStorage.setItem(NEW_MEGA_CACHE_KEY, JSON.stringify(cache));
    }
    return loaded === NEW_MEGA_STONES.length;
  } catch (error) {
    console.warn("Idle Jorneymon: usando dados de segurança para as novas Megaevoluções.", error);
    return cachedCount === NEW_MEGA_STONES.length;
  }
}

export const MEGA_FORM_IDS = [...new Set(
  MEGA_STONES
    .map((stone) => Number(stone.formId))
    .filter(Number.isFinite)
)];

export function getMegaStone(stoneId) {
  return MEGA_STONES.find((stone) => stone.id === String(stoneId || "")) || null;
}

export function getMegaStonesForSpecies(speciesId) {
  return MEGA_STONES.filter((stone) => stone.baseSpeciesId === Number(speciesId));
}

export function getMegaFormData(stoneOrId) {
  const stone = typeof stoneOrId === "object" ? stoneOrId : getMegaStone(stoneOrId);
  return stone ? loadedMegaFormData.get(stone.id) || null : null;
}

export function getMegaSpriteUrls(stoneOrId, isShiny = false) {
  const stone = typeof stoneOrId === "object" ? stoneOrId : getMegaStone(stoneOrId);
  if (!stone) return null;

  const customSprite = isShiny
    ? stone.shinySpriteUrl || stone.spriteUrl
    : stone.spriteUrl;
  const customBackSprite = isShiny
    ? stone.shinyBackSpriteUrl || stone.backSpriteUrl || customSprite
    : stone.backSpriteUrl || customSprite;

  if (customSprite) {
    return {
      sprite: customSprite,
      backSprite: customBackSprite
    };
  }

  if (!stone.spriteSlug) return null;
  const frontDirectory = isShiny ? "ani-shiny" : "ani";
  const backDirectory = isShiny ? "ani-back-shiny" : "ani-back";
  return {
    sprite: `${SHOWDOWN_SPRITE_BASE}/${frontDirectory}/${stone.spriteSlug}.gif`,
    backSprite: `${SHOWDOWN_SPRITE_BASE}/${backDirectory}/${stone.spriteSlug}.gif`
  };
}
