const SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";

export const PLAYER_TEMPLATE = {
  id: 4,
  name: "Charmander",
  level: 5,
  maxHp: 29,
  attack: 12,
  defense: 8,
  xp: 0,
  xpToNext: 30,
  sprite: `${SPRITE_BASE}/4.gif`,
  backSprite: `${SPRITE_BASE}/back/4.gif`
};

export const ROUTE_ONE_ENCOUNTERS = [
  { id: 19, name: "Rattata", baseHp: 18, attack: 8, defense: 6, xp: 12, sprite: `${SPRITE_BASE}/19.gif` },
  { id: 16, name: "Pidgey", baseHp: 20, attack: 8, defense: 7, xp: 13, sprite: `${SPRITE_BASE}/16.gif` },
  { id: 10, name: "Caterpie", baseHp: 22, attack: 7, defense: 8, xp: 11, sprite: `${SPRITE_BASE}/10.gif` },
  { id: 13, name: "Weedle", baseHp: 20, attack: 8, defense: 7, xp: 12, sprite: `${SPRITE_BASE}/13.gif` }
];

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
