import { CHAMPIONS_HALL_SPECIES } from "./champions-hall-data.js";
import { POKEDEX_SPECIES, getPokemonSpriteUrls } from "./pokemon.js";
import { SAFARI_SPECIES } from "./safari-data.js";

export const COMPLETE_POKEDEX_SPECIES = [...new Map([
  ...POKEDEX_SPECIES,
  ...SAFARI_SPECIES,
  ...CHAMPIONS_HALL_SPECIES
].map((pokemon) => [Number(pokemon.id), {
  ...pokemon,
  ...getPokemonSpriteUrls(pokemon.id, false)
}])).values()].sort((a, b) => a.id - b.id);
