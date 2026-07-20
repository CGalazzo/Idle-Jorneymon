import { addLog } from "../core/game-state.js";
import {
  evolvePokemonIfReady,
  experienceToNextLevel,
  recalculatePokemonForLevel
} from "../data/pokemon.js";
import { ENVIRONMENTS } from "../data/worlds.js";

function registerEvolution(state, pokemon, evolution) {
  const entry = state.pokedex[evolution.toId] || { seen: 0, caught: 0, shinyCaught: 0 };
  state.pokedex[evolution.toId] = {
    ...entry,
    seen: Math.max(1, entry.seen || 0),
    caught: (entry.caught || 0) + 1,
    shinyCaught: (entry.shinyCaught || 0) + (pokemon.isShiny ? 1 : 0)
  };

  const collectionEntry = state.collection[evolution.toId];
  state.collection[evolution.toId] = collectionEntry
    ? {
        ...collectionEntry,
        count: (collectionEntry.count || 0) + 1,
        shinyCount: (collectionEntry.shinyCount || 0) + (pokemon.isShiny ? 1 : 0)
      }
    : {
        count: 1,
        shinyCount: pokemon.isShiny ? 1 : 0,
        firstCaughtAt: Date.now()
      };

  addLog(state, `${evolution.fromName} evoluiu para ${evolution.toName}!`);
}

function currentEnvironmentId(state) {
  return state.area?.environmentId
    || ENVIRONMENTS[state.journey?.worldIndex || 0]?.id
    || "bosque";
}

function resolveEvolutions(state, pokemon) {
  const context = {
    environmentId: currentEnvironmentId(state),
    allowEnvironmentEvolution: true,
    random: Math.random
  };
  let evolution = evolvePokemonIfReady(pokemon, context);
  while (evolution) {
    registerEvolution(state, pokemon, evolution);
    evolution = evolvePokemonIfReady(pokemon, context);
  }
}

function grantPokemonExperience(state, pokemon, amount) {
  pokemon.xp += amount;
  addLog(state, `${pokemon.name} recebeu ${amount} XP.`);

  while (pokemon.level < 100 && pokemon.xp >= pokemon.xpToNext) {
    pokemon.xp -= pokemon.xpToNext;
    pokemon.level += 1;
    pokemon.xpToNext = experienceToNextLevel(pokemon.level);
    recalculatePokemonForLevel(pokemon, true);
    addLog(state, `${pokemon.name} subiu para o nível ${pokemon.level}!`);
    resolveEvolutions(state, pokemon);
  }

  if (pokemon.level >= 100) {
    pokemon.level = 100;
    pokemon.xp = 0;
    pokemon.xpToNext = experienceToNextLevel(100);
  }
}

export function grantTeamExperience(state, amount) {
  const participants = new Set(state.battleParticipants);
  state.team.forEach((pokemon) => {
    if (participants.has(pokemon.uid)) {
      grantPokemonExperience(state, pokemon, amount);
    } else if (pokemon.hp > 0) {
      grantPokemonExperience(state, pokemon, Math.max(1, Math.round(amount * 0.5)));
    }
  });
}
