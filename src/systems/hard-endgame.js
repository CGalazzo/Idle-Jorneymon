import { addLog, randomEncounterTarget } from "../core/game-state.js";
import {
  HARD_CHALLENGE_LEGENDARY_IDS,
  HARD_CHALLENGE_SLOTS,
  getHardChallenge,
  getHardChallengeCycle,
  getHardShopItem,
  normalizeHardEndgameState
} from "../data/hard-endgame-data.js";
import { POKEDEX_SPECIES, createInstanceId, normalizePokemonInstance } from "../data/pokemon.js";
import { normalizeShopState } from "../data/shop-data.js";
import { ENVIRONMENTS, TOTAL_ROUTES } from "../data/worlds.js";

const MASTER_BALL_STOCK_LIMIT = 1;
const CHALLENGE_LEVEL = 100;
const CHALLENGE_IV = 31;
const CHALLENGES_PER_ROTATION = 3;

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

function ensureChallengeRotation(state, hardEndgame, now = Date.now()) {
  const cycle = getHardChallengeCycle(now);
  if (hardEndgame.challengeCycleKey !== cycle.key) {
    hardEndgame.challengeCycleKey = cycle.key;
    hardEndgame.completedChallengeIds = [];
    if (!state.enemy?.hardChallengeBoss) hardEndgame.activeChallengeId = null;
  }
  return cycle;
}

function ensureHardEndgameState(state, now = Date.now()) {
  const target = state.hardEndgame && typeof state.hardEndgame === "object"
    ? state.hardEndgame
    : {};
  Object.assign(target, normalizeHardEndgameState(target));
  state.hardEndgame = target;
  backfillHardRouteRewards(state, target);
  ensureChallengeRotation(state, target, now);
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

function seededRandom(seed) {
  let value = (Number(seed) || 0) >>> 0;
  return () => {
    value = (value + 0x6D2B79F5) >>> 0;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(items, seed) {
  const result = [...items];
  const random = seededRandom(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

function legendaryChallengePool() {
  const byId = new Map(POKEDEX_SPECIES.map((pokemon) => [Number(pokemon.id), pokemon]));
  const curated = HARD_CHALLENGE_LEGENDARY_IDS
    .map((id) => byId.get(Number(id)))
    .filter(Boolean);

  if (curated.length >= CHALLENGES_PER_ROTATION * 2) return curated;

  const supplements = POKEDEX_SPECIES.filter((pokemon) => (
    pokemon.rarity === "legendary"
    && !curated.some((entry) => Number(entry.id) === Number(pokemon.id))
  ));
  return [...curated, ...supplements];
}

function legendaryTemplatesForCycle(cycle) {
  const pool = legendaryChallengePool();
  if (!pool.length) return [];

  const currentOrder = shuffled(pool, cycle.index ^ 0x45d9f3b);
  const previousOrder = shuffled(pool, (cycle.index - 1) ^ 0x45d9f3b);
  const previousIds = new Set(
    previousOrder.slice(0, CHALLENGES_PER_ROTATION).map((pokemon) => Number(pokemon.id))
  );

  const selected = currentOrder
    .filter((pokemon) => !previousIds.has(Number(pokemon.id)))
    .slice(0, CHALLENGES_PER_ROTATION);

  if (selected.length < CHALLENGES_PER_ROTATION) {
    currentOrder.forEach((pokemon) => {
      if (selected.length >= CHALLENGES_PER_ROTATION) return;
      if (!selected.some((entry) => Number(entry.id) === Number(pokemon.id))) selected.push(pokemon);
    });
  }

  return selected;
}

function multiplierLabel(multiplier) {
  return Number(multiplier).toFixed(2).replace(/0$/, "").replace(".", ",");
}

export function getRotatingHardChallenges(now = Date.now()) {
  const cycle = getHardChallengeCycle(now);
  const templates = legendaryTemplatesForCycle(cycle);

  return HARD_CHALLENGE_SLOTS.map((slot, index) => {
    const template = templates[index];
    if (!template) return null;
    return {
      id: `${cycle.key}:${slot.id}:${template.id}`,
      cycleKey: cycle.key,
      slotId: slot.id,
      name: template.name,
      subtitle: `${slot.label} · NÍVEL 100`,
      description: `${template.name} com IV máximo, Fase 2 e atributos x${multiplierLabel(slot.statMultiplier)}. Mega Evolução automática quando compatível.`,
      speciesId: Number(template.id),
      statMultiplier: slot.statMultiplier,
      reward: slot.reward,
      shiny: false
    };
  }).filter(Boolean);
}

function currentHardChallenge(challengeId, now = Date.now()) {
  return getRotatingHardChallenges(now)
    .find((challenge) => challenge.id === String(challengeId || "")) || null;
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
    rarity: "legendary",
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
    hardChallengeData: {
      id: challenge.id,
      cycleKey: challenge.cycleKey || "legacy",
      name: challenge.name,
      speciesId: challenge.speciesId,
      statMultiplier: challenge.statMultiplier,
      reward: Math.max(0, Number(challenge.reward ?? challenge.firstReward) || 0),
      shiny: Boolean(challenge.shiny)
    },
    xpReward: 1600,
    playerLevelAtEncounter: CHALLENGE_LEVEL
  };
}

export function startHardChallenge(state, challengeId, now = Date.now()) {
  const challenge = currentHardChallenge(challengeId, now);
  if (!challenge || state.campaignMode !== "hard" || !hardCampaignComplete(state)) return false;

  const hardEndgame = ensureHardEndgameState(state, now);
  if (hardEndgame.completedChallengeIds.includes(challenge.id)) return false;

  const enemy = createChallengeEnemy(challenge);
  if (!enemy) return false;

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
  addLog(state, `Desafio Hard iniciado: ${challenge.name}. Recompensa: +${challenge.reward} Emblemas Hard.`);
  return true;
}

function challengeForCompletion(defeated, hardEndgame, now = Date.now()) {
  if (defeated?.hardChallengeData?.id) return { ...defeated.hardChallengeData };

  const challengeId = defeated?.hardChallengeId || hardEndgame.activeChallengeId;
  const rotating = currentHardChallenge(challengeId, now);
  if (rotating) return rotating;

  const legacy = getHardChallenge(challengeId);
  if (!legacy) return null;
  return {
    ...legacy,
    cycleKey: "legacy",
    reward: Math.max(0, Number(legacy.reward ?? legacy.firstReward) || 0)
  };
}

export function completeHardChallenge(state, defeated, now = Date.now()) {
  const hardEndgame = ensureHardEndgameState(state, now);
  const cycle = getHardChallengeCycle(now);
  const challenge = challengeForCompletion(defeated, hardEndgame, now);
  if (!challenge) return false;

  const alreadyRewarded = hardEndgame.rewardedChallengeKeys.includes(challenge.id);
  const reward = alreadyRewarded ? 0 : Math.max(0, Math.floor(Number(challenge.reward) || 0));

  if (!alreadyRewarded) {
    hardEndgame.rewardedChallengeKeys.push(challenge.id);
    hardEndgame.rewardedChallengeKeys = hardEndgame.rewardedChallengeKeys.slice(-120);
    hardEndgame.challengeWins += 1;
    grantEmblems(state, reward, `vencer ${challenge.name} nesta rotação`);
  }

  if (challenge.cycleKey === cycle.key && !hardEndgame.completedChallengeIds.includes(challenge.id)) {
    hardEndgame.completedChallengeIds.push(challenge.id);
  }

  hardEndgame.activeChallengeId = null;
  hardEndgame.challengeResult = {
    challengeId: challenge.id,
    cycleKey: challenge.cycleKey,
    name: challenge.name,
    reward,
    alreadyRewarded,
    rotationChanged: challenge.cycleKey !== "legacy" && challenge.cycleKey !== cycle.key,
    completedAt: now
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

export function getHardEndgameStatus(state, now = Date.now()) {
  const hardEndgame = ensureHardEndgameState(state, now);
  const cycle = getHardChallengeCycle(now);
  const challenges = getRotatingHardChallenges(now).map((challenge) => ({
    ...challenge,
    completed: hardEndgame.completedChallengeIds.includes(challenge.id)
  }));

  return {
    ...hardEndgame,
    hardCampaignComplete: hardCampaignComplete(state),
    challengeCycleKey: cycle.key,
    rotationStartsAt: cycle.startsAt,
    rotationEndsAt: cycle.endsAt,
    rotationRemainingMs: Math.max(0, cycle.endsAt - now),
    challenges
  };
}
