import { addLog, getActivePokemon } from "../core/game-state.js";
import { createWildPokemon } from "../data/pokemon.js";
import { registerSeen } from "./capture.js";

const APPROACH_DURATION_SECONDS = 2.8;

export function updateExploration(state, deltaSeconds, random = Math.random) {
  state.exploration += deltaSeconds * 7.5;
  if (state.exploration < state.nextEncounterAt) return;

  const activePokemon = getActivePokemon(state);
  state.enemy = createWildPokemon(activePokemon.level, random);
  state.battleParticipants = [activePokemon.uid];
  state.approachProgress = 0;
  registerSeen(state, state.enemy);
  state.area.encounters += 1;
  state.mode = "approach";
  addLog(state, `Um ${state.enemy.name}${state.enemy.isShiny ? " shiny" : ""} selvagem está se aproximando!`);
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
  state.battleCooldown = 0.55;
  state.approachProgress = 0;
  addLog(state, `${state.enemy.name} alcançou sua equipe. A batalha começou!`);
}
