const STATIC_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

export function getExplorationSpriteUrl(pokemon, forceShiny = Boolean(pokemon?.isShiny)) {
  const speciesId = Math.max(1, Number(pokemon?.id) || 1);
  return `${STATIC_SPRITE_BASE}/${forceShiny ? "shiny/" : ""}${speciesId}.png`;
}
