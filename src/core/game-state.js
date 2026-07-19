import { PLAYER_TEMPLATE } from "../data/pokemon.js";

export const GAME_VERSION = "0.1.0";
export const SAVE_VERSION = 1;

export function createInitialState() {
  return {
    saveVersion: SAVE_VERSION,
    gameVersion: GAME_VERSION,
    lastSavedAt: Date.now(),
    mode: "exploring",
    area: { id: "route-1", name: "Rota 1", encounters: 0, victories: 0 },
    player: { ...PLAYER_TEMPLATE, hp: PLAYER_TEMPLATE.maxHp },
    enemy: null,
    exploration: 0,
    nextEncounterAt: randomEncounterTarget(),
    battleCooldown: 0,
    recoveryCooldown: 0,
    totalSteps: 0,
    log: ["A jornada começou! Charmander está explorando a Rota 1."]
  };
}

export function randomEncounterTarget(random = Math.random) {
  return 75 + Math.floor(random() * 26);
}

export function addLog(state, message) {
  state.log.unshift(message);
  state.log = state.log.slice(0, 7);
}
