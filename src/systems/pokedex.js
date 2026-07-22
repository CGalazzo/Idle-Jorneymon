export const POKEDEX_SEEN_EVENT = "idle-jorneymon-pokedex-seen";

function dispatchSeenEvent(pokemonId, pokemon, entry) {
  if (typeof window === "undefined" || typeof window.CustomEvent !== "function") return;
  window.dispatchEvent(new CustomEvent(POKEDEX_SEEN_EVENT, {
    detail: {
      pokemonId,
      isShiny: Boolean(pokemon?.isShiny),
      entry
    }
  }));
}

export function registerPokedexSeen(state, pokemon) {
  const pokemonId = Number(pokemon?.id);
  if (!state || !Number.isFinite(pokemonId) || pokemonId <= 0) return false;

  if (!state.pokedex || typeof state.pokedex !== "object") state.pokedex = {};

  const current = state.pokedex[pokemonId] || {
    seen: 0,
    caught: 0,
    shinySeen: 0,
    shinyCaught: 0
  };
  const seen = Math.max(0, Number(current.seen) || 0);
  const shinySeen = Math.max(0, Number(current.shinySeen) || 0);
  const shinyCaught = Math.max(0, Number(current.shinyCaught) || 0);
  const firstRegistrationForEncounter = !pokemon.pokedexSeenRegistered;
  const needsNormalBackfill = seen <= 0;
  const needsShinyBackfill = Boolean(pokemon.isShiny) && shinySeen <= 0 && shinyCaught <= 0;

  if (!firstRegistrationForEncounter && !needsNormalBackfill && !needsShinyBackfill) return false;

  const shouldCountShiny = Boolean(pokemon.isShiny)
    && (firstRegistrationForEncounter || needsShinyBackfill);
  const nextEntry = {
    ...current,
    seen: firstRegistrationForEncounter ? seen + 1 : Math.max(1, seen),
    shinySeen: Math.max(
      shinyCaught > 0 ? 1 : 0,
      shinySeen + (shouldCountShiny ? 1 : 0)
    )
  };

  pokemon.pokedexSeenRegistered = true;
  state.pokedex[pokemonId] = nextEntry;
  dispatchSeenEvent(pokemonId, pokemon, nextEntry);
  return true;
}

export function ensureCurrentEnemyRegistered(state) {
  return registerPokedexSeen(state, state?.enemy);
}
