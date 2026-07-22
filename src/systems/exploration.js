import { addLog, getActivePokemon } from "../core/game-state.js";
import { createChampionsHallPokemon } from "../data/champions-hall-pokemon.js";
import { createWildPokemon } from "../data/pokemon.js";
import { createSafariPokemon } from "../data/safari-pokemon.js";
import { registerPokedexSeen } from "./pokedex.js";

const APPROACH_DURATION_SECONDS = 2.8;

export function updateExploration(state, deltaSeconds, random = Math.random) {
  if (state.journey?.complete && !state.safari?.active && !state.championsHall?.active) return;

  state.exploration += deltaSeconds * 7.5;
  if (state.exploration < state.nextEncounterAt) return;

  const activePokemon = getActivePokemon(state);
  state.enemy = state.championsHall?.active
    ? createChampionsHallPokemon(state, random)
    : state.safari?.active
      ? createSafariPokemon(state, random)
      : createWildPokemon(state, activePokemon.level, random);
  state.battleParticipants = [activePokemon.uid];
  state.approachProgress = 0;
  if (state.championsHall?.active) state.championsHall.encounters += 1;
  else if (state.safari?.active) state.safari.encounters += 1;
  else state.area.encounters += 1;
  state.totals.encounters += 1;
  state.mode = "approach";

  const encounterLabel = state.championsHall?.active
    ? "Um Lendário ou Mítico shiny do Salão dos Campeões"
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
    ? `${state.enemy.name}, encontrado no Salão dos Campeões,`
    : state.safari?.active
      ? `${state.enemy.name}, encontrado na Zona Safari,`
      : state.enemy.isBoss ? `${state.enemy.name}, o chefe da rota,` : state.enemy.name;
  addLog(state, `${battleLabel} alcançou sua equipe. A batalha começou!`);
}
