import { ALL_SPECIES, getRouteDefinition } from "./worlds.js";

const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";
export const SHINY_CHANCE = 1 / 256;

export const STARTERS = [
  { id: 1, name: "Bulbasaur", type: "Planta", level: 5, maxHp: 31, attack: 11, defense: 10 },
  { id: 4, name: "Charmander", type: "Fogo", level: 5, maxHp: 29, attack: 12, defense: 8 },
  { id: 7, name: "Squirtle", type: "Água", level: 5, maxHp: 32, attack: 10, defense: 11 }
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

export function experienceToNextLevel(level) {
  const progress = Math.max(0, Number(level) - 5);
  return Math.round(30 + progress * 9 + Math.pow(progress, 1.22) * 2.2);
}

export function createStarter(starterId) {
  const selected = STARTERS.find((pokemon) => pokemon.id === Number(starterId)) || STARTERS[1];
  return {
    ...selected,
    uid: createInstanceId(selected.id),
    xp: 0,
    xpToNext: experienceToNextLevel(selected.level),
    hp: selected.maxHp
  };
}

export function createCapturedPokemon(wildPokemon) {
  return {
    id: wildPokemon.id,
    uid: createInstanceId(wildPokemon.id),
    name: wildPokemon.name,
    type: wildPokemon.type,
    rarity: wildPokemon.rarity,
    isShiny: Boolean(wildPokemon.isShiny),
    level: wildPokemon.level,
    maxHp: wildPokemon.maxHp,
    hp: wildPokemon.maxHp,
    attack: wildPokemon.attack,
    defense: wildPokemon.defense,
    xp: 0,
    xpToNext: experienceToNextLevel(wildPokemon.level),
    sprite: wildPokemon.sprite,
    backSprite: wildPokemon.backSprite
  };
}

export function createWildPokemon(state, playerLevel, random = Math.random) {
  const route = getRouteDefinition(state.journey?.worldIndex, state.journey?.routeIndex);
  const bossReady = state.area.regularVictories >= route.requiredVictories && !state.area.bossDefeated;
  const template = bossReady
    ? route.boss
    : route.encounters[Math.floor(random() * route.encounters.length)];
  const isFinalBoss = bossReady && route.bossType === "final";
  const levelOffset = bossReady ? (isFinalBoss ? 4 : 2) : Math.floor(random() * 3) - 1;
  const targetLevel = Math.max(2, route.recommendedLevel + levelOffset);
  const level = bossReady
    ? targetLevel
    : Math.max(targetLevel, Math.min(Number(playerLevel) + 1, route.recommendedLevel + 2));
  const levelScale = 1 + Math.max(0, level - 2) * 0.075;
  const bossScale = bossReady ? (isFinalBoss ? 1.65 : 1.28) : 1;
  const maxHp = Math.round(template.baseHp * levelScale * bossScale);
  const isShiny = random() < SHINY_CHANCE;
  const appearance = isShiny ? shinySprites(template) : withSprites(template);
  const rarity = bossReady
    ? (isFinalBoss ? (template.rarity === "legendary" ? "legendary" : "epic") : "rare")
    : template.rarity;

  return {
    ...appearance,
    rarity,
    isShiny,
    isBoss: bossReady,
    bossType: bossReady ? route.bossType : null,
    encounterRole: bossReady ? (isFinalBoss ? "final-boss" : "mini-boss") : "wild",
    level,
    maxHp,
    hp: maxHp,
    attack: Math.round(template.attack * levelScale * bossScale),
    defense: Math.round(template.defense * levelScale * bossScale),
    xpReward: Math.round(template.xp * (1 + level * 0.11) * (bossReady ? (isFinalBoss ? 2.8 : 2) : 1))
  };
}
