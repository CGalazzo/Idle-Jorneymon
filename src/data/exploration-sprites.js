const ANIMATED_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";

export function getExplorationSpriteUrl(pokemon, forceShiny = Boolean(pokemon?.isShiny)) {
  const speciesId = Math.max(1, Number(pokemon?.id) || 1);
  return `${ANIMATED_SPRITE_BASE}/${forceShiny ? "shiny/" : ""}${speciesId}.gif`;
}
