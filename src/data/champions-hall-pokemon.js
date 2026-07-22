import { normalizePokemonInstance } from "./pokemon.js";
import {
  CHAMPIONS_HALL_LEVEL,
  chooseChampionsHallEncounter
} from "./champions-hall-data.js";

const CHAMPIONS_HALL_IV = 31;

function baseExperienceFromStats(baseStats = {}) {
  const total = Object.values(baseStats).reduce((sum, value) => sum + (Number(value) || 0), 0);
  return Math.max(8, Math.round(total / 30));
}

export function createChampionsHallPokemon(state, random = Math.random) {
  const template = chooseChampionsHallEncounter(random);
  const normalized = normalizePokemonInstance({
    ...template,
    level: CHAMPIONS_HALL_LEVEL,
    iv: CHAMPIONS_HALL_IV,
    isShiny: true,
    hp: 1,
    maxHp: 1,
    xp: 0,
    xpToNext: 1,
    championsHallEncounter: true,
    encounterRole: "champions-hall",
    isBoss: false,
    bossType: null
  }, { refreshExperienceCurve: true, heal: true });

  return {
    ...normalized,
    rarity: template.rarity,
    isShiny: true,
    championsHallEncounter: true,
    championsHallExclusive: true,
    encounterRole: "champions-hall",
    xpReward: Math.round(baseExperienceFromStats(normalized.baseStats) * (1 + CHAMPIONS_HALL_LEVEL * 0.12)),
    playerLevelAtEncounter: Math.max(1, ...(state.team || []).map((pokemon) => Number(pokemon.level) || 1))
  };
}
