import { createStarter } from "../data/pokemon.js";

export const GAME_VERSION = "0.3.0";
export const SAVE_VERSION = 3;
export const MAX_TEAM_SIZE = 3;

export function createInitialState(starterId = 4, hasStarted = false) {
  const starter = createStarter(starterId);
  return {
    saveVersion: SAVE_VERSION,
    gameVersion: GAME_VERSION,
    lastSavedAt: Date.now(),
    hasStarted,
    mode: "exploring",
    area: { id: "route-1", name: "Rota 1", encounters: 0, victories: 0 },
    team: [starter],
    storage: [],
    activeTeamIndex: 0,
    battleParticipants: [],
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
    log: hasStarted ? [`A jornada começou! ${starter.name} está explorando a Rota 1.`] : []
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
