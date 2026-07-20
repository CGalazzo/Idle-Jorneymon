import { ALL_SPECIES, getRouteDefinition, getRouteLevelRange } from "./worlds.js";
import {
  buildMoveSet,
  calculatePokemonStats,
  getOfficialBaseStats,
  parseTypes
} from "./battle-data.js";
import { getEvolutionRule } from "./evolutions.js";
import { getPokemonHeightDm } from "./pokemon-metrics.js";

const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";
export const SHINY_CHANCE = 1 / 256;
export const SHINY_STAT_MULTIPLIER = 1.2;
export const NORMAL_IV = 12;
export const STARTER_IV = 20;
export const MINI_BOSS_IV = 20;
export const FINAL_BOSS_IV = 31;

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

export const POKEDEX_SPECIES = [...new Map(
  [...STARTERS, ...ALL_SPECIES.map(withSprites)].map((pokemon) => [pokemon.id, pokemon])
).values()].sort((a, b) => a.id - b.id);

export function createInstanceId(speciesId) {
  return `${speciesId}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function withSprites(pokemon) {
  return {
    ...pokemon,
    sprite: `${SPRITE_BASE}/${pokemon.id}.gif`,
    backSprite: `${SPRITE_BASE}/back/${pokemon.id}.gif`
  };
}

function shinySprites(pokemon) {
  return {
    ...pokemon,
    sprite: `${SPRITE_BASE}/shiny/${pokemon.id}.gif`,
    backSprite: `${SPRITE_BASE}/back/shiny/${pokemon.id}.gif`
  };
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
  return {
    ...wildPokemon,
    uid: createInstanceId(wildPokemon.id),
    isBoss: false,
    bossType: null,
    encounterRole: "captured",
    hp: wildPokemon.maxHp,
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
    ...pokemon,
    ...withSprites(template),
    id: Number(pokemon.id),
    name: pokemon.name || template.name,
    type,
    types: parseTypes(type),
    level,
    iv,
    heightDm: getPokemonHeightDm(pokemon.id),
    nature: pokemon.nature || "Neutra",
    evs: pokemon.evs || { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 },
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