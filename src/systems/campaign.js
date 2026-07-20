import { addLog, randomEncounterTarget } from "../core/game-state.js";
import { createAreaState, ENVIRONMENTS, TOTAL_ROUTES } from "../data/worlds.js";
import { deactivateAllMegaEvolutions } from "./mega.js";

const CAMPAIGN_MODES = ["normal", "hard"];

function cloneValue(value) {
  if (value == null) return value;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

export function createJourneyProgress() {
  return {
    worldIndex: 0,
    routeIndex: 0,
    completedRoutes: 0,
    completedWorlds: 0,
    complete: false
  };
}

export function createFreshCampaignSnapshot(started = false) {
  return {
    started,
    journey: createJourneyProgress(),
    area: createAreaState(0, 0),
    mode: "exploring",
    pendingRouteAdvance: false,
    captureOffer: null,
    approachProgress: 0,
    enemy: null,
    exploration: 0,
    nextEncounterAt: randomEncounterTarget(),
    battleCooldown: 0,
    recoveryCooldown: 0,
    megaEvolutionCooldown: 0,
    battleParticipants: [],
    revisit: null
  };
}

function snapshotFromState(state) {
  return {
    started: true,
    journey: cloneValue(state.journey),
    area: cloneValue(state.area),
    mode: state.mode || "exploring",
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
    revisit: cloneValue(state.revisit || null)
  };
}

function restoreSnapshot(state, snapshot) {
  const safe = snapshot || createFreshCampaignSnapshot(true);
  state.journey = cloneValue(safe.journey || createJourneyProgress());
  state.area = cloneValue(safe.area || createAreaState(state.journey.worldIndex, state.journey.routeIndex));
  state.mode = safe.mode || "exploring";
  state.pendingRouteAdvance = Boolean(safe.pendingRouteAdvance);
  state.captureOffer = cloneValue(safe.captureOffer || null);
  state.approachProgress = Math.max(0, Number(safe.approachProgress) || 0);
  state.enemy = cloneValue(safe.enemy || null);
  state.exploration = Math.max(0, Number(safe.exploration) || 0);
  state.nextEncounterAt = Math.max(1, Number(safe.nextEncounterAt) || randomEncounterTarget());
  state.battleCooldown = Math.max(0, Number(safe.battleCooldown) || 0);
  state.recoveryCooldown = Math.max(0, Number(safe.recoveryCooldown) || 0);
  state.megaEvolutionCooldown = Math.max(0, Number(safe.megaEvolutionCooldown) || 0);
  state.battleParticipants = cloneValue(safe.battleParticipants || []);
  state.revisit = cloneValue(safe.revisit || null);
}

function returnFromRevisit(state) {
  const revisit = state.revisit;
  if (!revisit?.active || !revisit.originJourney || !revisit.originArea) return;
  state.journey = cloneValue(revisit.originJourney);
  state.area = cloneValue(revisit.originArea);
  state.exploration = Math.max(0, Number(revisit.originRuntime?.exploration) || 0);
  state.nextEncounterAt = Math.max(1, Number(revisit.originRuntime?.nextEncounterAt) || randomEncounterTarget());
  state.revisit = null;
}

function prepareForCampaignSwitch(state) {
  returnFromRevisit(state);
  deactivateAllMegaEvolutions(state);
  if (state.hardEndgame) {
    state.hardEndgame.activeChallengeId = null;
    state.hardEndgame.challengeResult = null;
  }
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
}

export function ensureCampaignState(state) {
  const activeMode = CAMPAIGN_MODES.includes(state.campaignMode) ? state.campaignMode : "normal";
  state.campaignMode = activeMode;

  if (!state.campaigns || typeof state.campaigns !== "object") {
    state.campaigns = {
      normal: snapshotFromState(state),
      hard: createFreshCampaignSnapshot(false)
    };
  } else {
    if (!state.campaigns.normal) state.campaigns.normal = snapshotFromState(state);
    if (!state.campaigns.hard) state.campaigns.hard = createFreshCampaignSnapshot(false);
  }

  const normalComplete = Boolean(
    activeMode === "normal"
      ? state.journey?.complete
      : state.campaigns.normal?.journey?.complete
  );
  const hardComplete = Boolean(
    activeMode === "hard"
      ? state.journey?.complete
      : state.campaigns.hard?.journey?.complete
  );
  state.hardModeUnlocked = Boolean(state.hardModeUnlocked || normalComplete);
  state.hardUnlockCelebrationPending = Boolean(state.hardUnlockCelebrationPending);
  state.hardUnlockAcknowledged = Boolean(state.hardUnlockAcknowledged);
  if (state.hardEndgame && hardComplete) state.hardEndgame.postGameUnlocked = true;
  return state;
}

export function syncActiveCampaign(state) {
  ensureCampaignState(state);
  state.campaigns[state.campaignMode] = snapshotFromState(state);
  return state;
}

export function switchCampaign(state, targetMode) {
  const target = CAMPAIGN_MODES.includes(targetMode) ? targetMode : "normal";
  ensureCampaignState(state);
  if (target === "hard" && !state.hardModeUnlocked) return false;
  if (target === state.campaignMode) return true;

  prepareForCampaignSwitch(state);
  syncActiveCampaign(state);

  let targetSnapshot = state.campaigns[target];
  if (!targetSnapshot?.started) {
    targetSnapshot = createFreshCampaignSnapshot(true);
    state.campaigns[target] = targetSnapshot;
  }

  state.campaignMode = target;
  restoreSnapshot(state, targetSnapshot);
  prepareForCampaignSwitch(state);
  state.campaigns[target] = snapshotFromState(state);

  addLog(state, target === "hard"
    ? "Modo Hard iniciado. Os inimigos estão mais fortes e as recompensas foram ampliadas."
    : "Modo Normal retomado com o progresso original preservado.");
  return true;
}

export function completeActiveCampaign(state) {
  state.journey.complete = true;
  state.journey.completedRoutes = TOTAL_ROUTES;
  state.journey.completedWorlds = Math.max(state.journey.completedWorlds || 0, ENVIRONMENTS.length);
  state.mode = "exploring";

  if (state.campaignMode === "normal") {
    state.hardModeUnlocked = true;
    state.hardUnlockCelebrationPending = true;
    state.hardUnlockAcknowledged = false;
  } else if (state.hardEndgame) {
    state.hardEndgame.postGameUnlocked = true;
  }

  syncActiveCampaign(state);
}

export function acknowledgeHardUnlock(state) {
  state.hardUnlockCelebrationPending = false;
  state.hardUnlockAcknowledged = true;
  syncActiveCampaign(state);
}

export function getCampaignJourney(state, mode) {
  ensureCampaignState(state);
  if (mode === state.campaignMode) return state.journey;
  return state.campaigns?.[mode]?.journey || createJourneyProgress();
}

export function getCampaignProgress(state, mode) {
  const journey = getCampaignJourney(state, mode);
  return {
    completedRoutes: Math.max(0, Math.min(TOTAL_ROUTES, Number(journey.completedRoutes) || 0)),
    complete: Boolean(journey.complete),
    started: Boolean(state.campaigns?.[mode]?.started || mode === state.campaignMode)
  };
}
