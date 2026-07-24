import { EVOLUTION_RULES } from "./evolutions.js";
import { HARD_EVOLUTION_RULES } from "./hard-evolutions.js";

const OFFICIAL_SPECIES_URL = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon_species.csv";
const CACHE_KEY = "idle-jorneymon-evolution-depths-v1";

const officialDepths = new Map();
const fallbackChildren = new Map();
let officialDataReady = false;

function addChild(map, parentId, childId) {
  const parent = Number(parentId);
  const child = Number(childId);
  if (!Number.isFinite(parent) || !Number.isFinite(child) || parent <= 0 || child <= 0) return;
  if (!map.has(parent)) map.set(parent, new Set());
  map.get(parent).add(child);
}

function installFallbackRules() {
  Object.entries({ ...EVOLUTION_RULES, ...HARD_EVOLUTION_RULES }).forEach(([from, rule]) => {
    addChild(fallbackChildren, from, rule?.to);
  });

  // Evoluções ramificadas tratadas por contexto no sistema principal.
  [134, 135, 136, 196, 197, 470, 471, 700].forEach((target) => addChild(fallbackChildren, 133, target));
  [282, 475].forEach((target) => addChild(fallbackChildren, 281, target));
  [106, 107, 237].forEach((target) => addChild(fallbackChildren, 236, target));

  // Segurança para o exemplo clássico mesmo se a tabela oficial estiver indisponível.
  addChild(fallbackChildren, 129, 130);
}

function calculateDepth(speciesId, children, memo, visiting = new Set()) {
  const id = Number(speciesId);
  if (!Number.isFinite(id) || id <= 0) return 0;
  if (memo.has(id)) return memo.get(id);
  if (visiting.has(id)) return 0;

  visiting.add(id);
  const descendants = [...(children.get(id) || [])];
  const depth = descendants.length
    ? 1 + Math.max(...descendants.map((childId) => calculateDepth(childId, children, memo, visiting)))
    : 0;
  visiting.delete(id);
  memo.set(id, depth);
  return depth;
}

function buildDepthMap(children) {
  const memo = new Map();
  const speciesIds = new Set();
  children.forEach((descendants, parentId) => {
    speciesIds.add(Number(parentId));
    descendants.forEach((childId) => speciesIds.add(Number(childId)));
  });
  speciesIds.forEach((speciesId) => calculateDepth(speciesId, children, memo));
  return memo;
}

function restoreCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    if (!cached || typeof cached !== "object") return false;
    Object.entries(cached).forEach(([speciesId, depth]) => {
      const id = Number(speciesId);
      const safeDepth = Math.max(0, Math.floor(Number(depth) || 0));
      if (Number.isFinite(id) && id > 0) officialDepths.set(id, safeDepth);
    });
    return officialDepths.size > 0;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return false;
  }
}

function saveCache() {
  try {
    const serialized = Object.fromEntries(officialDepths);
    localStorage.setItem(CACHE_KEY, JSON.stringify(serialized));
  } catch {
    // O limite continua funcionando com a tabela em memória.
  }
}

async function loadOfficialDepths() {
  if (restoreCache()) {
    officialDataReady = true;
    return true;
  }

  try {
    const response = await fetch(OFFICIAL_SPECIES_URL, { cache: "force-cache" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const rows = (await response.text()).trim().split(/\r?\n/).slice(1);
    const children = new Map();
    rows.forEach((row) => {
      const columns = row.split(",");
      const speciesId = Number(columns[0]);
      const evolvesFromId = Number(columns[3]);
      if (Number.isFinite(speciesId) && Number.isFinite(evolvesFromId) && evolvesFromId > 0) {
        addChild(children, evolvesFromId, speciesId);
      }
    });

    buildDepthMap(children).forEach((depth, speciesId) => officialDepths.set(speciesId, depth));
    saveCache();
    officialDataReady = true;
    return true;
  } catch (error) {
    console.warn("Idle Jorneymon: usando limites de evolução locais.", error);
    officialDataReady = true;
    return false;
  }
}

installFallbackRules();
const fallbackDepths = buildDepthMap(fallbackChildren);
void loadOfficialDepths();

export function evolutionLevelCapsReady() {
  return officialDataReady;
}

export function remainingEvolutionSteps(speciesId) {
  const id = Number(speciesId);
  if (!Number.isFinite(id) || id <= 0) return 0;
  return officialDepths.get(id) ?? fallbackDepths.get(id) ?? 0;
}

export function getEvolutionSafeEncounterLevel(speciesId, requestedLevel) {
  const level = Math.max(1, Math.min(100, Math.floor(Number(requestedLevel) || 1)));
  const maximumLevel = Math.max(1, 100 - remainingEvolutionSteps(speciesId));
  return Math.min(level, maximumLevel);
}
