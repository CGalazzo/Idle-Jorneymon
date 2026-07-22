import { addLog, randomEncounterTarget } from "../core/game-state.js";
import {
  SAFARI_BALLS_PER_SESSION,
  SAFARI_DURATION_MS,
  SAFARI_ENTRY_PRICE,
  createInitialSafariState,
  getSafariHabitat
} from "../data/safari-data.js";
import { deactivateAllMegaEvolutions } from "./mega.js";

function cloneValue(value) {
  if (value == null) return value;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function runtimeSnapshot(state) {
  return {
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

function safariElapsedMs(safari, reason, now) {
  const startedAt = Number(safari?.startedAt);
  const expiresAt = Number(safari?.expiresAt);
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return reason === "time" ? SAFARI_DURATION_MS : 0;
  }

  const effectiveEnd = reason === "time" && Number.isFinite(expiresAt)
    ? Math.min(now, expiresAt)
    : now;
  return Math.max(0, Math.min(SAFARI_DURATION_MS, effectiveEnd - startedAt));
}

export function canStartSafari(state) {
  return Boolean(
    state?.hasStarted
    && !state.safari?.active
    && state.mode === "exploring"
    && !state.pendingEvolutionChoices?.length
    && Number(state.shop?.coins) >= SAFARI_ENTRY_PRICE
  );
}

export function startSafariSession(state, habitatId, now = Date.now()) {
  const habitat = getSafariHabitat(habitatId);
  if (!habitat || !canStartSafari(state)) return false;

  deactivateAllMegaEvolutions(state);
  state.shop.coins = Math.max(0, Number(state.shop.coins) - SAFARI_ENTRY_PRICE);
  state.safari = {
    ...createInitialSafariState(),
    active: true,
    habitatId: habitat.id,
    startedAt: now,
    expiresAt: now + SAFARI_DURATION_MS,
    ballsRemaining: SAFARI_BALLS_PER_SESSION,
    originRuntime: runtimeSnapshot(state)
  };

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

  addLog(state, `Zona Safari iniciada em ${habitat.name}. Você recebeu ${SAFARI_BALLS_PER_SESSION} Safari Balls e tem 15 minutos.`);
  return true;
}

export function finishSafariSession(state, reason = "exit", now = Date.now()) {
  if (!state.safari?.active) return false;
  const safari = state.safari;
  const habitat = getSafariHabitat(safari.habitatId);
  const elapsedMs = safariElapsedMs(safari, reason, now);
  const result = {
    reason,
    habitatName: habitat?.name || "Zona Safari",
    encounters: Math.max(0, Number(safari.encounters) || 0),
    captures: Math.max(0, Number(safari.captures) || 0),
    ballsUsed: Math.max(0, SAFARI_BALLS_PER_SESSION - Math.max(0, Number(safari.ballsRemaining) || 0)),
    elapsedMs,
    startedAt: Number(safari.startedAt) || Math.max(0, now - elapsedMs),
    endedAt: now
  };

  deactivateAllMegaEvolutions(state);
  restoreRuntime(state, safari.originRuntime || {});
  state.team.forEach((pokemon) => { pokemon.hp = pokemon.maxHp; });
  state.activeTeamIndex = Math.max(0, state.team.findIndex((pokemon) => pokemon.hp > 0));
  state.safari = {
    ...createInitialSafariState(),
    lastResult: result
  };

  const reasonCopy = reason === "balls"
    ? "As 30 Safari Balls acabaram."
    : reason === "time"
      ? "O tempo de 15 minutos acabou."
      : "Você deixou a Zona Safari.";
  addLog(state, `${reasonCopy} Capturas realizadas: ${result.captures}.`);
  return true;
}

export function updateSafariSession(state, now = Date.now()) {
  if (!state.safari?.active) return false;

  const expiresAt = Number(state.safari.expiresAt);
  if (!Number.isFinite(expiresAt) || expiresAt <= 0 || now >= expiresAt) {
    return finishSafariSession(state, "time", now);
  }

  const ballsRemaining = Number(state.safari.ballsRemaining);
  if (!Number.isFinite(ballsRemaining) || ballsRemaining <= 0) {
    return finishSafariSession(state, "balls", now);
  }
  return false;
}

export function consumeSafariBall(state) {
  const ballsRemaining = Number(state.safari?.ballsRemaining);
  if (!state.safari?.active || !Number.isFinite(ballsRemaining) || ballsRemaining <= 0) return false;
  state.safari.ballsRemaining = ballsRemaining - 1;
  return true;
}

export function clearSafariResult(state) {
  if (!state.safari) state.safari = createInitialSafariState();
  state.safari.lastResult = null;
}

export function safariRemainingMs(state, now = Date.now()) {
  if (!state.safari?.active) return 0;
  const expiresAt = Number(state.safari.expiresAt);
  return Number.isFinite(expiresAt) ? Math.max(0, expiresAt - now) : 0;
}
