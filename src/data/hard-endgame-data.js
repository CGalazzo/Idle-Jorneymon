export const HARD_SHINY_CHARM_CHANCE = 1 / 128;

export const HARD_SHOP_ITEMS = [
  {
    id: "master-ball",
    name: "Master Ball",
    description: "Captura garantida. Só é possível guardar uma por vez.",
    emblemPrice: 60,
    spriteId: "master-ball",
    repeatable: true
  },
  {
    id: "hard-shiny-charm",
    name: "Amuleto Shiny Hard",
    description: "Melhoria permanente: aumenta a chance shiny do Modo Hard de 1/160 para 1/128.",
    emblemPrice: 150,
    spriteId: "shiny-charm",
    permanent: true
  },
  {
    id: "hard-champion-badge",
    name: "Insígnia do Campeão Hard",
    description: "Recompensa cosmética permanente que identifica sua jornada como Campeão Hard.",
    emblemPrice: 100,
    spriteId: "mark-charm",
    permanent: true
  }
];

export const HARD_CHALLENGE_ROTATION_MS = 6 * 60 * 60 * 1000;

// Apenas Lendários verdadeiros que já pertencem ao conteúdo atual do jogo.
// Míticos e Ultra Beasts ficam fora desta rotação.
export const HARD_CHALLENGE_LEGENDARY_IDS = [
  150, 243, 244, 245, 250,
  380, 381, 382, 383, 384,
  483, 484, 639, 791, 792,
  890, 1008
];

export const HARD_CHALLENGE_SLOTS = [
  {
    id: "legendary-1",
    label: "DESAFIO LENDÁRIO I",
    statMultiplier: 1.75,
    reward: 35
  },
  {
    id: "legendary-2",
    label: "DESAFIO LENDÁRIO II",
    statMultiplier: 1.9,
    reward: 50
  },
  {
    id: "legendary-3",
    label: "DESAFIO LENDÁRIO III",
    statMultiplier: 2.1,
    reward: 80
  }
];

// Mantido apenas para saves que tenham uma batalha da versão antiga em andamento.
export const HARD_CHALLENGES = [
  {
    id: "mega-mewtwo",
    name: "Experimento Supremo",
    subtitle: "MEGA MEWTWO",
    description: "Enfrente um Mewtwo nível 100 com Mega Evolução automática e Fase 2.",
    speciesId: 150,
    statMultiplier: 1.75,
    reward: 35,
    firstReward: 35,
    repeatReward: 8,
    shiny: false,
    legacy: true
  },
  {
    id: "sky-tyrant",
    name: "Tirano dos Céus",
    subtitle: "MEGA RAYQUAZA SHINY",
    description: "Uma batalha contra Rayquaza shiny nível 100, Mega Evolução e atributos extremos.",
    speciesId: 384,
    statMultiplier: 1.9,
    reward: 50,
    firstReward: 50,
    repeatReward: 12,
    shiny: true,
    legacy: true
  },
  {
    id: "future-champion",
    name: "Campeão do Futuro",
    subtitle: "MIRAIDON",
    description: "O desafio final: Miraidon nível 100 com Fase 2 e o maior bônus de atributos.",
    speciesId: 1008,
    statMultiplier: 2.1,
    reward: 80,
    firstReward: 80,
    repeatReward: 20,
    shiny: false,
    legacy: true
  }
];

export function getHardChallengeCycle(now = Date.now()) {
  const safeNow = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const timezoneOffsetMs = new Date(safeNow).getTimezoneOffset() * 60 * 1000;
  const localTimestamp = safeNow - timezoneOffsetMs;
  const index = Math.floor(localTimestamp / HARD_CHALLENGE_ROTATION_MS);
  const startsAt = (index * HARD_CHALLENGE_ROTATION_MS) + timezoneOffsetMs;
  const endsAt = startsAt + HARD_CHALLENGE_ROTATION_MS;

  return {
    key: String(index),
    index,
    startsAt,
    endsAt
  };
}

export function createInitialHardEndgameState() {
  return {
    emblems: 0,
    totalEmblemsEarned: 0,
    totalEmblemsSpent: 0,
    rewardedRouteKeys: [],
    completedChallengeIds: [],
    rewardedChallengeKeys: [],
    challengeCycleKey: "",
    challengeWins: 0,
    activeChallengeId: null,
    challengeResult: null,
    postGameUnlocked: false,
    shinyCharmOwned: false,
    championBadgeOwned: false
  };
}

export function normalizeHardEndgameState(saved = {}) {
  const base = createInitialHardEndgameState();
  return {
    ...base,
    ...saved,
    emblems: Math.max(0, Math.floor(Number(saved.emblems) || 0)),
    totalEmblemsEarned: Math.max(0, Math.floor(Number(saved.totalEmblemsEarned) || 0)),
    totalEmblemsSpent: Math.max(0, Math.floor(Number(saved.totalEmblemsSpent) || 0)),
    rewardedRouteKeys: [...new Set(Array.isArray(saved.rewardedRouteKeys) ? saved.rewardedRouteKeys.map(String) : [])],
    completedChallengeIds: [...new Set(Array.isArray(saved.completedChallengeIds) ? saved.completedChallengeIds.map(String) : [])],
    rewardedChallengeKeys: [...new Set(Array.isArray(saved.rewardedChallengeKeys) ? saved.rewardedChallengeKeys.map(String) : [])].slice(-120),
    challengeCycleKey: saved.challengeCycleKey ? String(saved.challengeCycleKey) : "",
    challengeWins: Math.max(0, Math.floor(Number(saved.challengeWins) || 0)),
    activeChallengeId: saved.activeChallengeId ? String(saved.activeChallengeId) : null,
    challengeResult: saved.challengeResult && typeof saved.challengeResult === "object" ? { ...saved.challengeResult } : null,
    postGameUnlocked: Boolean(saved.postGameUnlocked),
    shinyCharmOwned: Boolean(saved.shinyCharmOwned),
    championBadgeOwned: Boolean(saved.championBadgeOwned)
  };
}

export function getHardShopItem(itemId) {
  return HARD_SHOP_ITEMS.find((item) => item.id === String(itemId || "")) || null;
}

export function getHardChallenge(challengeId) {
  return HARD_CHALLENGES.find((challenge) => challenge.id === String(challengeId || "")) || null;
}
