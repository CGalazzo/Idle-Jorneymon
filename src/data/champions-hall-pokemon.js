import { normalizePokemonInstance } from "./pokemon.js";
import {
  CHAMPIONS_HALL_IV,
  CHAMPIONS_HALL_LEVEL,
  chooseChampionsHallSpecies
} from "./champions-hall-data.js";

function baseExperienceFromStats(baseStats = {}) {
  const total = Object.values(baseStats).reduce((sum, value) => sum + (Number(value) || 0), 0);
  return Math.max(20, Math.round(total / 20));
}

export function createChampionsHallPokemon(random = Math.random) {
  const template = chooseChampionsHallSpecies(random);
  const normalized = normalizePokemonInstance({
    ...template,
    level: CHAMPIONS_HALL_LEVEL,
    iv: CHAMPIONS_HALL_IV,
    isShiny: true,
    xp: 0,
    championsHallEncounter: true,
    encounterRole: "champions-hall",
    isBoss: false,
    bossType: null
  }, { refreshExperienceCurve: true, heal: true });

  return {
    ...normalized,
    level: CHAMPIONS_HALL_LEVEL,
    isShiny: true,
    championsHallEncounter: true,
    championsHallExclusive: true,
    rarity: template.rarity,
    xpReward: Math.round(baseExperienceFromStats(normalized.baseStats) * 3),
    playerLevelAtEncounter: CHAMPIONS_HALL_LEVEL
  };
}
