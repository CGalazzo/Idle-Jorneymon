const ANIMATED_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";
const STATIC_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const LAST_ANIMATED_SPECIES_ID = 649;

export function getExplorationSpriteUrl(pokemon, forceShiny = Boolean(pokemon?.isShiny)) {
  const speciesId = Math.max(1, Number(pokemon?.id) || 1);
  if (speciesId <= LAST_ANIMATED_SPECIES_ID) {
    return `${ANIMATED_SPRITE_BASE}/${forceShiny ? "shiny/" : ""}${speciesId}.gif`;
  }
  return `${STATIC_SPRITE_BASE}/${forceShiny ? "shiny/" : ""}${speciesId}.png`;
}
