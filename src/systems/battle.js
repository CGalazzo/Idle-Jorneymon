import { addLog, getActivePokemon, randomEncounterTarget } from "../core/game-state.js";
import { grantTeamExperience } from "./progression.js";
import { getCaptureChance } from "./capture.js";

function damage(attacker, defender, random = Math.random) {
  const variance = 0.85 + random() * 0.3;
  return Math.max(1, Math.round((attacker.attack - defender.defense * 0.45) * variance));
}

function registerParticipant(state, pokemon) {
  if (!state.battleParticipants.includes(pokemon.uid)) state.battleParticipants.push(pokemon.uid);
}

function nextAvailablePokemon(state) {
  return state.team.findIndex((pokemon) => pokemon.hp > 0);
}

function finishVictory(state) {
  const defeated = state.enemy;
  state.area.victories += 1;
  state.totals.victories += 1;

  if (defeated.isBoss) {
    state.area.bossDefeated = true;
    state.pendingRouteAdvance = true;
    const bossLabel = defeated.bossType === "final" ? "Boss Final" : "Mini Boss";
    addLog(state, `${bossLabel} ${defeated.name} foi derrotado!`);
  } else {
    state.area.regularVictories += 1;
    addLog(state, `${defeated.name} foi derrotado!`);
    if (state.area.regularVictories >= state.area.requiredVictories) {
      const bossLabel = state.area.bossType === "final" ? "Boss Final" : "Mini Boss";
      addLog(state, `${bossLabel} ${state.area.bossName} apareceu no fim da rota!`);
    }
  }

  grantTeamExperience(state, defeated.xpReward);
  state.team.forEach((pokemon) => {
    if (pokemon.hp > 0) pokemon.hp = Math.min(pokemon.maxHp, pokemon.hp + Math.ceil(pokemon.maxHp * 0.2));
  });
  state.activeTeamIndex = Math.max(0, nextAvailablePokemon(state));
  state.mode = "capture";
  state.captureOffer = { chance: getCaptureChance(defeated) };
  state.battleParticipants = [];
}

function handleFaintedPokemon(state) {
  const nextIndex = nextAvailablePokemon(state);
  if (nextIndex >= 0) {
    state.activeTeamIndex = nextIndex;
    const nextPokemon = getActivePokemon(state);
    registerParticipant(state, nextPokemon);
    addLog(state, `${nextPokemon.name} entrou na batalha!`);
    state.battleCooldown = 1.1;
    return;
  }

  addLog(state, "Toda a equipe desmaiou e está se recuperando.");
  state.mode = "recovering";
  state.recoveryCooldown = 5;
}

export function updateBattle(state, deltaSeconds, random = Math.random) {
  if (!state.enemy) return;
  state.battleCooldown -= deltaSeconds;
  if (state.battleCooldown > 0) return;

  const player = getActivePokemon(state);
  if (!player || player.hp <= 0) {
    handleFaintedPokemon(state);
    return;
  }
  registerParticipant(state, player);

  const playerDamage = damage(player, state.enemy, random);
  state.enemy.hp = Math.max(0, state.enemy.hp - playerDamage);
  addLog(state, `${player.name} causou ${playerDamage} de dano.`);

  if (state.enemy.hp <= 0) {
    finishVictory(state);
    return;
  }

  const enemyDamage = damage(state.enemy, player, random);
  player.hp = Math.max(0, player.hp - enemyDamage);
  addLog(state, `${state.enemy.name} causou ${enemyDamage} de dano.`);

  if (player.hp <= 0) {
    addLog(state, `${player.name} desmaiou.`);
    handleFaintedPokemon(state);
    return;
  }

  state.battleCooldown = state.enemy.isBoss ? 1.45 : 1.25;
}

export function updateRecovery(state, deltaSeconds) {
  state.recoveryCooldown -= deltaSeconds;
  if (state.recoveryCooldown > 0) return;

  state.team.forEach((pokemon) => { pokemon.hp = pokemon.maxHp; });
  state.activeTeamIndex = 0;
  state.mode = "exploring";
  state.enemy = null;
  state.battleParticipants = [];
  state.exploration = 0;
  state.nextEncounterAt = randomEncounterTarget();
  addLog(state, "A equipe se recuperou e voltou à jornada.");
}
