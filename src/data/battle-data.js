const OFFICIAL_STATS_URL = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_stats.csv";
const STATS_CACHE_KEY = "idle-jorneymon-official-stats-v1";
const STAT_KEYS = ["hp", "attack", "defense", "specialAttack", "specialDefense", "speed"];

const officialStats = new Map();

const FALLBACK_STATS = {
  1: [45, 49, 49, 65, 65, 45],
  2: [60, 62, 63, 80, 80, 60],
  3: [80, 82, 83, 100, 100, 80],
  4: [39, 52, 43, 60, 50, 65],
  5: [58, 64, 58, 80, 65, 80],
  6: [78, 84, 78, 109, 85, 100],
  7: [44, 48, 65, 50, 64, 43],
  8: [59, 63, 80, 65, 80, 58],
  9: [79, 83, 100, 85, 105, 78],
  10: [45, 30, 35, 20, 20, 45],
  11: [50, 20, 55, 25, 25, 30],
  12: [60, 45, 50, 90, 80, 70],
  13: [40, 35, 30, 20, 20, 50],
  14: [45, 25, 50, 25, 25, 35],
  15: [65, 90, 40, 45, 80, 75],
  16: [40, 45, 40, 35, 35, 56],
  17: [63, 60, 55, 50, 50, 71],
  18: [83, 80, 75, 70, 70, 101],
  43: [45, 50, 55, 75, 65, 30],
  44: [60, 65, 70, 85, 75, 40],
  45: [75, 80, 85, 110, 90, 50]
};

const TYPE_ALIASES = {
  normal: "normal",
  lutador: "fighting",
  fighting: "fighting",
  voador: "flying",
  flying: "flying",
  veneno: "poison",
  poison: "poison",
  terra: "ground",
  ground: "ground",
  pedra: "rock",
  rock: "rock",
  inseto: "bug",
  bug: "bug",
  fantasma: "ghost",
  ghost: "ghost",
  aço: "steel",
  aco: "steel",
  steel: "steel",
  fogo: "fire",
  fire: "fire",
  água: "water",
  agua: "water",
  water: "water",
  planta: "grass",
  grass: "grass",
  elétrico: "electric",
  eletrico: "electric",
  electric: "electric",
  psíquico: "psychic",
  psiquico: "psychic",
  psychic: "psychic",
  gelo: "ice",
  ice: "ice",
  dragão: "dragon",
  dragao: "dragon",
  dragon: "dragon",
  sombrio: "dark",
  dark: "dark",
  fada: "fairy",
  fairy: "fairy"
};

export const TYPE_LABELS = {
  normal: "Normal",
  fighting: "Lutador",
  flying: "Voador",
  poison: "Veneno",
  ground: "Terra",
  rock: "Pedra",
  bug: "Inseto",
  ghost: "Fantasma",
  steel: "Aço",
  fire: "Fogo",
  water: "Água",
  grass: "Planta",
  electric: "Elétrico",
  psychic: "Psíquico",
  ice: "Gelo",
  dragon: "Dragão",
  dark: "Sombrio",
  fairy: "Fada"
};

const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fighting: { normal: 2, ice: 2, rock: 2, dark: 2, steel: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, fairy: 0.5, ghost: 0 },
  flying: { grass: 2, fighting: 2, bug: 2, electric: 0.5, rock: 0.5, steel: 0.5 },
  poison: { grass: 2, fairy: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0 },
  ground: { fire: 2, electric: 2, poison: 2, rock: 2, steel: 2, grass: 0.5, bug: 0.5, flying: 0 },
  rock: { fire: 2, ice: 2, flying: 2, bug: 2, fighting: 0.5, ground: 0.5, steel: 0.5 },
  bug: { grass: 2, psychic: 2, dark: 2, fire: 0.5, fighting: 0.5, poison: 0.5, flying: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5 },
  ghost: { psychic: 2, ghost: 2, dark: 0.5, normal: 0 },
  steel: { ice: 2, rock: 2, fairy: 2, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
  fire: { grass: 2, ice: 2, bug: 2, steel: 2, fire: 0.5, water: 0.5, rock: 0.5, dragon: 0.5 },
  water: { fire: 2, ground: 2, rock: 2, water: 0.5, grass: 0.5, dragon: 0.5 },
  grass: { water: 2, ground: 2, rock: 2, fire: 0.5, grass: 0.5, poison: 0.5, flying: 0.5, bug: 0.5, dragon: 0.5, steel: 0.5 },
  electric: { water: 2, flying: 2, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, steel: 0.5, dark: 0 },
  ice: { grass: 2, ground: 2, flying: 2, dragon: 2, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { psychic: 2, ghost: 2, fighting: 0.5, dark: 0.5, fairy: 0.5 },
  fairy: { fighting: 2, dragon: 2, dark: 2, fire: 0.5, poison: 0.5, steel: 0.5 }
};

const MOVE_LIBRARY = {
  normal: { physical: ["Investida", 40], special: ["Ataque Estelar", 40] },
  fighting: { physical: ["Golpe Karatê", 50], special: ["Esfera de Aura", 50] },
  flying: { physical: ["Ataque de Asa", 40], special: ["Rajada de Ar", 40] },
  poison: { physical: ["Ferrão Venenoso", 40], special: ["Ácido", 40] },
  ground: { physical: ["Tiro de Lama", 40], special: ["Poder da Terra", 45] },
  rock: { physical: ["Arremesso de Rocha", 50], special: ["Gema de Poder", 50] },
  bug: { physical: ["Picada", 40], special: ["Zumbido de Inseto", 40] },
  ghost: { physical: ["Lambida", 40], special: ["Vento Sinistro", 40] },
  steel: { physical: ["Garra de Metal", 50], special: ["Canhão de Flash", 50] },
  fire: { physical: ["Roda de Fogo", 40], special: ["Brasa", 40] },
  water: { physical: ["Jato d'Água", 40], special: ["Pistola d'Água", 40] },
  grass: { physical: ["Folha Navalha", 45], special: ["Absorver", 40] },
  electric: { physical: ["Faísca", 40], special: ["Choque do Trovão", 40] },
  psychic: { physical: ["Corte Psíquico", 40], special: ["Confusão", 50] },
  ice: { physical: ["Estilhaço de Gelo", 40], special: ["Neve em Pó", 40] },
  dragon: { physical: ["Garra do Dragão", 50], special: ["Sopro do Dragão", 40] },
  dark: { physical: ["Mordida", 50], special: ["Pulso Sombrio", 50] },
  fairy: { physical: ["Carinho", 40], special: ["Vento de Fada", 40] }
};

function statsArrayToObject(values) {
  return Object.fromEntries(STAT_KEYS.map((key, index) => [key, Number(values[index]) || 1]));
}

function restoreCachedStats() {
  if (typeof localStorage === "undefined") return;
  try {
    const cached = JSON.parse(localStorage.getItem(STATS_CACHE_KEY) || "{}");
    Object.entries(cached).forEach(([id, values]) => {
      if (Array.isArray(values) && values.length === 6) officialStats.set(Number(id), statsArrayToObject(values));
    });
  } catch {
    localStorage.removeItem(STATS_CACHE_KEY);
  }
}

restoreCachedStats();

export async function loadOfficialPokemonData(speciesIds = []) {
  const wanted = new Set(speciesIds.map(Number).filter(Number.isFinite));
  const missing = [...wanted].filter((id) => !officialStats.has(id));
  if (!missing.length) return true;

  try {
    const response = await fetch(OFFICIAL_STATS_URL, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Falha ao carregar atributos: ${response.status}`);
    const rows = (await response.text()).trim().split(/\r?\n/).slice(1);
    const temporary = new Map();

    rows.forEach((row) => {
      const [pokemonIdText, statIdText, baseStatText] = row.split(",");
      const pokemonId = Number(pokemonIdText);
      if (!wanted.has(pokemonId)) return;
      const statId = Number(statIdText);
      if (statId < 1 || statId > 6) return;
      if (!temporary.has(pokemonId)) temporary.set(pokemonId, Array(6).fill(0));
      temporary.get(pokemonId)[statId - 1] = Number(baseStatText);
    });

    temporary.forEach((values, id) => {
      if (values.every((value) => value > 0)) officialStats.set(id, statsArrayToObject(values));
    });

    if (typeof localStorage !== "undefined") {
      const cache = {};
      wanted.forEach((id) => {
        const stats = officialStats.get(id);
        if (stats) cache[id] = STAT_KEYS.map((key) => stats[key]);
      });
      localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(cache));
    }
    return true;
  } catch (error) {
    console.warn("Idle Jorneymon: usando atributos de segurança.", error);
    return false;
  }
}

export function normalizeType(type) {
  const key = String(type || "normal").trim().toLowerCase();
  return TYPE_ALIASES[key] || "normal";
}

export function parseTypes(type) {
  const values = Array.isArray(type) ? type : String(type || "Normal").split("/");
  return [...new Set(values.map(normalizeType))];
}

function derivedFallback(template = {}) {
  const stage = template.rarity === "epic" || template.rarity === "legendary" ? 3 : template.rarity === "rare" || template.rarity === "uncommon" ? 2 : 1;
  const attack = Math.max(30, (Number(template.attack) || 8) * 5);
  const defense = Math.max(30, (Number(template.defense) || 8) * 5);
  return {
    hp: Math.max(35, (Number(template.baseHp) || 20) * 2),
    attack,
    defense,
    specialAttack: Math.max(30, Math.round(attack * (stage === 1 ? 0.9 : 1))),
    specialDefense: Math.max(30, Math.round(defense * (stage === 1 ? 0.9 : 1))),
    speed: 35 + stage * 15
  };
}

export function getOfficialBaseStats(speciesId, template = {}) {
  const id = Number(speciesId);
  if (officialStats.has(id)) return { ...officialStats.get(id) };
  if (FALLBACK_STATS[id]) return statsArrayToObject(FALLBACK_STATS[id]);
  return derivedFallback(template);
}

function calculateHp(base, level, iv) {
  return Math.floor(((2 * base + iv) * level) / 100) + level + 10;
}

function calculateOther(base, level, iv) {
  return Math.floor(((2 * base + iv) * level) / 100) + 5;
}

export function calculatePokemonStats(baseStats, level, iv = 12) {
  const safeLevel = Math.max(1, Math.min(100, Number(level) || 1));
  const safeIv = Math.max(0, Math.min(31, Number(iv) || 0));
  return {
    maxHp: calculateHp(baseStats.hp, safeLevel, safeIv),
    attack: calculateOther(baseStats.attack, safeLevel, safeIv),
    defense: calculateOther(baseStats.defense, safeLevel, safeIv),
    specialAttack: calculateOther(baseStats.specialAttack, safeLevel, safeIv),
    specialDefense: calculateOther(baseStats.specialDefense, safeLevel, safeIv),
    speed: calculateOther(baseStats.speed, safeLevel, safeIv)
  };
}

function moveForType(type, preferredCategory) {
  const normalizedType = normalizeType(type);
  const library = MOVE_LIBRARY[normalizedType] || MOVE_LIBRARY.normal;
  const category = preferredCategory === "special" ? "special" : "physical";
  const [name, power] = library[category];
  return { name, type: normalizedType, category, power, accuracy: 100 };
}

export function buildMoveSet(type, baseStats) {
  const types = parseTypes(type);
  const preferredCategory = baseStats.specialAttack > baseStats.attack ? "special" : "physical";
  const moves = types.map((pokemonType) => moveForType(pokemonType, preferredCategory));
  const normalCoverage = moveForType("normal", preferredCategory);
  if (!moves.some((move) => move.type === "normal")) moves.push(normalCoverage);
  return moves.slice(0, 3);
}

export function getTypeEffectiveness(moveType, defenderTypes) {
  const attackType = normalizeType(moveType);
  return parseTypes(defenderTypes).reduce((multiplier, defenderType) => {
    return multiplier * (TYPE_CHART[attackType]?.[defenderType] ?? 1);
  }, 1);
}

export function effectivenessLabel(multiplier) {
  if (multiplier === 0) return "Não teve efeito!";
  if (multiplier >= 2) return "Foi super efetivo!";
  if (multiplier < 1) return "Não foi muito efetivo...";
  return "";
}
