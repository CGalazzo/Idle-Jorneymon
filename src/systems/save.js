import { evolvePokemonIfReady, normalizePokemonInstance } from "../data/pokemon.js";
import { normalizeShopState } from "../data/shop-data.js";
import { createInitialState, GAME_VERSION, SAVE_VERSION } from "../core/game-state.js";
import { createAreaState, ENVIRONMENTS, getRouteDefinition, TOTAL_ROUTES } from "../data/worlds.js";
import { getMegaStone } from "../data/mega-data.js";
import { ensureCampaignState, syncActiveCampaign } from "./campaign.js";
import { restorePersistedMegaPokemon } from "./mega.js";
import { updateApproach, updateExploration } from "./exploration.js";
import { updateBattle, updateRecovery } from "./battle.js";
import { updateCaptureDecision } from "./capture.js";

const SAVE_KEY = "idle-jorneymon-save";
const CAPTURE_DECISION_MS = 5000;
const BACKGROUND_STEP_SECONDS = 0.25;
const BACKGROUND_TICK_MS = 1000;
const LEGACY_ENVIRONMENT_IDS = [
  "bosque",
  "floresta",
  "caverna",
  "praia",
  "montanhas",
  "caverna-gelo",
  "torre-fantasma",
  "vulcao",
  "planalto-indigo",
  "elite-4"
];

let activeState = null;
let backgroundWasHidden = typeof document !== "undefined" && document.hidden;
let backgroundLastWallTime = Date.now();
let backgroundSimulationTime = backgroundLastWallTime;
let pendingBackgroundSeconds = 0;
let lastBackgroundPersistAt = 0;

function resetBackgroundClock(now = Date.now()) {
  backgroundLastWallTime = now;
  backgroundSimulationTime = now;
  pendingBackgroundSeconds = 0;
}

function activateState(state) {
  activeState = state;
  resetBackgroundClock();
  return state;
}

function persistState(state) {
  if (!state?.hasStarted) return;
  syncActiveCampaign(state);
  state.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function simulateBackgroundStep(state, deltaSeconds, simulatedNow) {
  if (!state?.hasStarted || state.journey?.complete || state.pendingEvolutionChoices?.length) return;

  if (state.mode === "exploring") updateExploration(state, deltaSeconds);
  if (state.mode === "approach") updateApproach(state, deltaSeconds);
  if (state.mode === "battle") updateBattle(state, deltaSeconds, Math.random, simulatedNow);
  if (state.mode === "recovering") updateRecovery(state, deltaSeconds);
  if (state.mode === "capture") updateCaptureDecision(state, simulatedNow);
}

function persistBackgroundState(force = false) {
  const now = Date.now();
  if (!force && now - lastBackgroundPersistAt < 5000) return;
  persistState(activeState);
  lastBackgroundPersistAt = now;
}

function processPendingBackgroundTime() {
  if (!activeState?.hasStarted || pendingBackgroundSeconds <= 0) return;

  while (pendingBackgroundSeconds > 0) {
    const step = Math.min(BACKGROUND_STEP_SECONDS, pendingBackgroundSeconds);
    backgroundSimulationTime += step * 1000;
    simulateBackgroundStep(activeState, step, backgroundSimulationTime);
    pendingBackgroundSeconds -= step;

    if (activeState.pendingEvolutionChoices?.length || activeState.hardUnlockCelebrationPending) {
      pendingBackgroundSeconds = 0;
      break;
    }
  }

  pendingBackgroundSeconds = 0;
  persistBackgroundState();
}

function collectBackgroundElapsed(now = Date.now()) {
  const elapsedSeconds = Math.max(0, (now - backgroundLastWallTime) / 1000);
  backgroundLastWallTime = now;
  pendingBackgroundSeconds += elapsedSeconds;
  processPendingBackgroundTime();
}

if (typeof document !== "undefined" && typeof window !== "undefined") {
  window.setInterval(() => {
    const now = Date.now();
    if (document.hidden && activeState?.hasStarted) {
      collectBackgroundElapsed(now);
      return;
    }
    resetBackgroundClock(now);
  }, BACKGROUND_TICK_MS);

  document.addEventListener("visibilitychange", () => {
    const now = Date.now();
    if (document.hidden) {
      backgroundWasHidden = true;
      resetBackgroundClock(now);
      return;
    }

    if (backgroundWasHidden && activeState?.hasStarted) {
      collectBackgroundElapsed(now);
      backgroundWasHidden = false;
      resetBackgroundClock(now);
      persistBackgroundState(true);
      return;
    }

    backgroundWasHidden = false;
    resetBackgroundClock(now);
  });
}

export function hasSavedGame() {
  return Boolean(localStorage.getItem(SAVE_KEY));
}

function evolutionContext(environmentId) {
  return {
    environmentId,
    allowEnvironmentEvolution: false
  };
}

function normalizePokemon(pokemon, refreshExperienceCurve = false, applyPendingEvolutions = true, environmentId = "bosque") {
  const restored = restorePersistedMegaPokemon(pokemon);
  const normalized = normalizePokemonInstance(restored, { refreshExperienceCurve });
  if (applyPendingEvolutions) {
    const context = evolutionContext(environmentId);
    while (evolvePokemonIfReady(normalized, context)) {
      // Aplica evoluções pendentes por nível. Eevee depende de uma escolha explícita do jogador.
    }
  }
  return normalized;
}

function resolveEnvironmentId(saved = {}) {
  const directId = String(saved.area?.environmentId || "");
  if (ENVIRONMENTS.some((environment) => environment.id === directId)) return directId;

  const legacyIndex = Math.max(0, Math.min(LEGACY_ENVIRONMENT_IDS.length - 1, Number(saved.journey?.worldIndex) || 0));
  return LEGACY_ENVIRONMENT_IDS[legacyIndex] || ENVIRONMENTS[0].id;
}

function normalizeJourney(savedJourney = {}, environmentId = "", legacyLayout = false) {
  const matchedIndex = ENVIRONMENTS.findIndex((environment) => environment.id === environmentId);
  const worldIndex = matchedIndex >= 0
    ? matchedIndex
    : Math.max(0, Math.min(ENVIRONMENTS.length - 1, Number(savedJourney.worldIndex) || 0));
  const routeIndex = Math.max(0, Math.min(9, Number(savedJourney.routeIndex) || 0));
  const complete = Boolean(savedJourney.complete);

  if (legacyLayout) {
    return {
      worldIndex,
      routeIndex,
      completedRoutes: complete ? TOTAL_ROUTES : worldIndex * 10 + routeIndex,
      completedWorlds: complete ? ENVIRONMENTS.length : worldIndex,
      complete
    };
  }

  return {
    worldIndex,
    routeIndex,
    completedRoutes: Math.max(0, Math.min(TOTAL_ROUTES, Number(savedJourney.completedRoutes) || 0)),
    completedWorlds: Math.max(0, Math.min(ENVIRONMENTS.length, Number(savedJourney.completedWorlds) || 0)),
    complete
  };
}

function normalizeArea(savedArea, journey) {
  const canonical = createAreaState(journey.worldIndex, journey.routeIndex);
  if (!savedArea?.environmentId) return canonical;
  const route = getRouteDefinition(journey.worldIndex, journey.routeIndex);
  return {
    ...canonical,
    encounters: Math.max(0, Number(savedArea.encounters) || 0),
    victories: Math.max(0, Number(savedArea.victories) || 0),
    regularVictories: Math.max(0, Math.min(route.requiredVictories, Number(savedArea.regularVictories) || 0)),
    bossDefeated: Boolean(savedArea.bossDefeated)
  };
}

function registerRosterEntries(pokedex, collection, roster) {
  roster.forEach((pokemon) => {
    const entry = pokedex[pokemon.id] || { seen: 0, caught: 0, shinyCaught: 0 };
    pokedex[pokemon.id] = {
      ...entry,
      seen: Math.max(1, Number(entry.seen) || 0),
      caught: Math.max(1, Number(entry.caught) || 0),
      shinyCaught: Math.max(pokemon.isShiny ? 1 : 0, Number(entry.shinyCaught) || 0)
    };

    const owned = collection[pokemon.id];
    collection[pokemon.id] = owned
      ? {
          ...owned,
          count: Math.max(1, Number(owned.count) || 0),
          shinyCount: Math.max(pokemon.isShiny ? 1 : 0, Number(owned.shinyCount) || 0)
        }
      : {
          count: 1,
          shinyCount: pokemon.isShiny ? 1 : 0,
          firstCaughtAt: Date.now()
        };
  });
}

function normalizeMegaEquipment(shop, team) {
  const stone = getMegaStone(shop.equippedMegaStoneId);
  const pokemon = team.find((member) => member.uid === shop.equippedMegaPokemonUid);
  const valid = stone
    && pokemon
    && shop.ownedMegaStones.includes(stone.id)
    && Number(pokemon.id) === stone.baseSpeciesId;

  if (!valid) {
    shop.equippedMegaStoneId = null;
    shop.equippedMegaPokemonUid = null;
  }
  return shop;
}

function rebaseCaptureOffer(saved = {}) {
  if (saved.mode !== "capture" || !saved.captureOffer) return null;

  const savedAt = Number(saved.lastSavedAt) || Date.now();
  const originalExpiry = Number(saved.captureOffer.expiresAt);
  const remaining = Number.isFinite(originalExpiry)
    ? Math.max(0, Math.min(CAPTURE_DECISION_MS, originalExpiry - savedAt))
    : CAPTURE_DECISION_MS;
  const now = Date.now();

  return {
    ...saved.captureOffer,
    startedAt: now - (CAPTURE_DECISION_MS - remaining),
    expiresAt: now + remaining
  };
}

function migrateSave(saved) {
  const legacyPlayer = saved.player || saved.team?.[0];
  const starterId = legacyPlayer?.id || 4;
  const base = createInitialState(starterId, true);
  const environmentId = resolveEnvironmentId(saved);
  const legacyLayout = (Number(saved.saveVersion) || 0) < 8;
  const journey = normalizeJourney(saved.journey, environmentId, legacyLayout);
  const currentEnvironmentId = ENVIRONMENTS[journey.worldIndex]?.id || "bosque";
  const area = normalizeArea(saved.area, journey);
  const migratedTeam = Array.isArray(saved.team) && saved.team.length
    ? saved.team.map((pokemon) => normalizePokemon(pokemon, true, true, currentEnvironmentId))
    : [normalizePokemon({ ...base.team[0], ...legacyPlayer }, true, true, currentEnvironmentId)];
  const migratedStorage = Array.isArray(saved.storage)
    ? saved.storage.map((pokemon) => normalizePokemon(pokemon, true, true, currentEnvironmentId))
    : [];
  const pokedex = { ...(saved.pokedex || { [starterId]: { seen: 1, caught: 1 } }) };
  const collection = { ...(saved.collection || { [starterId]: { count: 1, firstCaughtAt: saved.lastSavedAt || Date.now() } }) };
  const shop = normalizeMegaEquipment(normalizeShopState(saved.shop), migratedTeam);
  registerRosterEntries(pokedex, collection, [...migratedTeam, ...migratedStorage]);

  const migrated = {
    ...base,
    ...saved,
    saveVersion: SAVE_VERSION,
    gameVersion: GAME_VERSION,
    hasStarted: true,
    mode: "exploring",
    campaignMode: "normal",
    campaigns: null,
    hardModeUnlocked: Boolean(saved.hardModeUnlocked || journey.complete),
    hardUnlockCelebrationPending: Boolean(saved.hardUnlockCelebrationPending || (journey.complete && !saved.hardUnlockAcknowledged)),
    hardUnlockAcknowledged: Boolean(saved.hardUnlockAcknowledged),
    journey,
    area,
    totals: {
      encounters: Math.max(0, Number(saved.totals?.encounters) || Number(saved.area?.encounters) || 0),
      victories: Math.max(0, Number(saved.totals?.victories) || Number(saved.area?.victories) || 0)
    },
    pendingRouteAdvance: false,
    pendingEvolutionChoices: legacyLayout ? [] : (Array.isArray(saved.pendingEvolutionChoices) ? saved.pendingEvolutionChoices : []),
    shop,
    team: migratedTeam,
    storage: migratedStorage,
    activeTeamIndex: Math.min(saved.activeTeamIndex || 0, migratedTeam.length - 1),
    battleParticipants: [],
    captureOffer: null,
    approachProgress: 0,
    pokedex,
    collection,
    enemy: null,
    exploration: 0
  };
  return ensureCampaignState(migrated);
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return activateState(ensureCampaignState(createInitialState()));

    const saved = JSON.parse(raw);
    const savedVersion = Number(saved.saveVersion) || 0;
    if (savedVersion < SAVE_VERSION) return activateState(migrateSave(saved));
    if (savedVersion !== SAVE_VERSION || !Array.isArray(saved.team) || !saved.team.length) {
      return activateState(ensureCampaignState(createInitialState()));
    }

    const base = createInitialState(saved.team[0].id, true);
    const environmentId = resolveEnvironmentId(saved);
    const journey = normalizeJourney(saved.journey, environmentId, false);
    const currentEnvironmentId = ENVIRONMENTS[journey.worldIndex]?.id || "bosque";
    const area = normalizeArea(saved.area, journey);
    const encounterModes = ["approach", "battle", "capture"];
    const validEncounterMode = encounterModes.includes(saved.mode) && saved.enemy;
    const allowedModes = ["exploring", "recovering"];
    const mode = journey.complete
      ? "exploring"
      : encounterModes.includes(saved.mode)
        ? (validEncounterMode ? saved.mode : "exploring")
        : (allowedModes.includes(saved.mode) ? saved.mode : "exploring");
    const team = saved.team.map((pokemon) => normalizePokemon(pokemon, false, true, currentEnvironmentId));
    const storage = (saved.storage || []).map((pokemon) => normalizePokemon(pokemon, false, true, currentEnvironmentId));
    const pokedex = { ...(saved.pokedex || base.pokedex) };
    const collection = { ...(saved.collection || base.collection) };
    const shop = normalizeMegaEquipment(normalizeShopState(saved.shop), team);
    registerRosterEntries(pokedex, collection, [...team, ...storage]);

    const loaded = {
      ...base,
      ...saved,
      saveVersion: SAVE_VERSION,
      gameVersion: GAME_VERSION,
      hasStarted: true,
      mode,
      journey,
      area,
      totals: {
        encounters: Math.max(0, Number(saved.totals?.encounters) || area.encounters),
        victories: Math.max(0, Number(saved.totals?.victories) || area.victories)
      },
      pendingRouteAdvance: Boolean(saved.pendingRouteAdvance),
      pendingEvolutionChoices: Array.isArray(saved.pendingEvolutionChoices) ? saved.pendingEvolutionChoices : [],
      shop,
      team,
      storage,
      activeTeamIndex: Math.min(saved.activeTeamIndex || 0, team.length - 1),
      battleParticipants: saved.battleParticipants || [],
      captureOffer: rebaseCaptureOffer(saved),
      pokedex,
      collection,
      approachProgress: saved.approachProgress || 0,
      enemy: validEncounterMode ? normalizePokemon(saved.enemy, false, false, currentEnvironmentId) : null
    };
    return activateState(ensureCampaignState(loaded));
  } catch {
    return activateState(ensureCampaignState(createInitialState()));
  }
}

export function saveGame(state) {
  activeState = state;
  persistState(state);
}

export function resetGame() {
  activeState = null;
  resetBackgroundClock();
  localStorage.removeItem(SAVE_KEY);
}
