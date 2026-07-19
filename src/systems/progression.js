import { addLog } from "../core/game-state.js";

export function grantExperience(state, amount) {
  state.player.xp += amount;
  addLog(state, `${state.player.name} recebeu ${amount} XP.`);

  while (state.player.xp >= state.player.xpToNext) {
    state.player.xp -= state.player.xpToNext;
    state.player.level += 1;
    state.player.xpToNext = Math.round(state.player.xpToNext * 1.28);
    state.player.maxHp += 4;
    state.player.attack += 2;
    state.player.defense += 1;
    state.player.hp = state.player.maxHp;
    addLog(state, `${state.player.name} subiu para o nível ${state.player.level}!`);
  }
}
