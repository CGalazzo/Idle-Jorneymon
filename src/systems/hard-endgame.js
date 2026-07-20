import { addLog, randomEncounterTarget } from "../core/game-state.js";
import {
  HARD_CHALLENGES,
  getHardChallenge,
  getHardShopItem,
  normalizeHardEndgameState
} from "../data/hard-endgame-data.js";
import { POKEDEX_SPECIES, createInstanceId, normalizePokemonInstance } from "../data/pokemon.js";
import { normalizeShopState } from "../data/shop-data.js";
import { ENVIRONMENTS, TOTAL_ROUTES } from "../data/worlds.js";

const MASTER_BALL_STOCK_LIMIT = 1;
const CHALLENGE_LEVEL = 100;
const CHALLENGE_IV = 31;

function hardJourney(state) {
  if (state.campaignMode === "hard") return state.journey;
  return state.campaigns?.hard?.journey;
}

function routeEmblemReward(route, campaignComplete = false) {
  let reward = 1 + (route.bossType === "final" ? 5 : 2);
  if (route.routeIndex === route.environment.routes.length - 1) reward += 5;
  if (campaignComplete) reward += 25;
  return reward;
}

function backfillHardRouteRewards(state, hardEndgame) {
  const journey = hardJourney(state);
  const completedRoutes = Math.max(0, Math.min(TOTAL_ROUTES, Number(journey?.completedRoutes) || 0));
  if (!completedRoutes) return 0;

  let globalIndex = 0;
  let reward = 0;
  for (let worldIndex = 0; worldIndex < ENVIRONMENTS.length; worldIndex += 1) {
    const environment = ENVIRONMENTS[worldIndex];
    for (let routeIndex = 0; routeIndex < environment.routes.length; routeIndex += 1) {
      if (globalIndex >= completedRoutes) break;
      const route = {
        ...environment.routes[routeIndex],
        environment,
        worldIndex,
        routeIndex
      };
      const routeKey = `${worldIndex}:${routeIndex}`;
      if (!hardEndgame.rewardedRouteKeys.includes(routeKey)) {
        hardEndgame.rewardedRouteKeys.push(routeKey);
        const finalCompletion = Boolean(journey?.complete && globalIndex === TOTAL_ROUTES - 1);
        reward += routeEmblemReward(route, finalCompletion);
      }
      globalIndex += 1;
    }
    if (globalIndex >= completedRoutes) break;
  }

  if (reward > 0) {
    hardEndgame.emblems += reward;
    hardEndgame.totalEmblemsEarned += reward;
    if (journey?.complete) hardEndgame.postGameUnlocked = true;
    addLog(state, `Recompensa retroativa: +${reward} Emblemas Hard pelas rotas já concluídas.`);
  }
  return reward;
}

function ensureHardEndgameState(state) {
  const target = state.hardEndgame && typeof state.hardEndgame === "object"
    ? state.hardEndgame
    : {};
  Object.assign(target, normalizeHardEndgameState(target));
  state.hardEndgame = target;
  backfillHardRouteRewards(state, target);
  return target;
}

function ensureShopState(state) {
  state.shop = normalizeShopState(state.shop);
  return state.shop;
}

function hardCampaignComplete(state) {
  if (state.campaignMode === "hard" && state.journey?.complete) return true;
  return Boolean(state.campaigns?.hard?.journey?.complete);
}

function grantEmblems(state, amount, reason = "") {
  const hardEndgame = ensureHardEndgameState(state);
  const reward = Math.max(0, Math.floor(Number(amount) || 0));
  if (!reward) return 0;
  hardEndgame.emblems += reward;
  hardEndgame.totalEmblemsEarned += reward;
  addLog(state, `Você recebeu ${reward} Emblemas Hard${reason ? ` por ${reason}` : ""}.`);
  return reward;
}

function spendEmblems(state, amount) {
  const hardEndgame = ensureHardEndgameState(state);
  const price = Math.max(0, Math.floor(Number(amount) || 0));
  if (hardEndgame.emblems < price) return false;
  hardEndgame.emblems -= price;
  hardEndgame.totalEmblemsSpent += price;
  return true;
}

export function grantHardRouteEmblems(state, route, { completedEnvironment = false, campaignComplete = false } = {}) {
  if (state.campaignMode !== "hard" || state.revisit?.active || !route) return 0;
  const hardEndgame = ensureHardEndgameState(state);
  const routeKey = `${route.worldIndex}:${route.routeIndex}`;
  if (hardEndgame.rewardedRouteKeys.includes(routeKey)) return 0;

  hardEndgame.rewardedRouteKeys.push(routeKey);
  let reward = 1;
  reward += route.bossType === "final" ? 5 : 2;
  if (completedEnvironment) reward += 5;
  if (campaignComplete) {
    reward += 25;
    hardEndgame.postGameUnlocked = true;
  }

  return grantEmblems(state, reward, campaignComplete
    ? "concluir a última rota do Modo Hard"
    : `concluir ${route.environment.name} · Rota ${route.routeNumber}`);
}

export function buyHardShopItem(state, itemId) {
  if (!state.hardModeUnlocked) return false;
  const item = getHardShopItem(itemId);
  const hardEndgame = ensureHardEndgameState(state);
  const shop = ensureShopState(state);
  if (!item) return false;

  if (item.id === "master-ball") {
    if ((shop.balls?.["master-ball"] || 0) >= MASTER_BALL_STOCK_LIMIT) return false;
    if (!spendEmblems(state, item.emblemPrice)) return false;
    shop.balls["master-ball"] = (shop.balls["master-ball"] || 0) + 1;
    addLog(state, "Master Ball comprada com Emblemas Hard e enviada para ITENS.");
    return true;
  }

  if (item.id === "hard-shiny-charm") {
    if (hardEndgame.shinyCharmOwned || !spendEmblems(state, item.emblemPrice)) return false;
    hardEndgame.shinyCharmOwned = true;
    addLog(state, "Amuleto Shiny Hard adquirido. A chance shiny do Modo Hard agora é 1/128.");
    return true;
  }

  if (item.id === "hard-champion-badge") {
    if (hardEndgame.championBadgeOwned || !spendEmblems(state, item.emblemPrice)) return false;
    hardEndgame.championBadgeOwned = true;
    addLog(state, "Insígnia do Campeão Hard adquirida e equipada no perfil da jornada.");
    return true;
  }

  return false;
}

function challengeTemplate(challenge) {
  return POKEDEX_SPECIES.find((pokemon) => Number(pokemon.id) === Number(challenge.speciesId));
}

function createChallengeEnemy(challenge) {
  const template = challengeTemplate(challenge);
  if (!template) return null;
  const pokemon = normalizePokemonInstance({
    ...template,
    uid: createInstanceId(template.id),
    level: CHALLENGE_LEVEL,
    iv: CHALLENGE_IV,
    isShiny: Boolean(challenge.shiny),
    rarity: template.rarity === "mythical" ? "mythical" : "legendary",
    hp: Number.MAX_SAFE_INTEGER,
    maxHp: Number.MAX_SAFE_INTEGER
  }, { heal: true });

  ["maxHp", "attack", "defense", "specialAttack", "specialDefense", "speed"].forEach((key) => {
    pokemon[key] = Math.max(1, Math.round((Number(pokemon[key]) || 1) * challenge.statMultiplier));
  });
  pokemon.hp = pokemon.maxHp;

  return {
    ...pokemon,
    isBoss: true,
    bossType: "final",
    encounterRole: "hard-challenge",
    hardModeEncounter: true,
    hardStatMultiplier: challenge.statMultiplier,
    hardChallengeBoss: true,
    hardChallengeId: challenge.id,
    xpReward: 1600,
    playerLevelAtEncounter: CHALLENGE_LEVEL
  };
}

export function startHardChallenge(state, challengeId) {
  const challenge = getHardChallenge(challengeId);
  if (!challenge || state.campaignMode !== "hard" || !hardCampaignComplete(state)) return false;
  const enemy = createChallengeEnemy(challenge);
  if (!enemy) return false;

  const hardEndgame = ensureHardEndgameState(state);
  hardEndgame.postGameUnlocked = true;
  hardEndgame.activeChallengeId = challenge.id;
  hardEndgame.challengeResult = null;

  state.team.forEach((pokemon) => { pokemon.hp = pokemon.maxHp; });
  state.activeTeamIndex = Math.max(0, state.team.findIndex((pokemon) => pokemon.hp > 0));
  state.mode = "battle";
  state.enemy = enemy;
  state.pendingRouteAdvance = false;
  state.captureOffer = null;
  state.approachProgress = 0;
  state.exploration = 0;
  state.battleParticipants = [];
  state.battleCooldown = 0;
  state.megaEvolutionCooldown = 0;
  addLog(state, `Desafio Hard iniciado: ${challenge.name}.`);
  return true;
}

export function completeHardChallenge(state, defeated) {
  const hardEndgame = ensureHardEndgameState(state);
  const challenge = getHardChallenge(defeated?.hardChallengeId || hardEndgame.activeChallengeId);
  if (!challenge) return false;

  const firstCompletion = !hardEndgame.completedChallengeIds.includes(challenge.id);
  if (firstCompletion) hardEndgame.completedChallengeIds.push(challenge.id);
  hardEndgame.challengeWins += 1;
  const reward = firstCompletion ? challenge.firstReward : challenge.repeatReward;
  grantEmblems(state, reward, firstCompletion ? `vencer ${challenge.name} pela primeira vez` : `repetir ${challenge.name}`);

  hardEndgame.activeChallengeId = null;
  hardEndgame.challengeResult = {
    challengeId: challenge.id,
    name: challenge.name,
    reward,
    firstCompletion,
    completedAt: Date.now()
  };

  state.team.forEach((pokemon) => { pokemon.hp = pokemon.maxHp; });
  state.activeTeamIndex = Math.max(0, state.team.findIndex((pokemon) => pokemon.hp > 0));
  state.mode = "exploring";
  state.enemy = null;
  state.pendingRouteAdvance = false;
  state.captureOffer = null;
  state.approachProgress = 0;
  state.exploration = 0;
  state.nextEncounterAt = randomEncounterTarget();
  state.battleParticipants = [];
  state.battleCooldown = 0;
  state.megaEvolutionCooldown = 0;
  return true;
}

export function clearHardChallengeResult(state) {
  const hardEndgame = ensureHardEndgameState(state);
  hardEndgame.challengeResult = null;
}

export function getHardEndgameStatus(state) {
  const hardEndgame = ensureHardEndgameState(state);
  return {
    ...hardEndgame,
    hardCampaignComplete: hardCampaignComplete(state),
    challenges: HARD_CHALLENGES.map((challenge) => ({
      ...challenge,
      completed: hardEndgame.completedChallengeIds.includes(challenge.id)
    }))
  };
}
