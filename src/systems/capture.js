import { addLog, MAX_TEAM_SIZE, randomEncounterTarget } from "../core/game-state.js";
import { createCapturedPokemon } from "../data/pokemon.js";
import { BALL_DEFINITIONS } from "../data/shop-data.js";
import { createAreaState, getNextRoutePosition, getRouteDefinition, TOTAL_ROUTES } from "../data/worlds.js";
import { completeActiveCampaign } from "./campaign.js";
import { grantHardRouteEmblems } from "./hard-endgame.js";
import { consumeBall, getBallDefinition, isBallUnlocked } from "./shop.js";

export const CAPTURE_DECISION_MS = 5000;

export const CAPTURE_RATES = {
  common: 30,
  uncommon: 25,
  rare: 15,
  epic: 10,
  legendary: 5,
  mythical: 5
};

export function getCaptureChance(pokemon, ballId = null) {
  const baseChance = CAPTURE_RATES[pokemon.rarity] ?? CAPTURE_RATES.common;
  const shinyAdjusted = pokemon.isShiny ? baseChance / 2 : baseChance;
  const ball = getBallDefinition(ballId);
  if (ball?.guaranteed) return 100;
  return Math.min(95, shinyAdjusted + (Number(ball?.bonus) || 0));
}

export function getCaptureBallOptions(state, pokemon) {
  return BALL_DEFINITIONS
    .filter((ball) => ball.available !== false)
    .map((ball) => ({
      ...ball,
      stock: Math.max(0, Number(state.shop?.balls?.[ball.id]) || 0),
      unlocked: isBallUnlocked(state, ball.id),
      chance: getCaptureChance(pokemon, ball.id)
    }));
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
  grantHardRouteEmblems(state, previousRoute, {
    completedEnvironment,
    campaignComplete: !nextPosition
  });

  state.journey.completedRoutes += 1;
  if (completedEnvironment) state.journey.completedWorlds += 1;
  state.pendingRouteAdvance = false;
  resetEncounter(state);

  state.team.forEach((pokemon) => { pokemon.hp = pokemon.maxHp; });
  state.activeTeamIndex = Math.max(0, state.team.findIndex((pokemon) => pokemon.hp > 0));

  if (!nextPosition) {
    completeActiveCampaign(state);
    if (state.campaignMode === "normal") {
      addLog(state, `Jornada Normal concluída! Você venceu as ${TOTAL_ROUTES} rotas e desbloqueou o Modo Hard.`);
    } else {
      addLog(state, `Modo Hard concluído! Você venceu novamente as ${TOTAL_ROUTES} rotas e liberou os Desafios Hard.`);
    }
    return;
  }

  state.journey.worldIndex = nextPosition.worldIndex;
  state.journey.routeIndex = nextPosition.routeIndex;
  state.area = createAreaState(nextPosition.worldIndex, nextPosition.routeIndex);
  state.mode = "exploring";

  const nextRoute = getRouteDefinition(nextPosition.worldIndex, nextPosition.routeIndex);
  if (completedEnvironment) {
    addLog(state, `${nextRoute.environment.name} foi liberado! A equipe avançou para a Dificuldade ${nextRoute.worldIndex + 1}${state.campaignMode === "hard" ? " no Modo Hard" : ""}.`);
  } else {
    addLog(state, `Rota ${nextRoute.routeNumber} liberada em ${nextRoute.environment.name}${state.campaignMode === "hard" ? " · Hard" : ""}.`);
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

export function attemptCapture(state, ballId = null, random = Math.random) {
  if (state.mode !== "capture" || !state.enemy) return false;
  const pokemon = state.enemy;
  const ball = getBallDefinition(ballId);

  if (ballId) {
    if (!ball || ball.available === false || !isBallUnlocked(state, ball.id) || !consumeBall(state, ball.id)) {
      addLog(state, "Essa Poké Bola não está disponível no inventário.");
      return false;
    }
  }

  const chance = getCaptureChance(pokemon, ballId);
  const ballCopy = ball ? ` usando ${ball.name}` : "";
  if (random() * 100 >= chance) {
    addLog(state, `${pokemon.name} escapou da captura${ballCopy}.`);
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
  const hardLabel = capturedPokemon.capturedInHard ? " do Modo Hard" : "";
  if (state.team.length < MAX_TEAM_SIZE) {
    state.team.push(capturedPokemon);
    addLog(state, `${pokemon.name}${shinyLabel}${hardLabel} foi capturado${ballCopy} e entrou na equipe!`);
  } else {
    state.storage.push(capturedPokemon);
    addLog(state, `${pokemon.name}${shinyLabel}${hardLabel} foi capturado${ballCopy} e enviado ao depósito.`);
  }
  returnToExploration(state);
  return true;
}
