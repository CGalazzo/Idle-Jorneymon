export const BALL_DEFINITIONS = [
  {
    id: "poke-ball",
    name: "Poké Bola",
    shortName: "Poké Bola",
    bonus: 5,
    price: 60,
    unlockEnvironmentId: "bosque",
    unlockLabel: "Disponível desde o Bosque"
  },
  {
    id: "great-ball",
    name: "Grande Bola",
    shortName: "Grande Bola",
    bonus: 12,
    price: 180,
    unlockEnvironmentId: "caverna",
    unlockLabel: "Liberada ao chegar à Caverna"
  },
  {
    id: "ultra-ball",
    name: "Ultra Bola",
    shortName: "Ultra Bola",
    bonus: 25,
    price: 500,
    unlockEnvironmentId: "caverna-gelo",
    unlockLabel: "Liberada ao chegar à Caverna de Gelo"
  },
  {
    id: "master-ball",
    name: "Master Ball",
    shortName: "Master Ball",
    bonus: 100,
    price: 0,
    guaranteed: true,
    maxStock: 1,
    available: true,
    hardExclusive: true,
    unlockEnvironmentId: "elite-4",
    unlockLabel: "Comprada exclusivamente com Emblemas Hard"
  }
];

export const EXP_SHARE_UPGRADES = [
  {
    level: 1,
    name: "Exp. Share I",
    multiplier: 0.65,
    price: 2500,
    unlockEnvironmentId: "montanhas",
    unlockLabel: "Liberado ao chegar às Montanhas"
  },
  {
    level: 2,
    name: "Exp. Share II",
    multiplier: 0.8,
    price: 6000,
    unlockEnvironmentId: "torre-fantasma",
    unlockLabel: "Liberado ao chegar à Torre Fantasma"
  },
  {
    level: 3,
    name: "Exp. Share III",
    multiplier: 1,
    price: 12000,
    unlockEnvironmentId: "elite-4",
    unlockLabel: "Liberado ao chegar à Elite 4"
  }
];

export const BASE_PASSIVE_XP_MULTIPLIER = 0.5;

const MEGA_Z_COMPENSATION_COINS = 30000;
const REMOVED_MEGA_Z_REFUNDS = {
  "lucarionite-z": 11000,
  "garchompite-z": 14000
};
const REMOVED_MEGA_Z_IDS = new Set(Object.keys(REMOVED_MEGA_Z_REFUNDS));

export function getExpShareMultiplier(level = 0) {
  const upgrade = EXP_SHARE_UPGRADES.find((entry) => entry.level === Number(level));
  return upgrade?.multiplier ?? BASE_PASSIVE_XP_MULTIPLIER;
}

export function createInitialShopState() {
  return {
    coins: 0,
    totalCoinsEarned: 0,
    totalCoinsSpent: 0,
    balls: Object.fromEntries(BALL_DEFINITIONS.map((ball) => [ball.id, 0])),
    expShareLevel: 0,
    ownedMegaStones: [],
    equippedMegaStoneId: null,
    equippedMegaPokemonUid: null,
    ownedFormItems: [],
    equippedFormItems: {},
    purchaseRepairApplied: true,
    legacyRefundCoins: 0,
    testCoinGrantApplied: true,
    megaZCompensationApplied: true,
    megaZCompensationCoins: 0,
    megaZRefundCoins: 0
  };
}

export function normalizeShopState(saved = {}) {
  const base = createInitialShopState();
  const balls = { ...base.balls };

  BALL_DEFINITIONS.forEach((ball) => {
    const amount = Math.max(0, Math.floor(Number(saved.balls?.[ball.id]) || 0));
    balls[ball.id] = ball.maxStock ? Math.min(ball.maxStock, amount) : amount;
  });

  const normalizedCoins = Math.max(0, Math.floor(Number(saved.coins) || 0));
  const normalizedSpent = Math.max(0, Math.floor(Number(saved.totalCoinsSpent) || 0));
  const hasRepairMarker = Object.prototype.hasOwnProperty.call(saved, "purchaseRepairApplied");
  const repairAlreadyApplied = hasRepairMarker && saved.purchaseRepairApplied === true;
  const legacyRefund = repairAlreadyApplied ? 0 : normalizedSpent;

  const compensationAlreadyApplied = saved.megaZCompensationApplied === true;
  const ownedMegaStones = [...new Set(
    Array.isArray(saved.ownedMegaStones) ? saved.ownedMegaStones.map(String) : []
  )];
  const removedOwnedMegaZIds = compensationAlreadyApplied
    ? []
    : ownedMegaStones.filter((stoneId) => REMOVED_MEGA_Z_IDS.has(stoneId));
  const megaZRefund = removedOwnedMegaZIds.reduce(
    (total, stoneId) => total + (REMOVED_MEGA_Z_REFUNDS[stoneId] || 0),
    0
  );
  const compensationCoins = compensationAlreadyApplied ? 0 : MEGA_Z_COMPENSATION_COINS;
  const equippedMegaStoneId = saved.equippedMegaStoneId ? String(saved.equippedMegaStoneId) : null;

  return {
    ...base,
    ...saved,
    coins: normalizedCoins + legacyRefund + compensationCoins + megaZRefund,
    totalCoinsEarned: Math.max(0, Math.floor(Number(saved.totalCoinsEarned) || 0)) + compensationCoins,
    totalCoinsSpent: Math.max(0, (repairAlreadyApplied ? normalizedSpent : 0) - megaZRefund),
    balls,
    expShareLevel: Math.max(0, Math.min(3, Math.floor(Number(saved.expShareLevel) || 0))),
    ownedMegaStones: ownedMegaStones.filter((stoneId) => !REMOVED_MEGA_Z_IDS.has(stoneId)),
    equippedMegaStoneId: REMOVED_MEGA_Z_IDS.has(equippedMegaStoneId) ? null : equippedMegaStoneId,
    equippedMegaPokemonUid: REMOVED_MEGA_Z_IDS.has(equippedMegaStoneId)
      ? null
      : (saved.equippedMegaPokemonUid ? String(saved.equippedMegaPokemonUid) : null),
    ownedFormItems: [...new Set(Array.isArray(saved.ownedFormItems) ? saved.ownedFormItems.map(String) : [])],
    equippedFormItems: Object.fromEntries(
      Object.entries(saved.equippedFormItems && typeof saved.equippedFormItems === "object" ? saved.equippedFormItems : {})
        .map(([itemId, pokemonUid]) => [String(itemId), String(pokemonUid || "")])
        .filter(([, pokemonUid]) => pokemonUid)
    ),
    purchaseRepairApplied: true,
    legacyRefundCoins: Math.max(0, Math.floor(Number(saved.legacyRefundCoins) || 0)) + legacyRefund,
    testCoinGrantApplied: true,
    megaZCompensationApplied: true,
    megaZCompensationCoins: Math.max(0, Math.floor(Number(saved.megaZCompensationCoins) || 0)) + compensationCoins,
    megaZRefundCoins: Math.max(0, Math.floor(Number(saved.megaZRefundCoins) || 0)) + megaZRefund
  };
}
