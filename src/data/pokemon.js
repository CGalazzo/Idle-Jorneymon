const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";

export const STARTERS = [
  { id: 1, name: "Bulbasaur", type: "Planta", level: 5, maxHp: 31, attack: 11, defense: 10 },
  { id: 4, name: "Charmander", type: "Fogo", level: 5, maxHp: 29, attack: 12, defense: 8 },
  { id: 7, name: "Squirtle", type: "Água", level: 5, maxHp: 32, attack: 10, defense: 11 }
].map(withSprites);

export const ROUTE_ONE_ENCOUNTERS = [
  { id: 19, name: "Rattata", type: "Normal", baseHp: 18, attack: 8, defense: 6, xp: 12 },
  { id: 16, name: "Pidgey", type: "Normal/Voador", baseHp: 20, attack: 8, defense: 7, xp: 13 },
  { id: 10, name: "Caterpie", type: "Inseto", baseHp: 22, attack: 7, defense: 8, xp: 11 },
  { id: 13, name: "Weedle", type: "Inseto/Veneno", baseHp: 20, attack: 8, defense: 7, xp: 12 }
].map(withSprites);

export const POKEDEX_SPECIES = [...STARTERS, ...ROUTE_ONE_ENCOUNTERS];

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

export function createStarter(starterId) {
  const selected = STARTERS.find((pokemon) => pokemon.id === Number(starterId)) || STARTERS[1];
  return {
    ...selected,
    uid: createInstanceId(selected.id),
    xp: 0,
    xpToNext: 30,
    hp: selected.maxHp
  };
}

export function createCapturedPokemon(wildPokemon) {
  return {
    id: wildPokemon.id,
    uid: createInstanceId(wildPokemon.id),
    name: wildPokemon.name,
    type: wildPokemon.type,
    level: wildPokemon.level,
    maxHp: wildPokemon.maxHp,
    hp: wildPokemon.maxHp,
    attack: wildPokemon.attack,
    defense: wildPokemon.defense,
    xp: 0,
    xpToNext: Math.round(30 * Math.pow(1.28, Math.max(0, wildPokemon.level - 5))),
    sprite: wildPokemon.sprite,
    backSprite: wildPokemon.backSprite
  };
}

export function createWildPokemon(playerLevel, random = Math.random) {
  const template = ROUTE_ONE_ENCOUNTERS[Math.floor(random() * ROUTE_ONE_ENCOUNTERS.length)];
  const level = Math.max(2, playerLevel - 2 + Math.floor(random() * 3));
  const scale = 1 + (level - 2) * 0.09;
  const maxHp = Math.round(template.baseHp * scale);

  return {
    ...template,
    level,
    maxHp,
    hp: maxHp,
    attack: Math.round(template.attack * scale),
    defense: Math.round(template.defense * scale),
    xpReward: Math.round(template.xp * (1 + level * 0.08))
  };
}
