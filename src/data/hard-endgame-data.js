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

export const HARD_CHALLENGES = [
  {
    id: "mega-mewtwo",
    name: "Experimento Supremo",
    subtitle: "MEGA MEWTWO",
    description: "Enfrente um Mewtwo nível 100 com Mega Evolução automática e Fase 2.",
    speciesId: 150,
    statMultiplier: 1.75,
    firstReward: 35,
    repeatReward: 8,
    shiny: false
  },
  {
    id: "sky-tyrant",
    name: "Tirano dos Céus",
    subtitle: "MEGA RAYQUAZA SHINY",
    description: "Uma batalha contra Rayquaza shiny nível 100, Mega Evolução e atributos extremos.",
    speciesId: 384,
    statMultiplier: 1.9,
    firstReward: 50,
    repeatReward: 12,
    shiny: true
  },
  {
    id: "future-champion",
    name: "Campeão do Futuro",
    subtitle: "MIRAIDON",
    description: "O desafio final: Miraidon nível 100 com Fase 2 e o maior bônus de atributos.",
    speciesId: 1008,
    statMultiplier: 2.1,
    firstReward: 80,
    repeatReward: 20,
    shiny: false
  }
];

export function createInitialHardEndgameState() {
  return {
    emblems: 0,
    totalEmblemsEarned: 0,
    totalEmblemsSpent: 0,
    rewardedRouteKeys: [],
    completedChallengeIds: [],
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
