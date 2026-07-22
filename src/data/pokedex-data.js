import { POKEDEX_SPECIES, getPokemonSpriteUrls } from "./pokemon.js";
import { SAFARI_SPECIES } from "./safari-data.js";

export const COMPLETE_POKEDEX_SPECIES = [...new Map([
  ...POKEDEX_SPECIES,
  ...SAFARI_SPECIES.map((pokemon) => ({
    ...pokemon,
    ...getPokemonSpriteUrls(pokemon.id, false)
  }))
].map((pokemon) => [Number(pokemon.id), pokemon])).values()].sort((a, b) => a.id - b.id);
