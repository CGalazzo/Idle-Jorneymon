const OFFICIAL_POKEMON_URL = "https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/pokemon.csv";
const METRICS_CACHE_KEY = "idle-jorneymon-official-metrics-v1";

const officialMetrics = new Map();

const FALLBACK_HEIGHT_DM = {
  1: 7, 2: 10, 3: 20, 4: 6, 5: 11, 6: 17, 7: 5, 8: 10, 9: 16,
  10: 3, 11: 7, 12: 11, 13: 3, 14: 6, 15: 10, 16: 3, 17: 11, 18: 15,
  43: 5, 44: 8, 45: 12, 95: 88, 130: 65, 144: 17, 150: 20, 248: 20,
  373: 15, 376: 16, 445: 19, 464: 24, 487: 45, 635: 18
};

function restoreCachedMetrics() {
  if (typeof localStorage === "undefined") return;
  try {
    const cached = JSON.parse(localStorage.getItem(METRICS_CACHE_KEY) || "{}");
    Object.entries(cached).forEach(([id, metrics]) => {
      if (Number(metrics?.heightDm) > 0) officialMetrics.set(Number(id), metrics);
    });
  } catch {
    localStorage.removeItem(METRICS_CACHE_KEY);
  }
}

restoreCachedMetrics();

export async function loadOfficialPokemonMetrics(speciesIds = []) {
  const wanted = new Set(speciesIds.map(Number).filter(Number.isFinite));
  const missing = [...wanted].filter((id) => !officialMetrics.has(id));
  if (!missing.length) return true;

  try {
    const response = await fetch(OFFICIAL_POKEMON_URL, { cache: "force-cache" });
    if (!response.ok) throw new Error(`Falha ao carregar tamanhos: ${response.status}`);
    const rows = (await response.text()).trim().split(/\r?\n/).slice(1);

    rows.forEach((row) => {
      const [idText, , speciesIdText, heightText, weightText, , , isDefaultText] = row.split(",");
      const id = Number(idText);
      const speciesId = Number(speciesIdText);
      if (!wanted.has(speciesId) || Number(isDefaultText) !== 1 || id !== speciesId) return;
      const heightDm = Number(heightText);
      const weightHg = Number(weightText);
      if (heightDm > 0) officialMetrics.set(speciesId, { heightDm, weightHg });
    });

    if (typeof localStorage !== "undefined") {
      const cache = {};
      wanted.forEach((id) => {
        const metrics = officialMetrics.get(id);
        if (metrics) cache[id] = metrics;
      });
      localStorage.setItem(METRICS_CACHE_KEY, JSON.stringify(cache));
    }
    return true;
  } catch (error) {
    console.warn("Idle Jorneymon: usando tamanhos de segurança.", error);
    return false;
  }
}

export function getPokemonHeightDm(speciesId) {
  const id = Number(speciesId);
  return Number(officialMetrics.get(id)?.heightDm) || FALLBACK_HEIGHT_DM[id] || 10;
}

export function getExplorationSpriteSize(pokemon) {
  const heightMeters = Math.max(0.1, (Number(pokemon?.heightDm) || getPokemonHeightDm(pokemon?.id)) / 10);
  const calculated = 36 + Math.sqrt(heightMeters) * 35;
  return Math.round(Math.max(44, Math.min(148, calculated)));
}
