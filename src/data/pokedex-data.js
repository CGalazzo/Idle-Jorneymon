import { CHAMPIONS_HALL_SPECIES } from "./champions-hall-data.js";
import { POKEDEX_SPECIES, getPokemonSpriteUrls } from "./pokemon.js";
import { SAFARI_SPECIES } from "./safari-data.js";

const withSprites = (pokemon) => ({
  ...pokemon,
  ...getPokemonSpriteUrls(pokemon.id, false)
});

export const COMPLETE_POKEDEX_SPECIES = [...new Map([
  ...POKEDEX_SPECIES,
  ...SAFARI_SPECIES.map(withSprites),
  ...CHAMPIONS_HALL_SPECIES.map(withSprites)
].map((pokemon) => [Number(pokemon.id), pokemon])).values()].sort((a, b) => a.id - b.id);
