import { createStarter } from "../data/pokemon.js";
import { createAreaState } from "../data/worlds.js";

export const GAME_VERSION = "0.4.0";
export const SAVE_VERSION = 5;
export const MAX_TEAM_SIZE = 3;

export function createInitialState(starterId = 4, hasStarted = false) {
  const starter = createStarter(starterId);
  return {
    saveVersion: SAVE_VERSION,
    gameVersion: GAME_VERSION,
    lastSavedAt: Date.now(),
    hasStarted,
    mode: "exploring",
    journey: {
      worldIndex: 0,
      routeIndex: 0,
      completedRoutes: 0,
      completedWorlds: 0,
      complete: false
    },
    area: createAreaState(0, 0),
    totals: { encounters: 0, victories: 0 },
    pendingRouteAdvance: false,
    team: [starter],
    storage: [],
    activeTeamIndex: 0,
    battleParticipants: [],
    captureOffer: null,
    approachProgress: 0,
    enemy: null,
    exploration: 0,
    nextEncounterAt: randomEncounterTarget(),
    battleCooldown: 0,
    recoveryCooldown: 0,
    totalSteps: 0,
    pokedex: {
      [starter.id]: { seen: 1, caught: 1 }
    },
    collection: {
      [starter.id]: { count: 1, firstCaughtAt: Date.now() }
    },
    log: hasStarted ? [`A jornada começou! ${starter.name} entrou no Bosque — Rota 1.`] : []
  };
}

export function startNewJourney(starterId) {
  return createInitialState(starterId, true);
}

export function getActivePokemon(state) {
  return state.team[state.activeTeamIndex] || state.team[0];
}

export function randomEncounterTarget(random = Math.random) {
  return 75 + Math.floor(random() * 26);
}

export function addLog(state, message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 7);
}
