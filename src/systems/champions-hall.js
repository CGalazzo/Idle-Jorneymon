import { addLog, randomEncounterTarget } from "../core/game-state.js";
import { createInitialChampionsHallState, normalizeChampionsHallState } from "../data/champions-hall-data.js";
import { deactivateAllMegaEvolutions } from "./mega.js";

function cloneValue(value) {
  if (value == null) return value;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function runtimeSnapshot(state) {
  return {
    campaignMode: state.campaignMode,
    mode: state.mode,
    pendingRouteAdvance: Boolean(state.pendingRouteAdvance),
    captureOffer: cloneValue(state.captureOffer),
    approachProgress: Math.max(0, Number(state.approachProgress) || 0),
    enemy: cloneValue(state.enemy),
    exploration: Math.max(0, Number(state.exploration) || 0),
    nextEncounterAt: Math.max(1, Number(state.nextEncounterAt) || randomEncounterTarget()),
    battleCooldown: Math.max(0, Number(state.battleCooldown) || 0),
    recoveryCooldown: Math.max(0, Number(state.recoveryCooldown) || 0),
    megaEvolutionCooldown: Math.max(0, Number(state.megaEvolutionCooldown) || 0),
    battleParticipants: cloneValue(state.battleParticipants || []),
    activeTeamIndex: Math.max(0, Number(state.activeTeamIndex) || 0)
  };
}

function restoreRuntime(state, runtime = {}) {
  state.campaignMode = runtime.campaignMode || "hard";
  state.mode = runtime.mode || "exploring";
  state.pendingRouteAdvance = Boolean(runtime.pendingRouteAdvance);
  state.captureOffer = cloneValue(runtime.captureOffer || null);
  state.approachProgress = Math.max(0, Number(runtime.approachProgress) || 0);
  state.enemy = cloneValue(runtime.enemy || null);
  state.exploration = Math.max(0, Number(runtime.exploration) || 0);
  state.nextEncounterAt = Math.max(1, Number(runtime.nextEncounterAt) || randomEncounterTarget());
  state.battleCooldown = Math.max(0, Number(runtime.battleCooldown) || 0);
  state.recoveryCooldown = Math.max(0, Number(runtime.recoveryCooldown) || 0);
  state.megaEvolutionCooldown = Math.max(0, Number(runtime.megaEvolutionCooldown) || 0);
  state.battleParticipants = cloneValue(runtime.battleParticipants || []);
  const lastTeamIndex = Math.max(0, (state.team?.length || 1) - 1);
  state.activeTeamIndex = Math.max(0, Math.min(lastTeamIndex, Number(runtime.activeTeamIndex) || 0));
}

export function unlockChampionsHall(state) {
  state.championsHall = normalizeChampionsHallState(state.championsHall, true);
  const firstUnlock = !state.championsHall.unlockAcknowledged;
  state.championsHall.unlocked = true;
  if (firstUnlock) state.championsHall.unlockCelebrationPending = true;
  addLog(state, "Salão dos Campeões desbloqueado! A recompensa máxima do Modo Hard está disponível.");
  return firstUnlock;
}

export function acknowledgeChampionsHallUnlock(state) {
  state.championsHall = normalizeChampionsHallState(state.championsHall, true);
  state.championsHall.unlockCelebrationPending = false;
  state.championsHall.unlockAcknowledged = true;
}

export function canStartChampionsHall(state) {
  return Boolean(
    state?.hasStarted
    && state.championsHall?.unlocked
    && !state.championsHall?.active
    && !state.safari?.active
    && state.mode === "exploring"
    && !state.pendingEvolutionChoices?.length
  );
}

export function startChampionsHall(state) {
  state.championsHall = normalizeChampionsHallState(state.championsHall, false);
  if (!canStartChampionsHall(state)) return false;

  acknowledgeChampionsHallUnlock(state);
  deactivateAllMegaEvolutions(state);
  state.championsHall = {
    ...state.championsHall,
    active: true,
    originRuntime: runtimeSnapshot(state),
    encounters: 0,
    captures: 0
  };
  state.campaignMode = "hard";
  state.mode = "exploring";
  state.pendingRouteAdvance = false;
  state.captureOffer = null;
  state.approachProgress = 0;
  state.enemy = null;
  state.exploration = 0;
  state.nextEncounterAt = randomEncounterTarget();
  state.battleCooldown = 0;
  state.recoveryCooldown = 0;
  state.megaEvolutionCooldown = 0;
  state.battleParticipants = [];
  state.team.forEach((pokemon) => { pokemon.hp = pokemon.maxHp; });
  state.activeTeamIndex = Math.max(0, state.team.findIndex((pokemon) => pokemon.hp > 0));
  addLog(state, "Você entrou no Salão dos Campeões. Todos os encontros são Lendários ou Míticos shiny de nível 100.");
  return true;
}

export function finishChampionsHall(state) {
  if (!state.championsHall?.active) return false;
  const hall = state.championsHall;
  deactivateAllMegaEvolutions(state);
  restoreRuntime(state, hall.originRuntime || {});
  state.team.forEach((pokemon) => { pokemon.hp = pokemon.maxHp; });
  state.activeTeamIndex = Math.max(0, state.team.findIndex((pokemon) => pokemon.hp > 0));
  state.championsHall = {
    ...createInitialChampionsHallState(),
    ...normalizeChampionsHallState(hall, true),
    active: false,
    originRuntime: null
  };
  addLog(state, `Você deixou o Salão dos Campeões. Encontros: ${hall.encounters}. Capturas: ${hall.captures}.`);
  return true;
}
