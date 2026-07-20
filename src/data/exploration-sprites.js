const ANIMATED_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";
const SHOWDOWN_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown";
const LAST_GENERATION_FIVE_SPECIES_ID = 649;

export function getExplorationSpriteUrl(pokemon, forceShiny = Boolean(pokemon?.isShiny)) {
  const speciesId = Math.max(1, Number(pokemon?.megaFormId || pokemon?.id) || 1);
  const shinyPath = forceShiny ? "shiny/" : "";

  if (speciesId <= LAST_GENERATION_FIVE_SPECIES_ID) {
    return `${ANIMATED_SPRITE_BASE}/${shinyPath}${speciesId}.gif`;
  }

  return `${SHOWDOWN_SPRITE_BASE}/${shinyPath}${speciesId}.gif`;
}
