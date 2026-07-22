import { normalizePokemonInstance } from "./pokemon.js";
import {
  SAFARI_SHINY_CHANCE,
  chooseSafariEncounter
} from "./safari-data.js";

const IV_BY_TIER = {
  uncommon: 18,
  rare: 22,
  epic: 26,
  ultra: 29,
  special: 31
};

function baseExperienceFromStats(baseStats = {}) {
  const total = Object.values(baseStats).reduce((sum, value) => sum + (Number(value) || 0), 0);
  return Math.max(8, Math.round(total / 30));
}

export function createSafariPokemon(state, random = Math.random) {
  const template = chooseSafariEncounter(state.safari?.habitatId, random);
  const strongestLevel = Math.max(5, ...(state.team || []).map((pokemon) => Number(pokemon.level) || 5));
  const level = Math.max(5, Math.min(100, strongestLevel - 3 + Math.floor(random() * 7)));
  const iv = IV_BY_TIER[template.safariTier] || 20;
  const isShiny = random() < SAFARI_SHINY_CHANCE;
  const normalized = normalizePokemonInstance({
    ...template,
    level,
    iv,
    isShiny,
    hp: 1,
    maxHp: 1,
    xp: 0,
    xpToNext: 1,
    safariEncounter: true,
    encounterRole: "safari",
    isBoss: false,
    bossType: null
  }, { refreshExperienceCurve: true, heal: true });

  return {
    ...normalized,
    safariEncounter: true,
    safariExclusive: true,
    safariHabitatId: template.safariHabitatId,
    safariHabitatName: template.safariHabitatName,
    safariTier: template.safariTier,
    xpReward: Math.round(baseExperienceFromStats(normalized.baseStats) * (1 + level * 0.12)),
    playerLevelAtEncounter: strongestLevel
  };
}
