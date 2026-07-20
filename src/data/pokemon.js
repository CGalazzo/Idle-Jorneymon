import { ALL_SPECIES, getRouteDefinition, getRouteLevelRange } from "./worlds.js";
import { HARD_SHINY_CHARM_CHANCE } from "./hard-endgame-data.js";
import {
  HARD_MODE_SPECIES,
  HARD_SHINY_CHANCE,
  getHardBossTemplate,
  getHardEncounterPool
} from "./hard-mode-data.js";
import {
  buildMoveSet,
  calculatePokemonStats,
  getOfficialBaseStats,
  parseTypes
} from "./battle-data.js";
import { getEvolutionRule } from "./evolutions.js";
import { getPokemonHeightDm } from "./pokemon-metrics.js";

const ANIMATED_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";
const SHOWDOWN_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown";
const LAST_GENERATION_FIVE_SPECIES_ID = 649;

export const SHINY_CHANCE = 1 / 256;
export const SHINY_STAT_MULTIPLIER = 1.2;
export const NORMAL_IV = 12;
export const STARTER_IV = 20;
export const MINI_BOSS_IV = 20;
export const FINAL_BOSS_IV = 31;
export const HARD_NORMAL_IV = 18;
export const HARD_MINI_BOSS_IV = 24;
export const HARD_FINAL_BOSS_IV = 31;

export const STARTERS = [
  { id: 1, name: "Bulbasaur", type: "Planta/Veneno", level: 5, rarity: "starter" },
  { id: 4, name: "Charmander", type: "Fogo", level: 5, rarity: "starter" },
  { id: 7, name: "Squirtle", type: "Água", level: 5, rarity: "starter" },
  { id: 152, name: "Chikorita", type: "Planta", level: 5, rarity: "starter" },
  { id: 155, name: "Cyndaquil", type: "Fogo", level: 5, rarity: "starter" },
  { id: 158, name: "Totodile", type: "Água", level: 5, rarity: "starter" },
  { id: 252, name: "Treecko", type: "Planta", level: 5, rarity: "starter" },
  { id: 255, name: "Torchic", type: "Fogo", level: 5, rarity: "starter" },
  { id: 258, name: "Mudkip", type: "Água", level: 5, rarity: "starter" },
  { id: 387, name: "Turtwig", type: "Planta", level: 5, rarity: "starter" },
  { id: 390, name: "Chimchar", type: "Fogo", level: 5, rarity: "starter" },
  { id: 393, name: "Piplup", type: "Água", level: 5, rarity: "starter" }
].map(withSprites);

const STARTER_EVOLUTION_SPECIES = [
  { id: 153, name: "Bayleef", type: "Planta", rarity: "uncommon" },
  { id: 154, name: "Meganium", type: "Planta", rarity: "rare" },
  { id: 156, name: "Quilava", type: "Fogo", rarity: "uncommon" },
  { id: 157, name: "Typhlosion", type: "Fogo", rarity: "rare" },
  { id: 159, name: "Croconaw", type: "Água", rarity: "uncommon" },
  { id: 160, name: "Feraligatr", type: "Água", rarity: "rare" },
  { id: 388, name: "Grotle", type: "Planta", rarity: "uncommon" },
  { id: 389, name: "Torterra", type: "Planta/Terra", rarity: "rare" },
  { id: 391, name: "Monferno", type: "Fogo/Lutador", rarity: "uncommon" },
  { id: 392, name: "Infernape", type: "Fogo/Lutador", rarity: "rare" },
  { id: 394, name: "Prinplup", type: "Água", rarity: "uncommon" },
  { id: 395, name: "Empoleon", type: "Água/Aço", rarity: "rare" }
].map(withSprites);

export const POKEDEX_SPECIES = [...new Map(
  [
    ...STARTERS,
    ...STARTER_EVOLUTION_SPECIES,
    ...ALL_SPECIES.map(withSprites),
    ...HARD_MODE_SPECIES.map(withSprites)
  ].map((pokemon) => [pokemon.id, pokemon])
).values()].sort((a, b) => a.id - b.id);

export function createInstanceId(speciesId) {
  return `${speciesId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getPokemonSpriteUrls(speciesId, isShiny = false) {
  const id = Math.max(1, Number(speciesId) || 1);
  const shinyPath = isShiny ? "shiny/" : "";
  const backShinyPath = isShiny ? "back/shiny/" : "back/";

  if (id <= LAST_GENERATION_FIVE_SPECIES_ID) {
    return {
      sprite: `${ANIMATED_SPRITE_BASE}/${shinyPath}${id}.gif`,
      backSprite: `${ANIMATED_SPRITE_BASE}/${backShinyPath}${id}.gif`
    };
  }

  return {
    sprite: `${SHOWDOWN_SPRITE_BASE}/${shinyPath}${id}.gif`,
    backSprite: `${SHOWDOWN_SPRITE_BASE}/${backShinyPath}${id}.gif`
  };
}

function withSprites(pokemon) {
  return { ...pokemon, ...getPokemonSpriteUrls(pokemon.id, false) };
}

function shinySprites(pokemon) {
  return { ...pokemon, ...getPokemonSpriteUrls(pokemon.id, true) };
}

function clampLevel(level) {
  return Math.max(1, Math.min(100, Number(level) || 1));
}

function clampIv(iv) {
  return Math.max(0, Math.min(31, Number(iv) || 0));
}

function applyShinyStatBonus(stats, isShiny = false) {
  if (!isShiny) return stats;
  return Object.fromEntries(
    Object.entries(stats).map(([stat, value]) => [
      stat,
      Math.max(1, Math.round((Number(value) || 1) * SHINY_STAT_MULTIPLIER))
    ])
  );
}

function createPokemonFromTemplate(template, level, iv, extra = {}) {
  const safeLevel = clampLevel(level);
  const safeIv = clampIv(iv);
  const type = template.type || "Normal";
  const baseStats = getOfficialBaseStats(template.id, template);
  const calculated = applyShinyStatBonus(
    calculatePokemonStats(baseStats, safeLevel, safeIv),
    Boolean(extra.isShiny)
  );
  const appearance = extra.isShiny ? shinySprites(template) : withSprites(template);

  return {
    ...appearance,
    ...extra,
    id: Number(template.id),
    name: template.name,
    type,
    types: parseTypes(type),
    rarity: extra.rarity || template.rarity || "common",
    level: safeLevel,
    iv: safeIv,
    heightDm: getPokemonHeightDm(template.id),
    nature: "Neutra",
    evs: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
    baseStats,
    ...calculated,
    hp: calculated.maxHp,
    moves: buildMoveSet(type, baseStats)
  };
}

export function experienceToNextLevel(level) {
  const progress = Math.max(0, Number(level) - 5);
  return Math.round(30 + progress * 9 + Math.pow(progress, 1.22) * 2.2);
}

export function createStarter(starterId) {
  const selected = STARTERS.find((pokemon) => pokemon.id === Number(starterId)) || STARTERS[1];
  return {
    ...createPokemonFromTemplate(selected, selected.level, STARTER_IV),
    uid: createInstanceId(selected.id),
    xp: 0,
    xpToNext: experienceToNextLevel(selected.level)
  };
}

export function createCapturedPokemon(wildPokemon) {
  const capturedInHard = Boolean(wildPokemon.hardModeEncounter);
  const source = capturedInHard
    ? normalizePokemonInstance({
        ...wildPokemon,
        hardModeEncounter: false,
        hardStatMultiplier: undefined,
        hardSecondPhase: false,
        bossMegaActivated: false
      }, { heal: true })
    : { ...wildPokemon };

  delete source.xpReward;
  delete source.playerLevelAtEncounter;
  delete source.hardModeEncounter;
  delete source.hardStatMultiplier;
  delete source.hardSecondPhase;
  delete source.bossMegaActivated;
  delete source.hardBossMegaStoneId;
  delete source.megaOriginal;
  delete source.isMega;
  delete source.megaFormId;
  delete source.activeMegaStoneId;

  return {
    ...source,
    uid: createInstanceId(wildPokemon.id),
    isBoss: false,
    bossType: null,
    encounterRole: "captured",
    capturedInHard,
    hp: source.maxHp,
    xp: 0,
    xpToNext: experienceToNextLevel(wildPokemon.level)
  };
}

export function normalizePokemonInstance(pokemon, { refreshExperienceCurve = false, heal = false } = {}) {
  const template = POKEDEX_SPECIES.find((entry) => entry.id === Number(pokemon.id)) || pokemon;
  const level = clampLevel(pokemon.level);
  const iv = clampIv(pokemon.iv ?? NORMAL_IV);
  const type = template.type || pokemon.type || "Normal";
  const baseStats = getOfficialBaseStats(pokemon.id, { ...template, ...pokemon });
  const calculated = applyShinyStatBonus(
    calculatePokemonStats(baseStats, level, iv),
    Boolean(pokemon.isShiny)
  );
  const previousMaxHp = Math.max(1, Number(pokemon.maxHp) || calculated.maxHp);
  const previousHp = Math.max(0, Math.min(previousMaxHp, Number(pokemon.hp ?? previousMaxHp)));
  const hpRatio = previousHp / previousMaxHp;

  return {
    ...template,
    ...pokemon,
    ...getPokemonSpriteUrls(pokemon.id, Boolean(pokemon.isShiny)),
    id: Number(pokemon.id),
    uid: pokemon.uid || createInstanceId(pokemon.id),
    level,
    iv,
    heightDm: getPokemonHeightDm(pokemon.id),
    nature: "Neutra",
    evs: { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
    type,
    types: parseTypes(type),
    baseStats,
    ...calculated,
    hp: heal ? calculated.maxHp : Math.max(0, Math.min(calculated.maxHp, Math.round(calculated.maxHp * hpRatio))),
    moves: buildMoveSet(type, baseStats),
    xp: Math.max(0, Number(pokemon.xp) || 0),
    xpToNext: refreshExperienceCurve
      ? experienceToNextLevel(level)
      : Math.max(1, Number(pokemon.xpToNext) || experienceToNextLevel(level))
  };
}

export function recalculatePokemonForLevel(pokemon, heal = true) {
  const previousMaxHp = Math.max(1, Number(pokemon.maxHp) || 1);
  const previousHp = Math.max(0, Number(pokemon.hp) || 0);
  const baseStats = getOfficialBaseStats(pokemon.id, pokemon);
  const calculated = applyShinyStatBonus(
    calculatePokemonStats(baseStats, pokemon.level, pokemon.iv ?? NORMAL_IV),
    Boolean(pokemon.isShiny)
  );
  pokemon.baseStats = baseStats;
  pokemon.heightDm = getPokemonHeightDm(pokemon.id);
  pokemon.types = parseTypes(pokemon.type);
  pokemon.moves = buildMoveSet(pokemon.type, baseStats);
  Object.assign(pokemon, calculated);
  pokemon.hp = heal
    ? calculated.maxHp
    : Math.max(0, Math.min(calculated.maxHp, previousHp + calculated.maxHp - previousMaxHp));
  return pokemon;
}

export function evolvePokemonIfReady(pokemon, context = {}) {
  const rule = getEvolutionRule(pokemon.id, pokemon.level, { ...context, pokemon });
  if (!rule) return null;

  const target = POKEDEX_SPECIES.find((entry) => entry.id === rule.to);
  if (!target) return null;

  const fromId = pokemon.id;
  const fromName = pokemon.name;
  const evolved = createPokemonFromTemplate(target, pokemon.level, pokemon.iv ?? NORMAL_IV, {
    rarity: target.rarity || pokemon.rarity,
    isShiny: Boolean(pokemon.isShiny),
    isBoss: Boolean(pokemon.isBoss),
    bossType: pokemon.bossType || null,
    encounterRole: pokemon.encounterRole || "captured"
  });

  Object.assign(pokemon, evolved, {
    uid: pokemon.uid,
    xp: pokemon.xp,
    xpToNext: pokemon.xpToNext,
    hp: evolved.maxHp
  });

  return {
    fromId,
    fromName,
    toId: pokemon.id,
    toName: pokemon.name
  };
}

function baseExperienceFromStats(baseStats) {
  const total = Object.values(baseStats).reduce((sum, value) => sum + value, 0);
  return Math.max(8, Math.round(total / 30));
}

function applyHardEncounterStats(pokemon, multiplier) {
  const statKeys = ["maxHp", "attack", "defense", "specialAttack", "specialDefense", "speed"];
  statKeys.forEach((key) => {
    pokemon[key] = Math.max(1, Math.round((Number(pokemon[key]) || 1) * multiplier));
  });
  pokemon.hp = pokemon.maxHp;
  pokemon.hardModeEncounter = true;
  pokemon.hardStatMultiplier = multiplier;
  return pokemon;
}

export function createWildPokemon(state, playerLevel, random = Math.random) {
  const route = getRouteDefinition(state.journey?.worldIndex, state.journey?.routeIndex);
  const hardMode = state.campaignMode === "hard";
  const strongestTeamLevel = Math.max(1, ...(state.team || []).map((pokemon) => Number(pokemon.level) || 1));
  const levels = getRouteLevelRange(
    route.worldIndex,
    route.routeIndex,
    route.bossType,
    hardMode ? "hard" : "normal",
    strongestTeamLevel
  );
  const bossReady = state.area.regularVictories >= route.requiredVictories && !state.area.bossDefeated;
  const encounterPool = hardMode ? getHardEncounterPool(route) : route.encounters;
  const bossTemplate = hardMode ? getHardBossTemplate(route, POKEDEX_SPECIES) : route.boss;
  const template = bossReady
    ? bossTemplate
    : encounterPool[Math.floor(random() * encounterPool.length)];
  const isFinalBoss = bossReady && route.bossType === "final";
  const level = bossReady
    ? levels.bossLevel
    : levels.minLevel + Math.floor(random() * (levels.maxLevel - levels.minLevel + 1));
  const iv = hardMode
    ? (bossReady ? (isFinalBoss ? HARD_FINAL_BOSS_IV : HARD_MINI_BOSS_IV) : HARD_NORMAL_IV)
    : (bossReady ? (isFinalBoss ? FINAL_BOSS_IV : MINI_BOSS_IV) : NORMAL_IV);
  const hardShinyChance = state.hardEndgame?.shinyCharmOwned ? HARD_SHINY_CHARM_CHANCE : HARD_SHINY_CHANCE;
  const isShiny = random() < (hardMode ? hardShinyChance : SHINY_CHANCE);
  const rarity = bossReady
    ? (isFinalBoss ? (template.rarity === "legendary" ? "legendary" : "epic") : "rare")
    : template.rarity;
  const pokemon = createPokemonFromTemplate(template, level, iv, {
    rarity,
    isShiny,
    isBoss: bossReady,
    bossType: bossReady ? route.bossType : null,
    encounterRole: bossReady ? (isFinalBoss ? "final-boss" : "mini-boss") : "wild"
  });

  if (hardMode) {
    applyHardEncounterStats(pokemon, bossReady ? (isFinalBoss ? 1.6 : 1.4) : 1.25);
  }

  const bossXpMultiplier = bossReady ? (isFinalBoss ? 2.8 : 2) : 1;
  const hardXpMultiplier = hardMode ? 1.5 : 1;

  return {
    ...pokemon,
    xpReward: Math.round(baseExperienceFromStats(pokemon.baseStats) * (1 + level * 0.12) * bossXpMultiplier * hardXpMultiplier),
    playerLevelAtEncounter: Number(playerLevel) || 1
  };
}
