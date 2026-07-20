import { addLog, getActivePokemon, randomEncounterTarget } from "../core/game-state.js";
import { effectivenessLabel, getTypeEffectiveness } from "../data/battle-data.js";
import { getHardBossTemplate } from "../data/hard-mode-data.js";
import { POKEDEX_SPECIES } from "../data/pokemon.js";
import { createAreaState, getRouteDefinition } from "../data/worlds.js";
import { grantTeamExperience } from "./progression.js";
import { CAPTURE_DECISION_MS, getCaptureChance } from "./capture.js";
import { grantBattleCoins } from "./shop.js";
import {
  activateEquippedMega,
  activateHardBossMega,
  deactivateAllMegaEvolutions,
  deactivateMegaEvolution
} from "./mega.js";

const MEGA_TRANSFORMATION_SECONDS = 1.8;
const HARD_SECOND_PHASE_PAUSE_SECONDS = 1.2;
const HARD_SECOND_PHASE_THRESHOLD = 0.4;
const HARD_SECOND_PHASE_STAT_MULTIPLIER = 1.2;

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

function clearMegaTransformationPause(state) {
  state.megaEvolutionCooldown = 0;
}

function currentRouteBossName(state) {
  const route = getRouteDefinition(state.journey?.worldIndex, state.journey?.routeIndex);
  return state.campaignMode === "hard"
    ? getHardBossTemplate(route, POKEDEX_SPECIES).name
    : route.boss.name;
}

function activateHardBossSecondPhase(state, pokemon) {
  if (state.campaignMode !== "hard" || !pokemon?.isBoss || pokemon.bossType !== "final") return false;
  if (pokemon.hardSecondPhase || pokemon.hp <= 0 || pokemon.hp / Math.max(1, pokemon.maxHp) > HARD_SECOND_PHASE_THRESHOLD) return false;

  pokemon.attack = Math.max(1, Math.round(pokemon.attack * HARD_SECOND_PHASE_STAT_MULTIPLIER));
  pokemon.specialAttack = Math.max(1, Math.round(pokemon.specialAttack * HARD_SECOND_PHASE_STAT_MULTIPLIER));
  pokemon.speed = Math.max(1, Math.round(pokemon.speed * HARD_SECOND_PHASE_STAT_MULTIPLIER));
  pokemon.hardSecondPhase = true;
  pokemon.hardSecondPhaseMultiplier = HARD_SECOND_PHASE_STAT_MULTIPLIER;
  addLog(state, `${pokemon.name} entrou na FASE 2! Seu poder e sua velocidade aumentaram.`);
  return true;
}

function finishVictory(state, now = Date.now()) {
  const defeated = state.enemy;
  const defeatedName = defeated.name;
  state.area.victories += 1;
  state.totals.victories += 1;

  if (defeated.isBoss) {
    state.area.bossDefeated = true;
    state.pendingRouteAdvance = true;
    const bossLabel = defeated.bossType === "final" ? "Boss Final" : "Mini Boss";
    addLog(state, `${bossLabel} ${defeatedName} foi derrotado!`);
  } else {
    state.area.regularVictories += 1;
    addLog(state, `${defeatedName} foi derrotado!`);
    if (state.area.regularVictories >= state.area.requiredVictories) {
      const bossLabel = state.area.bossType === "final" ? "Boss Final" : "Mini Boss";
      const bossName = currentRouteBossName(state);
      state.area.bossName = bossName;
      addLog(state, `${bossLabel} ${bossName} apareceu no fim da rota!`);
    }
  }

  clearMegaTransformationPause(state);
  deactivateAllMegaEvolutions(state);
  if (defeated.isMega) deactivateMegaEvolution(defeated);
  delete defeated.hardSecondPhase;
  delete defeated.hardSecondPhaseMultiplier;
  grantTeamExperience(state, defeated.xpReward);
  grantBattleCoins(state, defeated);
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
  clearMegaTransformationPause(state);
  deactivateAllMegaEvolutions(state);
  state.area = createAreaState(state.journey?.worldIndex, state.journey?.routeIndex);
  if (state.campaignMode === "hard") state.area.bossName = currentRouteBossName(state);
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
    clearMegaTransformationPause(state);
    deactivateMegaEvolution(player);
    handleFaintedPokemon(state);
    return true;
  }
  return false;
}

export function updateBattle(state, deltaSeconds, random = Math.random, now = Date.now()) {
  if (!state.enemy) return;

  if (state.megaEvolutionCooldown > 0) {
    state.megaEvolutionCooldown = Math.max(0, state.megaEvolutionCooldown - deltaSeconds);
    return;
  }

  state.battleCooldown -= deltaSeconds;
  if (state.battleCooldown > 0) return;

  const player = getActivePokemon(state);
  if (!player || player.hp <= 0) {
    handleFaintedPokemon(state);
    return;
  }

  registerParticipant(state, player);

  if (activateHardBossMega(state, state.enemy)) {
    state.megaEvolutionCooldown = MEGA_TRANSFORMATION_SECONDS;
    state.battleCooldown = 0;
    return;
  }

  if (activateEquippedMega(state, player)) {
    state.megaEvolutionCooldown = MEGA_TRANSFORMATION_SECONDS;
    state.battleCooldown = 0;
    return;
  }

  const enemy = state.enemy;
  const playerFirst = player.speed === enemy.speed ? random() >= 0.5 : player.speed > enemy.speed;
  const turns = playerFirst
    ? [[player, enemy], [enemy, player]]
    : [[enemy, player], [player, enemy]];

  for (const [attacker, defender] of turns) {
    if (attacker.hp <= 0 || defender.hp <= 0) break;
    executeAttack(state, attacker, defender, random);
    if (resolveFainting(state, player, now)) return;
    if (activateHardBossSecondPhase(state, defender)) {
      state.megaEvolutionCooldown = HARD_SECOND_PHASE_PAUSE_SECONDS;
      state.battleCooldown = 0;
      return;
    }
  }

  state.battleCooldown = state.enemy.isBoss ? 1.45 : 1.25;
}

export function updateRecovery(state, deltaSeconds) {
  state.recoveryCooldown -= deltaSeconds;
  if (state.recoveryCooldown > 0) return;

  clearMegaTransformationPause(state);
  deactivateAllMegaEvolutions(state);
  state.team.forEach((pokemon) => { pokemon.hp = pokemon.maxHp; });
  state.activeTeamIndex = 0;
  state.mode = "exploring";
  state.enemy = null;
  state.battleParticipants = [];
  state.exploration = 0;
  state.nextEncounterAt = randomEncounterTarget();
  addLog(state, "A equipe se recuperou e recomeçou a rota desde o início.");
}
