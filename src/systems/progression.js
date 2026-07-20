import { addLog } from "../core/game-state.js";
import { getEeveeEvolutionTargets } from "../data/evolutions.js";
import {
  POKEDEX_SPECIES,
  evolvePokemonIfReady,
  experienceToNextLevel,
  recalculatePokemonForLevel
} from "../data/pokemon.js";
import { ENVIRONMENTS } from "../data/worlds.js";
import { CAPTURE_DECISION_MS } from "./capture.js";

const EEVEE_ID = 133;

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

function findOwnedPokemon(state, uid) {
  return [...(state.team || []), ...(state.storage || [])].find((pokemon) => pokemon.uid === uid) || null;
}

function normalizeDeclinedTargets(pokemon) {
  const declined = Array.isArray(pokemon.declinedEeveeEvolutions)
    ? pokemon.declinedEeveeEvolutions.map(Number).filter(Number.isFinite)
    : [];
  pokemon.declinedEeveeEvolutions = [...new Set(declined)];
  return pokemon.declinedEeveeEvolutions;
}

function chooseEeveeTarget(pokemon, environmentId, random = Math.random) {
  const declined = new Set(normalizeDeclinedTargets(pokemon));
  const available = getEeveeEvolutionTargets(environmentId).filter((targetId) => !declined.has(targetId));
  if (!available.length) return null;
  if (available.length === 1) return available[0];
  return available[Math.floor(random() * available.length)];
}

function queueEeveeEvolutionChoice(state, pokemon, random = Math.random) {
  if (pokemon.id !== EEVEE_ID || pokemon.level < 20) return false;
  const queue = Array.isArray(state.pendingEvolutionChoices) ? state.pendingEvolutionChoices : [];
  state.pendingEvolutionChoices = queue;
  if (queue.some((choice) => choice.pokemonUid === pokemon.uid)) return true;

  const environmentId = currentEnvironmentId(state);
  const targetId = chooseEeveeTarget(pokemon, environmentId, random);
  if (!targetId) return false;

  const target = POKEDEX_SPECIES.find((entry) => entry.id === targetId);
  const environment = ENVIRONMENTS.find((entry) => entry.id === environmentId);
  if (!target) return false;

  queue.push({
    pokemonUid: pokemon.uid,
    pokemonName: pokemon.name,
    targetId,
    targetName: target.name,
    environmentId,
    environmentName: environment?.name || state.area?.environment || "este ambiente",
    offeredAtLevel: pokemon.level
  });
  addLog(state, `${pokemon.name} pode evoluir para ${target.name}. A jornada aguarda sua decisão.`);
  return true;
}

function resolveEvolutions(state, pokemon) {
  if (pokemon.id === EEVEE_ID) return;
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

function resumeAfterEvolutionChoices(state) {
  if (state.pendingEvolutionChoices?.length) return;
  if (state.mode === "capture" && state.captureOffer) {
    const now = Date.now();
    state.captureOffer.startedAt = now;
    state.captureOffer.expiresAt = now + CAPTURE_DECISION_MS;
  }
}

function grantPokemonExperience(state, pokemon, amount) {
  pokemon.xp += amount;
  addLog(state, `${pokemon.name} recebeu ${amount} XP.`);

  while (pokemon.level < 100 && pokemon.xp >= pokemon.xpToNext) {
    pokemon.xp -= pokemon.xpToNext;
    pokemon.level += 1;
    pokemon.xpToNext = experienceToNextLevel(pokemon.level);
    recalculatePokemonForLevel(pokemon, false);
    addLog(state, `${pokemon.name} subiu para o nível ${pokemon.level}!`);

    if (queueEeveeEvolutionChoice(state, pokemon)) break;
    resolveEvolutions(state, pokemon);
  }

  if (pokemon.level >= 100) {
    pokemon.level = 100;
    pokemon.xp = 0;
    pokemon.xpToNext = experienceToNextLevel(100);
  }
}

export function acceptEeveeEvolution(state) {
  const choice = state.pendingEvolutionChoices?.[0];
  if (!choice) return false;
  const pokemon = findOwnedPokemon(state, choice.pokemonUid);
  state.pendingEvolutionChoices.shift();

  if (!pokemon || pokemon.id !== EEVEE_ID) {
    resumeAfterEvolutionChoices(state);
    return false;
  }

  const evolution = evolvePokemonIfReady(pokemon, {
    environmentId: choice.environmentId,
    forceEeveeEvolutionTarget: choice.targetId,
    pokemon
  });
  if (!evolution) {
    resumeAfterEvolutionChoices(state);
    return false;
  }

  registerEvolution(state, pokemon, evolution);
  resumeAfterEvolutionChoices(state);
  return true;
}

export function declineEeveeEvolution(state) {
  const choice = state.pendingEvolutionChoices?.[0];
  if (!choice) return false;
  const pokemon = findOwnedPokemon(state, choice.pokemonUid);
  state.pendingEvolutionChoices.shift();

  if (pokemon && pokemon.id === EEVEE_ID) {
    const declined = normalizeDeclinedTargets(pokemon);
    pokemon.declinedEeveeEvolutions = [...new Set([...declined, Number(choice.targetId)])];
    addLog(state, `${pokemon.name} não evoluiu para ${choice.targetName}. Essa forma não será oferecida novamente.`);
  }

  resumeAfterEvolutionChoices(state);
  return true;
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
