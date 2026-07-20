import { EVOLUTION_RULES } from "./evolutions.js";

const OFFICIAL_POKEMON_URL = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon.csv";
const METRICS_CACHE_KEY = "idle-jorneymon-official-metrics-v1";

const officialMetrics = new Map();

const FALLBACK_HEIGHT_DM = {
  1: 7, 2: 10, 3: 20, 4: 6, 5: 11, 6: 17, 7: 5, 8: 10, 9: 16,
  10: 3, 11: 7, 12: 11, 13: 3, 14: 6, 15: 10, 16: 3, 17: 11, 18: 15,
  43: 5, 44: 8, 45: 12, 95: 88, 130: 65, 144: 17, 150: 20, 248: 20,
  373: 15, 376: 16, 445: 19, 464: 24, 487: 45, 635: 18
};

const GLOBAL_EXPLORATION_SCALE = 1.3;
const EXTRA_SPRITE_PIXELS = 30;
const STAGE_BONUS_PIXELS = { 1: 0, 2: 12, 3: 24 };

// Tamanhos finais dos Pokémon de primeiro estágio usados no jogo.
// Mantêm cada espécie abaixo de 100 px, respeitando sua forma e porte visual.
const FIRST_STAGE_SPRITE_SIZES = {
  1: 92,    // Bulbasaur
  4: 89,    // Charmander
  7: 86,    // Squirtle
  10: 78,   // Caterpie
  13: 76,   // Weedle
  16: 80,   // Pidgey
  41: 94,   // Zubat
  43: 84,   // Oddish
  60: 88,   // Poliwag
  63: 98,   // Abra
  66: 96,   // Machop
  74: 84,   // Geodude
  92: 98,   // Gastly
  111: 99,  // Rhyhorn
  116: 82,  // Horsea
  147: 89,  // Dratini
  218: 91,  // Slugma
  220: 84,  // Swinub
  240: 92,  // Magby
  246: 90,  // Larvitar
  252: 86,  // Treecko
  258: 84,  // Mudkip
  265: 78,  // Wurmple
  270: 86,  // Lotad
  273: 84,  // Seedot
  304: 86,  // Aron
  322: 94,  // Numel
  328: 92,  // Trapinch
  353: 89,  // Shuppet
  355: 95,  // Duskull
  361: 91,  // Snorunt
  363: 96,  // Spheal
  371: 91,  // Bagon
  374: 90,  // Beldum
  390: 86,  // Chimchar
  443: 93,  // Gible
  524: 84,  // Roggenrola
  540: 78,  // Sewaddle
  543: 82,  // Venipede
  562: 86,  // Yamask
  582: 82,  // Vanillite
  607: 78,  // Litwick
  610: 90,  // Axew
  613: 86,  // Cubchoo
  633: 96   // Deino
};

// Ajustes apenas para compensar a área transparente e o enquadramento de alguns GIFs.
// O tamanho principal continua vindo da altura oficial de cada espécie.
const VISUAL_SCALE_OVERRIDES = {
  12: 0.88,  // Butterfree ocupa muita área visual no GIF
  15: 0.92,  // Beedrill possui asas largas
  17: 1.02,  // Pidgeotto
  18: 1.03,  // Pidgeot
  42: 1.08,  // Golbat precisa refletir melhor seus 1,6 m
  169: 1.08 // Crobat
};

function buildEvolutionStages() {
  const stages = new Map();
  const targets = new Set(Object.values(EVOLUTION_RULES).map((rule) => Number(rule.to)));

  Object.keys(EVOLUTION_RULES).map(Number).forEach((speciesId) => {
    if (!targets.has(speciesId)) stages.set(speciesId, 1);
  });

  for (let pass = 0; pass < 4; pass += 1) {
    Object.entries(EVOLUTION_RULES).forEach(([fromText, rule]) => {
      const from = Number(fromText);
      const currentStage = stages.get(from);
      if (!currentStage) return;
      stages.set(Number(rule.to), Math.min(3, currentStage + 1));
    });
  }

  return stages;
}

const evolutionStages = buildEvolutionStages();

function restoreCachedMetrics() {
  if (typeof localStorage === "undefined") return;
  try {
    const cached = JSON.parse(localStorage.getItem(METRICS_CACHE_KEY) || "{}");
    Object.entries(cached).forEach(([id, metrics]) => {
      if (Number(metrics?.heightDm) > 0) officialMetrics.set(Number(id), metrics);
    });
  } catch {
    localStorage.removeItem(METRICS_CACHE_KEY);
  }
}

restoreCachedMetrics();

export async function loadOfficialPokemonMetrics(speciesIds = []) {
  const wanted = new Set(speciesIds.map(Number).filter(Number.isFinite));
  const missing = [...wanted].filter((id) => !officialMetrics.has(id));
  if (!missing.length) return true;

  try {
    const response = await fetch(OFFICIAL_POKEMON_URL, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Falha ao carregar tamanhos: ${response.status}`);
    const rows = (await response.text()).trim().split(/\r?\n/).slice(1);

    rows.forEach((row) => {
      const [idText, , speciesIdText, heightText, weightText, , , isDefaultText] = row.split(",");
      const id = Number(idText);
      const speciesId = Number(speciesIdText);
      if (!wanted.has(speciesId) || Number(isDefaultText) !== 1 || id !== speciesId) return;
      const heightDm = Number(heightText);
      const weightHg = Number(weightText);
      if (heightDm > 0) officialMetrics.set(speciesId, { heightDm, weightHg });
    });

    if (typeof localStorage !== "undefined") {
      const cache = {};
      wanted.forEach((id) => {
        const metrics = officialMetrics.get(id);
        if (metrics) cache[id] = metrics;
      });
      localStorage.setItem(METRICS_CACHE_KEY, JSON.stringify(cache));
    }
    return true;
  } catch (error) {
    console.warn("Idle Jorneymon: usando tamanhos de segurança.", error);
    return false;
  }
}

export function getPokemonHeightDm(speciesId) {
  const id = Number(speciesId);
  return Number(officialMetrics.get(id)?.heightDm) || FALLBACK_HEIGHT_DM[id] || 10;
}

function getEvolutionStage(pokemon) {
  const explicitStage = Number(pokemon?.stage);
  if (explicitStage >= 1 && explicitStage <= 3) return explicitStage;
  return evolutionStages.get(Number(pokemon?.id)) || 1;
}

export function getExplorationSpriteSize(pokemon) {
  const speciesId = Number(pokemon?.id);
  const stage = getEvolutionStage(pokemon);
  const firstStageSize = FIRST_STAGE_SPRITE_SIZES[speciesId];

  if (stage === 1 && firstStageSize) return firstStageSize;

  const heightMeters = Math.max(0.1, (Number(pokemon?.heightDm) || getPokemonHeightDm(speciesId)) / 10);
  const heightBase = 36 + Math.sqrt(heightMeters) * 35;
  const giantScale = heightMeters > 2
    ? Math.min(1.38, 1 + (heightMeters - 2) * 0.055)
    : 1;
  const visualScale = VISUAL_SCALE_OVERRIDES[speciesId] || 1;
  const stageBonus = STAGE_BONUS_PIXELS[stage] || 0;
  const calculated = heightBase * GLOBAL_EXPLORATION_SCALE * giantScale * visualScale;

  return Math.round(Math.max(74, Math.min(270, calculated + stageBonus + EXTRA_SPRITE_PIXELS)));
}
