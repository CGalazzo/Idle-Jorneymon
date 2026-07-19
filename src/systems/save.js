import { createInstanceId, experienceToNextLevel } from "../data/pokemon.js";
import { createInitialState, GAME_VERSION, SAVE_VERSION } from "../core/game-state.js";
import { createAreaState, ENVIRONMENTS, getRouteDefinition } from "../data/worlds.js";

const SAVE_KEY = "idle-jorneymon-save";

export function hasSavedGame() {
  return Boolean(localStorage.getItem(SAVE_KEY));
}

function normalizePokemon(pokemon, refreshExperienceCurve = false) {
  const level = Math.max(1, Number(pokemon.level) || 1);
  const maxHp = Math.max(1, Number(pokemon.maxHp) || 1);
  return {
    ...pokemon,
    level,
    maxHp,
    uid: pokemon.uid || createInstanceId(pokemon.id),
    hp: Math.max(0, Math.min(pokemon.hp ?? maxHp, maxHp)),
    xp: Math.max(0, Number(pokemon.xp) || 0),
    xpToNext: refreshExperienceCurve
      ? experienceToNextLevel(level)
      : Math.max(1, Number(pokemon.xpToNext) || experienceToNextLevel(level))
  };
}

function normalizeJourney(savedJourney = {}) {
  const worldIndex = Math.max(0, Math.min(ENVIRONMENTS.length - 1, Number(savedJourney.worldIndex) || 0));
  const routeIndex = Math.max(0, Math.min(9, Number(savedJourney.routeIndex) || 0));
  return {
    worldIndex,
    routeIndex,
    completedRoutes: Math.max(0, Number(savedJourney.completedRoutes) || 0),
    completedWorlds: Math.max(0, Number(savedJourney.completedWorlds) || 0),
    complete: Boolean(savedJourney.complete)
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

function migrateLegacySave(saved) {
  const legacyPlayer = saved.player || saved.team?.[0];
  const starterId = legacyPlayer?.id || 4;
  const base = createInitialState(starterId, true);
  const migratedTeam = Array.isArray(saved.team) && saved.team.length
    ? saved.team.map((pokemon) => normalizePokemon(pokemon, true))
    : [normalizePokemon({ ...base.team[0], ...legacyPlayer }, true)];
  const migratedStorage = Array.isArray(saved.storage)
    ? saved.storage.map((pokemon) => normalizePokemon(pokemon, true))
    : [];

  return {
    ...base,
    ...saved,
    saveVersion: SAVE_VERSION,
    gameVersion: GAME_VERSION,
    hasStarted: true,
    mode: "exploring",
    journey: base.journey,
    area: base.area,
    totals: {
      encounters: Math.max(0, Number(saved.area?.encounters) || 0),
      victories: Math.max(0, Number(saved.area?.victories) || 0)
    },
    pendingRouteAdvance: false,
    team: migratedTeam,
    storage: migratedStorage,
    activeTeamIndex: Math.min(saved.activeTeamIndex || 0, migratedTeam.length - 1),
    battleParticipants: [],
    captureOffer: null,
    approachProgress: 0,
    pokedex: saved.pokedex || { [starterId]: { seen: 1, caught: 1 } },
    collection: saved.collection || { [starterId]: { count: 1, firstCaughtAt: saved.lastSavedAt || Date.now() } },
    enemy: null,
    exploration: 0
  };
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();

    const saved = JSON.parse(raw);
    if (saved.saveVersion < SAVE_VERSION) return migrateLegacySave(saved);
    if (saved.saveVersion !== SAVE_VERSION || !Array.isArray(saved.team) || !saved.team.length) return createInitialState();

    const base = createInitialState(saved.team[0].id, true);
    const journey = normalizeJourney(saved.journey);
    const area = normalizeArea(saved.area, journey);
    const validEncounterMode = ["approach", "battle", "capture"].includes(saved.mode);
    const mode = journey.complete ? "exploring" : saved.mode;

    return {
      ...base,
      ...saved,
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
      team: saved.team.map((pokemon) => normalizePokemon(pokemon)),
      storage: (saved.storage || []).map((pokemon) => normalizePokemon(pokemon)),
      activeTeamIndex: Math.min(saved.activeTeamIndex || 0, saved.team.length - 1),
      battleParticipants: saved.battleParticipants || [],
      captureOffer: saved.mode === "capture" ? saved.captureOffer : null,
      pokedex: saved.pokedex || base.pokedex,
      collection: saved.collection || base.collection,
      approachProgress: saved.approachProgress || 0,
      enemy: validEncounterMode ? saved.enemy : null
    };
  } catch {
    return createInitialState();
  }
}

export function saveGame(state) {
  if (!state.hasStarted) return;
  state.lastSavedAt = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function resetGame() {
  localStorage.removeItem(SAVE_KEY);
}
