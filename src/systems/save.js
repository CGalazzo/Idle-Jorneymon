import { evolvePokemonIfReady, normalizePokemonInstance } from "../data/pokemon.js";
import { createInitialState, GAME_VERSION, SAVE_VERSION } from "../core/game-state.js";
import { createAreaState, ENVIRONMENTS, getRouteDefinition, TOTAL_ROUTES } from "../data/worlds.js";

const SAVE_KEY = "idle-jorneymon-save";
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
  const normalized = normalizePokemonInstance(pokemon, { refreshExperienceCurve });
  if (applyPendingEvolutions) {
    const context = evolutionContext(environmentId);
    while (evolvePokemonIfReady(normalized, context)) {
      // Aplica evoluções pendentes por nível. Eevee só evolui ao subir de nível no ambiente correto.
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

function migrateSave(saved) {
  const legacyPlayer = saved.player || saved.team?.[0];
  const starterId = legacyPlayer?.id || 4;
  const base = createInitialState(starterId, true);
  const environmentId = resolveEnvironmentId(saved);
  const journey = normalizeJourney(saved.journey, environmentId, true);
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
  registerRosterEntries(pokedex, collection, [...migratedTeam, ...migratedStorage]);

  return {
    ...base,
    ...saved,
    saveVersion: SAVE_VERSION,
    gameVersion: GAME_VERSION,
    hasStarted: true,
    mode: "exploring",
    journey,
    area,
    totals: {
      encounters: Math.max(0, Number(saved.totals?.encounters) || Number(saved.area?.encounters) || 0),
      victories: Math.max(0, Number(saved.totals?.victories) || Number(saved.area?.victories) || 0)
    },
    pendingRouteAdvance: false,
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
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();

    const saved = JSON.parse(raw);
    const savedVersion = Number(saved.saveVersion) || 0;
    if (savedVersion < SAVE_VERSION) return migrateSave(saved);
    if (savedVersion !== SAVE_VERSION || !Array.isArray(saved.team) || !saved.team.length) return createInitialState();

    const base = createInitialState(saved.team[0].id, true);
    const environmentId = resolveEnvironmentId(saved);
    const journey = normalizeJourney(saved.journey, environmentId, false);
    const currentEnvironmentId = ENVIRONMENTS[journey.worldIndex]?.id || "bosque";
    const area = normalizeArea(saved.area, journey);
    const validEncounterMode = ["approach", "battle", "capture"].includes(saved.mode) && saved.enemy;
    const allowedModes = ["exploring", "approach", "battle", "capture", "recovering"];
    const mode = journey.complete ? "exploring" : (allowedModes.includes(saved.mode) ? saved.mode : "exploring");
    const team = saved.team.map((pokemon) => normalizePokemon(pokemon, false, true, currentEnvironmentId));
    const storage = (saved.storage || []).map((pokemon) => normalizePokemon(pokemon, false, true, currentEnvironmentId));
    const pokedex = { ...(saved.pokedex || base.pokedex) };
    const collection = { ...(saved.collection || base.collection) };
    registerRosterEntries(pokedex, collection, [...team, ...storage]);

    return {
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
      team,
      storage,
      activeTeamIndex: Math.min(saved.activeTeamIndex || 0, team.length - 1),
      battleParticipants: saved.battleParticipants || [],
      captureOffer: saved.mode === "capture" ? saved.captureOffer : null,
      pokedex,
      collection,
      approachProgress: saved.approachProgress || 0,
      enemy: validEncounterMode ? normalizePokemon(saved.enemy, false, false, currentEnvironmentId) : null
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
