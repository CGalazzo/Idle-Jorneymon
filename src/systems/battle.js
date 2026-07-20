import { addLog, getActivePokemon, randomEncounterTarget } from "../core/game-state.js";
import { effectivenessLabel, getTypeEffectiveness } from "../data/battle-data.js";
import { createAreaState } from "../data/worlds.js";
import { grantTeamExperience } from "./progression.js";
import { CAPTURE_DECISION_MS, getCaptureChance } from "./capture.js";

function offensiveStat(pokemon, move) {
  return move.category === "special" ? pokemon.specialAttack : pokemon.attack;
}

function defensiveStat(pokemon, move) {
  return move.category === "special" ? pokemon.specialDefense : pokemon.defense;
}

function moveScore(attacker, defender, move) {
  const attack = Math.max(1, offensiveStat(attacker, move));
  const defense = Math.max(1, defensiveStat(defender, move));
  const effectiveness = getTypeEffectiveness(move.type, defender.types || defender.type);
  const stab = (attacker.types || []).includes(move.type) ? 1.5 : 1;
  return move.power * (attack / defense) * effectiveness * stab;
}

function chooseBestMove(attacker, defender) {
  const moves = Array.isArray(attacker.moves) && attacker.moves.length
    ? attacker.moves
    : [{ name: "Investida", type: "normal", category: "physical", power: 40, accuracy: 100 }];
  return [...moves].sort((a, b) => moveScore(attacker, defender, b) - moveScore(attacker, defender, a))[0];
}

function calculateDamage(attacker, defender, move, random = Math.random) {
  const effectiveness = getTypeEffectiveness(move.type, defender.types || defender.type);
  if (effectiveness === 0) return { damage: 0, effectiveness };

  const attack = Math.max(1, offensiveStat(attacker, move));
  const defense = Math.max(1, defensiveStat(defender, move));
  const levelFactor = Math.floor((2 * attacker.level) / 5) + 2;
  const baseDamage = Math.floor(Math.floor((levelFactor * move.power * attack) / defense) / 50) + 2;
  const stab = (attacker.types || []).includes(move.type) ? 1.5 : 1;
  const variance = 0.85 + random() * 0.15;
  const damage = Math.max(1, Math.floor(baseDamage * stab * effectiveness * variance));
  return { damage, effectiveness };
}

function executeAttack(state, attacker, defender, random = Math.random) {
  const move = chooseBestMove(attacker, defender);
  const { damage, effectiveness } = calculateDamage(attacker, defender, move, random);
  defender.hp = Math.max(0, defender.hp - damage);

  if (damage > 0) addLog(state, `${attacker.name} usou ${move.name} e causou ${damage} de dano.`);
  else addLog(state, `${attacker.name} usou ${move.name}.`);

  const effectivenessCopy = effectivenessLabel(effectiveness);
  if (effectivenessCopy) addLog(state, effectivenessCopy);
}

function registerParticipant(state, pokemon) {
  if (!state.battleParticipants.includes(pokemon.uid)) state.battleParticipants.push(pokemon.uid);
}

function nextAvailablePokemon(state) {
  return state.team.findIndex((pokemon) => pokemon.hp > 0);
}

function finishVictory(state, now = Date.now()) {
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
  state.activeTeamIndex = Math.max(0, nextAvailablePokemon(state));
  state.mode = "capture";
  state.captureOffer = {
    chance: getCaptureChance(defeated),
    startedAt: now,
    expiresAt: now + CAPTURE_DECISION_MS
  };
  state.battleParticipants = [];
}

function restartCurrentRouteAfterDefeat(state) {
  const defeatedArea = state.area.name;
  state.area = createAreaState(state.journey?.worldIndex, state.journey?.routeIndex);
  state.pendingRouteAdvance = false;
  state.captureOffer = null;
  state.approachProgress = 0;
  state.enemy = null;
  state.exploration = 0;
  state.battleParticipants = [];
  state.activeTeamIndex = 0;
  addLog(state, `Derrota em ${defeatedArea}: o progresso da rota voltou para 0/${state.area.requiredVictories}.`);
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

  addLog(state, "Toda a equipe desmaiou.");
  restartCurrentRouteAfterDefeat(state);
  state.mode = "recovering";
  state.recoveryCooldown = 5;
}

function resolveFainting(state, player, now) {
  if (state.enemy.hp <= 0) {
    finishVictory(state, now);
    return true;
  }
  if (player.hp <= 0) {
    addLog(state, `${player.name} desmaiou.`);
    handleFaintedPokemon(state);
    return true;
  }
  return false;
}

export function updateBattle(state, deltaSeconds, random = Math.random, now = Date.now()) {
  if (!state.enemy) return;
  state.battleCooldown -= deltaSeconds;
  if (state.battleCooldown > 0) return;

  const player = getActivePokemon(state);
  if (!player || player.hp <= 0) {
    handleFaintedPokemon(state);
    return;
  }
  registerParticipant(state, player);

  const enemy = state.enemy;
  const playerFirst = player.speed === enemy.speed ? random() >= 0.5 : player.speed > enemy.speed;
  const turns = playerFirst
    ? [[player, enemy], [enemy, player]]
    : [[enemy, player], [player, enemy]];

  for (const [attacker, defender] of turns) {
    if (attacker.hp <= 0 || defender.hp <= 0) break;
    executeAttack(state, attacker, defender, random);
    if (resolveFainting(state, player, now)) return;
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
  addLog(state, "A equipe se recuperou e recomeçou a rota desde o início.");
}
