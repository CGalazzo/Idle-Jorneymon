import { addLog, getActivePokemon } from "../core/game-state.js";
import { createChampionsHallPokemon } from "../data/champions-hall-pokemon.js";
import {
  evolutionLevelCapsReady,
  getEvolutionSafeEncounterLevel
} from "../data/evolution-level-cap.js";
import { createWildPokemon, normalizePokemonInstance } from "../data/pokemon.js";
import { createSafariPokemon } from "../data/safari-pokemon.js";
import { registerPokedexSeen } from "./pokedex.js";

const APPROACH_DURATION_SECONDS = 2.8;
const ENCOUNTER_STAT_KEYS = ["maxHp", "attack", "defense", "specialAttack", "specialDefense", "speed"];

function applyEvolutionSafeEncounterLevel(pokemon) {
  if (!pokemon) return pokemon;
  const previousLevel = Math.max(1, Math.min(100, Number(pokemon.level) || 1));
  const safeLevel = getEvolutionSafeEncounterLevel(pokemon.id, previousLevel);
  if (safeLevel >= previousLevel) return pokemon;

  const previousReward = Math.max(0, Number(pokemon.xpReward) || 0);
  const hardMultiplier = Math.max(1, Number(pokemon.hardStatMultiplier) || 1);
  const normalized = normalizePokemonInstance({
    ...pokemon,
    level: safeLevel
  }, { refreshExperienceCurve: true, heal: true });

  if (hardMultiplier > 1) {
    ENCOUNTER_STAT_KEYS.forEach((key) => {
      normalized[key] = Math.max(1, Math.round((Number(normalized[key]) || 1) * hardMultiplier));
    });
    normalized.hp = normalized.maxHp;
  }

  if (previousReward > 0) {
    const previousScale = 1 + previousLevel * 0.12;
    const safeScale = 1 + safeLevel * 0.12;
    normalized.xpReward = Math.max(1, Math.round(previousReward * safeScale / previousScale));
  }

  return normalized;
}

export function updateExploration(state, deltaSeconds, random = Math.random) {
  const completedJourneyWithoutActiveMode = state.journey?.complete
    && !state.revisit?.active
    && !state.safari?.active
    && !state.championsHall?.active;
  if (completedJourneyWithoutActiveMode) return;

  state.exploration += deltaSeconds * 7.5;
  if (state.exploration < state.nextEncounterAt) return;

  // Aguarda a tabela oficial de cadeias evolutivas antes de criar o encontro.
  // Em caso de falha de rede, o módulo libera automaticamente as regras locais.
  if (!evolutionLevelCapsReady()) return;

  const activePokemon = getActivePokemon(state);
  const generatedPokemon = state.championsHall?.active
    ? createChampionsHallPokemon(random)
    : state.safari?.active
      ? createSafariPokemon(state, random)
      : createWildPokemon(state, activePokemon.level, random);
  state.enemy = applyEvolutionSafeEncounterLevel(generatedPokemon);
  state.battleParticipants = [activePokemon.uid];
  state.approachProgress = 0;
  if (state.championsHall?.active) state.championsHall.encounters += 1;
  else if (state.safari?.active) state.safari.encounters += 1;
  else state.area.encounters += 1;
  state.totals.encounters += 1;
  state.mode = "approach";

  const encounterLabel = state.championsHall?.active
    ? "Um Campeão shiny"
    : state.safari?.active
      ? "Um Pokémon raro da Zona Safari"
      : state.enemy.isBoss
        ? state.enemy.bossType === "final" ? "O Boss Final" : "O Mini Boss"
        : "Um Pokémon selvagem";
  addLog(state, `${encounterLabel} ${state.enemy.name}${state.enemy.isShiny ? " shiny" : ""} está se aproximando!`);
  registerPokedexSeen(state, state.enemy);
}

export function updateApproach(state, deltaSeconds) {
  if (!state.enemy) {
    state.mode = "exploring";
    state.approachProgress = 0;
    return;
  }

  state.approachProgress = Math.min(1, state.approachProgress + deltaSeconds / APPROACH_DURATION_SECONDS);
  if (state.approachProgress < 1) return;

  state.mode = "battle";
  state.battleCooldown = state.enemy.isBoss ? 0.85 : 0.55;
  state.approachProgress = 0;
  const battleLabel = state.championsHall?.active
    ? `${state.enemy.name}, do Salão dos Campeões,`
    : state.safari?.active
      ? `${state.enemy.name}, encontrado na Zona Safari,`
      : state.enemy.isBoss ? `${state.enemy.name}, o chefe da rota,` : state.enemy.name;
  addLog(state, `${battleLabel} alcançou sua equipe. A batalha começou!`);
}
