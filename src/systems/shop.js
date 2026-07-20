import { addLog } from "../core/game-state.js";
import { MEGA_STONES, getMegaStone } from "../data/mega-data.js";
import {
  BALL_DEFINITIONS,
  EXP_SHARE_UPGRADES,
  normalizeShopState
} from "../data/shop-data.js";
import { ENVIRONMENTS } from "../data/worlds.js";

function ensureShopState(state) {
  state.shop = normalizeShopState(state.shop);
  return state.shop;
}

function mainJourney(state) {
  return state.revisit?.active && state.revisit.originJourney
    ? state.revisit.originJourney
    : state.journey;
}

function currentProgressWorldIndex(state) {
  const journey = mainJourney(state);
  if (journey?.complete) return ENVIRONMENTS.length - 1;
  return Math.max(0, Math.min(ENVIRONMENTS.length - 1, Number(journey?.worldIndex) || 0));
}

function environmentIndex(environmentId) {
  return ENVIRONMENTS.findIndex((environment) => environment.id === environmentId);
}

function globalRouteIndex(worldIndex, routeIndex) {
  return ENVIRONMENTS
    .slice(0, Math.max(0, Number(worldIndex) || 0))
    .reduce((total, environment) => total + environment.routes.length, 0)
    + Math.max(0, Number(routeIndex) || 0);
}

function canAfford(shop, price) {
  return shop.coins >= Number(price);
}

function spendCoins(shop, price) {
  const amount = Math.max(0, Math.floor(Number(price) || 0));
  if (shop.coins < amount) return false;
  shop.coins -= amount;
  shop.totalCoinsSpent += amount;
  return true;
}

export function getBallDefinition(ballId) {
  return BALL_DEFINITIONS.find((ball) => ball.id === String(ballId || "")) || null;
}

export function isBallUnlocked(state, ballId) {
  const ball = getBallDefinition(ballId);
  if (!ball || ball.available === false) return false;
  const requiredIndex = environmentIndex(ball.unlockEnvironmentId);
  return requiredIndex >= 0 && currentProgressWorldIndex(state) >= requiredIndex;
}

export function isExpShareUnlocked(state, level) {
  const upgrade = EXP_SHARE_UPGRADES.find((entry) => entry.level === Number(level));
  if (!upgrade) return false;
  const requiredIndex = environmentIndex(upgrade.unlockEnvironmentId);
  return requiredIndex >= 0 && currentProgressWorldIndex(state) >= requiredIndex;
}

export function isMegaShopUnlocked(state) {
  return currentProgressWorldIndex(state) >= environmentIndex("planalto-indigo");
}

export function isLegendaryMegaUnlocked(state) {
  return currentProgressWorldIndex(state) >= environmentIndex("elite-4");
}

export function isSpeciesOwned(state, speciesId) {
  const id = Number(speciesId);
  if ((Number(state.collection?.[id]?.count) || 0) > 0) return true;
  return [...(state.team || []), ...(state.storage || [])].some((pokemon) => Number(pokemon.id) === id);
}

export function getVisibleMegaStones(state) {
  return MEGA_STONES.filter((stone) => isSpeciesOwned(state, stone.baseSpeciesId));
}

export function buyBall(state, ballId) {
  const ball = getBallDefinition(ballId);
  const shop = ensureShopState(state);
  if (!ball || ball.available === false || !isBallUnlocked(state, ball.id)) return false;
  if (ball.maxStock && shop.balls[ball.id] >= ball.maxStock) return false;
  if (!canAfford(shop, ball.price) || !spendCoins(shop, ball.price)) return false;

  shop.balls[ball.id] = (shop.balls[ball.id] || 0) + 1;
  addLog(state, `${ball.name} comprada por ${ball.price} PokéCoins. Inventário: ${shop.balls[ball.id]}.`);
  return true;
}

export function buyExpShare(state, level) {
  const shop = ensureShopState(state);
  const upgrade = EXP_SHARE_UPGRADES.find((entry) => entry.level === Number(level));
  if (!upgrade || upgrade.level !== shop.expShareLevel + 1) return false;
  if (!isExpShareUnlocked(state, upgrade.level)) return false;
  if (!canAfford(shop, upgrade.price) || !spendCoins(shop, upgrade.price)) return false;

  shop.expShareLevel = upgrade.level;
  addLog(state, `${upgrade.name} foi comprado e está ativo. Pokémon que não lutaram agora recebem ${Math.round(upgrade.multiplier * 100)}% do XP.`);
  return true;
}

export function buyMegaStone(state, stoneId) {
  const shop = ensureShopState(state);
  const stone = getMegaStone(stoneId);
  if (!stone || !isMegaShopUnlocked(state) || !isSpeciesOwned(state, stone.baseSpeciesId)) return false;
  if (stone.legendary && !isLegendaryMegaUnlocked(state)) return false;
  if (shop.ownedMegaStones.includes(stone.id)) return false;
  if (!canAfford(shop, stone.price) || !spendCoins(shop, stone.price)) return false;

  shop.ownedMegaStones.push(stone.id);
  addLog(state, `${stone.name} foi comprada e adicionada aos Itens. Equipe-a em ${stone.baseName} na tela da equipe.`);
  return true;
}

export function consumeBall(state, ballId) {
  const ball = getBallDefinition(ballId);
  const shop = ensureShopState(state);
  if (!ball || ball.available === false || (shop.balls[ball.id] || 0) <= 0) return false;
  shop.balls[ball.id] -= 1;
  return true;
}

export function grantBattleCoins(state, defeated) {
  const shop = ensureShopState(state);
  const worldIndex = Math.max(0, Number(state.journey?.worldIndex) || 0);
  const routeIndex = Math.max(0, Number(state.journey?.routeIndex) || 0);
  const baseReward = 8 + worldIndex * 2;
  const revisiting = Boolean(state.revisit?.active);

  let multiplier = 1;
  if (defeated?.isBoss) multiplier = defeated.bossType === "final" ? 15 : 8;

  const revisitMultiplier = revisiting ? (defeated?.isBoss ? 0.5 : 0.35) : 1;
  const battleReward = Math.max(1, Math.round(baseReward * multiplier * revisitMultiplier));
  let routeBonus = 0;

  if (defeated?.isBoss && !revisiting) {
    const expectedFirstClear = Math.max(0, Number(state.journey?.completedRoutes) || 0);
    if (globalRouteIndex(worldIndex, routeIndex) === expectedFirstClear) {
      routeBonus = 100 + worldIndex * 40;
    }
  }

  const total = battleReward + routeBonus;
  shop.coins += total;
  shop.totalCoinsEarned += total;

  const revisitCopy = revisiting ? " na revisita" : "";
  addLog(state, `Você ganhou ${battleReward} PokéCoins${revisitCopy}.${routeBonus ? ` Bônus de primeira conclusão: +${routeBonus}.` : ""}`);
  return { battleReward, routeBonus, total };
}
