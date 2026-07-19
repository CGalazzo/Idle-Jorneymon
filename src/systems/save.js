import { createInstanceId } from "../data/pokemon.js";
import { createInitialState, GAME_VERSION, SAVE_VERSION } from "../core/game-state.js";

const SAVE_KEY = "idle-jorneymon-save";

export function hasSavedGame() {
  return Boolean(localStorage.getItem(SAVE_KEY));
}

function normalizePokemon(pokemon) {
  return {
    ...pokemon,
    uid: pokemon.uid || createInstanceId(pokemon.id),
    hp: Math.max(0, Math.min(pokemon.hp ?? pokemon.maxHp, pokemon.maxHp)),
    xp: pokemon.xp || 0,
    xpToNext: pokemon.xpToNext || 30
  };
}

function migrateLegacySave(saved) {
  const legacyPlayer = saved.player || saved.team?.[0];
  const starterId = legacyPlayer?.id || 4;
  const base = createInitialState(starterId, true);
  const migratedTeam = Array.isArray(saved.team) && saved.team.length
    ? saved.team.map(normalizePokemon)
    : [normalizePokemon({ ...base.team[0], ...legacyPlayer })];
  const migratedStorage = Array.isArray(saved.storage) ? saved.storage.map(normalizePokemon) : [];

  return {
    ...base,
    ...saved,
    saveVersion: SAVE_VERSION,
    gameVersion: GAME_VERSION,
    hasStarted: true,
    team: migratedTeam,
    storage: migratedStorage,
    activeTeamIndex: Math.min(saved.activeTeamIndex || 0, migratedTeam.length - 1),
    battleParticipants: saved.battleParticipants || [],
    captureOffer: null,
    pokedex: saved.pokedex || { [starterId]: { seen: 1, caught: 1 } },
    collection: saved.collection || { [starterId]: { count: 1, firstCaughtAt: saved.lastSavedAt || Date.now() } },
    enemy: saved.mode === "battle" ? saved.enemy : null
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
    return {
      ...base,
      ...saved,
      gameVersion: GAME_VERSION,
      hasStarted: true,
      team: saved.team.map(normalizePokemon),
      storage: (saved.storage || []).map(normalizePokemon),
      activeTeamIndex: Math.min(saved.activeTeamIndex || 0, saved.team.length - 1),
      battleParticipants: saved.battleParticipants || [],
      captureOffer: saved.mode === "capture" ? saved.captureOffer : null,
      pokedex: saved.pokedex || base.pokedex,
      collection: saved.collection || base.collection,
      approachProgress: saved.approachProgress || 0,
      enemy: saved.mode === "approach" || saved.mode === "battle" || saved.mode === "capture" ? saved.enemy : null
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
