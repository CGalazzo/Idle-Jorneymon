import { addLog, randomEncounterTarget } from "../core/game-state.js";
import { grantExperience } from "./progression.js";

function damage(attacker, defender, random = Math.random) {
  const variance = 0.85 + random() * 0.3;
  return Math.max(1, Math.round((attacker.attack - defender.defense * 0.45) * variance));
}

function finishBattle(state, victory) {
  if (victory) {
    const defeated = state.enemy;
    state.area.victories += 1;
    addLog(state, `${defeated.name} foi derrotado!`);
    grantExperience(state, defeated.xpReward);
    state.player.hp = Math.min(state.player.maxHp, state.player.hp + Math.ceil(state.player.maxHp * 0.2));
    state.mode = "exploring";
    state.enemy = null;
    state.exploration = 0;
    state.nextEncounterAt = randomEncounterTarget();
  } else {
    addLog(state, `${state.player.name} desmaiou e está se recuperando.`);
    state.mode = "recovering";
    state.recoveryCooldown = 5;
  }
}

export function updateBattle(state, deltaSeconds, random = Math.random) {
  if (!state.enemy) return;
  state.battleCooldown -= deltaSeconds;
  if (state.battleCooldown > 0) return;

  const playerDamage = damage(state.player, state.enemy, random);
  state.enemy.hp = Math.max(0, state.enemy.hp - playerDamage);
  addLog(state, `${state.player.name} causou ${playerDamage} de dano.`);

  if (state.enemy.hp <= 0) {
    finishBattle(state, true);
    return;
  }

  const enemyDamage = damage(state.enemy, state.player, random);
  state.player.hp = Math.max(0, state.player.hp - enemyDamage);
  addLog(state, `${state.enemy.name} causou ${enemyDamage} de dano.`);

  if (state.player.hp <= 0) {
    finishBattle(state, false);
    return;
  }

  state.battleCooldown = 1.25;
}

export function updateRecovery(state, deltaSeconds) {
  state.recoveryCooldown -= deltaSeconds;
  if (state.recoveryCooldown > 0) return;

  state.player.hp = state.player.maxHp;
  state.mode = "exploring";
  state.enemy = null;
  state.exploration = 0;
  state.nextEncounterAt = randomEncounterTarget();
  addLog(state, `${state.player.name} se recuperou e voltou à jornada.`);
}
