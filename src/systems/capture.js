import { addLog, MAX_TEAM_SIZE, randomEncounterTarget } from "../core/game-state.js";
import { createCapturedPokemon } from "../data/pokemon.js";
import { createAreaState, getNextRoutePosition, getRouteDefinition, TOTAL_ROUTES } from "../data/worlds.js";

export const CAPTURE_DECISION_MS = 5000;

export const CAPTURE_RATES = {
  common: 30,
  uncommon: 25,
  rare: 15,
  epic: 10,
  legendary: 5,
  mythical: 5
};

export function getCaptureChance(pokemon) {
  const baseChance = CAPTURE_RATES[pokemon.rarity] ?? CAPTURE_RATES.common;
  return pokemon.isShiny ? baseChance / 2 : baseChance;
}

export function registerSeen(state, pokemon) {
  const current = state.pokedex[pokemon.id] || { seen: 0, caught: 0, shinyCaught: 0 };
  state.pokedex[pokemon.id] = { ...current, seen: current.seen + 1 };
}

function resetEncounter(state) {
  state.enemy = null;
  state.captureOffer = null;
  state.battleParticipants = [];
  state.exploration = 0;
  state.nextEncounterAt = randomEncounterTarget();
}

function repeatRevisitedRoute(state, previousRoute) {
  state.pendingRouteAdvance = false;
  resetEncounter(state);
  state.team.forEach((pokemon) => { pokemon.hp = pokemon.maxHp; });
  state.activeTeamIndex = Math.max(0, state.team.findIndex((pokemon) => pokemon.hp > 0));
  state.area = createAreaState(previousRoute.worldIndex, previousRoute.routeIndex);
  state.mode = "exploring";
  addLog(state, `${previousRoute.environment.name} · Rota ${previousRoute.routeNumber} foi reiniciada para continuar a busca.`);
}

function advanceJourney(state) {
  const previousRoute = getRouteDefinition(state.journey.worldIndex, state.journey.routeIndex);

  if (state.revisit?.active) {
    repeatRevisitedRoute(state, previousRoute);
    return;
  }

  const nextPosition = getNextRoutePosition(state.journey.worldIndex, state.journey.routeIndex);
  const completedEnvironment = previousRoute.routeIndex === previousRoute.environment.routes.length - 1;

  state.journey.completedRoutes += 1;
  if (completedEnvironment) state.journey.completedWorlds += 1;
  state.pendingRouteAdvance = false;
  resetEncounter(state);

  state.team.forEach((pokemon) => { pokemon.hp = pokemon.maxHp; });
  state.activeTeamIndex = Math.max(0, state.team.findIndex((pokemon) => pokemon.hp > 0));

  if (!nextPosition) {
    state.journey.complete = true;
    state.mode = "exploring";
    addLog(state, `Jornada concluída! Você venceu as ${TOTAL_ROUTES} rotas e se tornou o grande campeão!`);
    return;
  }

  state.journey.worldIndex = nextPosition.worldIndex;
  state.journey.routeIndex = nextPosition.routeIndex;
  state.area = createAreaState(nextPosition.worldIndex, nextPosition.routeIndex);
  state.mode = "exploring";

  const nextRoute = getRouteDefinition(nextPosition.worldIndex, nextPosition.routeIndex);
  if (completedEnvironment) {
    addLog(state, `${nextRoute.environment.name} foi liberado! A equipe avançou para a Dificuldade ${nextRoute.worldIndex + 1}.`);
  } else {
    addLog(state, `Rota ${nextRoute.routeNumber} liberada em ${nextRoute.environment.name}.`);
  }
}

function returnToExploration(state) {
  if (state.pendingRouteAdvance) {
    advanceJourney(state);
    return;
  }
  state.mode = "exploring";
  resetEncounter(state);
}

export function updateCaptureDecision(state, now = Date.now()) {
  if (state.mode !== "capture" || !state.enemy) return false;
  if (!state.captureOffer) {
    state.captureOffer = { chance: getCaptureChance(state.enemy) };
  }
  if (!Number.isFinite(state.captureOffer.expiresAt)) {
    state.captureOffer.startedAt = now;
    state.captureOffer.expiresAt = now + CAPTURE_DECISION_MS;
    return false;
  }
  if (now < state.captureOffer.expiresAt) return false;

  addLog(state, `O tempo para capturar ${state.enemy.name} acabou. A jornada continua.`);
  returnToExploration(state);
  return true;
}

export function declineCapture(state) {
  if (state.mode !== "capture" || !state.enemy) return false;
  addLog(state, `Você decidiu não capturar ${state.enemy.name}.`);
  returnToExploration(state);
  return true;
}

export function attemptCapture(state, random = Math.random) {
  if (state.mode !== "capture" || !state.enemy) return false;
  const pokemon = state.enemy;
  const chance = getCaptureChance(pokemon);

  if (random() * 100 >= chance) {
    addLog(state, `${pokemon.name} escapou da captura.`);
    returnToExploration(state);
    return false;
  }

  const entry = state.pokedex[pokemon.id] || { seen: 1, caught: 0, shinyCaught: 0 };
  state.pokedex[pokemon.id] = {
    ...entry,
    caught: (entry.caught || 0) + 1,
    shinyCaught: (entry.shinyCaught || 0) + (pokemon.isShiny ? 1 : 0)
  };

  const capturedSpecies = state.collection[pokemon.id];
  state.collection[pokemon.id] = capturedSpecies
    ? { ...capturedSpecies, count: capturedSpecies.count + 1, shinyCount: (capturedSpecies.shinyCount || 0) + (pokemon.isShiny ? 1 : 0) }
    : { count: 1, shinyCount: pokemon.isShiny ? 1 : 0, firstCaughtAt: Date.now() };

  const capturedPokemon = createCapturedPokemon(pokemon);
  const shinyLabel = pokemon.isShiny ? " shiny" : "";
  if (state.team.length < MAX_TEAM_SIZE) {
    state.team.push(capturedPokemon);
    addLog(state, `${pokemon.name}${shinyLabel} foi capturado e entrou na equipe!`);
  } else {
    state.storage.push(capturedPokemon);
    addLog(state, `${pokemon.name}${shinyLabel} foi capturado e enviado ao depósito.`);
  }
  returnToExploration(state);
  return true;
}
