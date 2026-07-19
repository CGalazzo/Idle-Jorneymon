import { addLog } from "../core/game-state.js";
import { createWildPokemon } from "../data/pokemon.js";
import { registerSeen } from "./capture.js";

export function updateExploration(state, deltaSeconds, random = Math.random) {
  const progress = deltaSeconds * 7.5;
  state.exploration += progress;
  state.totalSteps += Math.max(1, Math.round(deltaSeconds * 2));

  if (state.exploration < state.nextEncounterAt) return;

  state.enemy = createWildPokemon(state.player.level, random);
  registerSeen(state, state.enemy);
  state.area.encounters += 1;
  state.mode = "battle";
  state.battleCooldown = 0.75;
  addLog(state, `Um ${state.enemy.name} selvagem apareceu!`);
}
