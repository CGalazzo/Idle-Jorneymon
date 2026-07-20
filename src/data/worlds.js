export const ROUTE_TARGETS = [3, 4, 5, 6, 7, 8, 8, 9, 9, 10];

function species(id, name, type, stage = 1, rarity) {
  const resolvedRarity = rarity || (stage >= 3 ? "rare" : stage === 2 ? "uncommon" : "common");
  return {
    id,
    name,
    type,
    rarity: resolvedRarity,
    stage,
    baseHp: 16 + stage * 7 + (id % 4),
    attack: 6 + stage * 3 + (id % 3),
    defense: 5 + stage * 3 + ((id + 1) % 3),
    xp: 8 + stage * 7
  };
}

const line = (base, middle, final) => [base, middle, final];

function uniqueSpecies(list) {
  return [...new Map(list.map((pokemon) => [pokemon.id, pokemon])).values()];
}

function buildRoutes(lines, finalBoss = null) {
  const bases = lines.map(([base]) => base);
  const routes = [];

  lines.forEach((evolutionLine, lineIndex) => {
    const [base, middle, final] = evolutionLine;
    const nextBase = bases[(lineIndex + 1) % bases.length];
    const secondBase = bases[(lineIndex + 2) % bases.length];

    routes.push({
      encounters: uniqueSpecies([base, nextBase, secondBase]),
      boss: middle,
      bossType: "mini"
    });

    routes.push({
      encounters: uniqueSpecies([base, middle, nextBase, final]),
      boss: final,
      bossType: "mini"
    });
  });

  if (finalBoss) routes[routes.length - 1].boss = finalBoss;
  routes[routes.length - 1].bossType = "final";

  return routes.map((route, routeIndex) => ({
    ...route,
    routeNumber: routeIndex + 1,
    requiredVictories: ROUTE_TARGETS[routeIndex]
  }));
}

function world(id, name, theme, lines, finalBoss = null) {
  const routes = buildRoutes(lines, finalBoss);
  if (id === "bosque") {
    routes[0].boss = lines[2][1];
    routes[2].boss = lines[3][1];
    routes[6].boss = lines[3][2];
    routes[7].boss = species(71, "Victreebel", "Planta/Veneno", 3);
  }

  return {
    id,
    name,
    theme,
    routes
  };
}

const bosqueLines = [
  line(species(10, "Caterpie", "Inseto"), species(11, "Metapod", "Inseto", 2), species(12, "Butterfree", "Inseto/Voador", 3)),
  line(species(13, "Weedle", "Inseto/Veneno"), species(14, "Kakuna", "Inseto/Veneno", 2), species(15, "Beedrill", "Inseto/Veneno", 3)),
  line(species(16, "Pidgey", "Normal/Voador"), species(17, "Pidgeotto", "Normal/Voador", 2), species(18, "Pidgeot", "Normal/Voador", 3)),
  line(species(43, "Oddish", "Planta/Veneno"), species(44, "Gloom", "Planta/Veneno", 2), species(45, "Vileplume", "Planta/Veneno", 3)),
  line(species(1, "Bulbasaur", "Planta/Veneno"), species(2, "Ivysaur", "Planta/Veneno", 2), species(3, "Venusaur", "Planta/Veneno", 3, "epic"))
];

const florestaLines = [
  line(species(265, "Wurmple", "Inseto"), species(266, "Silcoon", "Inseto", 2), species(267, "Beautifly", "Inseto/Voador", 3)),
  line(species(273, "Seedot", "Planta"), species(274, "Nuzleaf", "Planta/Sombrio", 2), species(275, "Shiftry", "Planta/Sombrio", 3)),
  line(species(252, "Treecko", "Planta"), species(253, "Grovyle", "Planta", 2), species(254, "Sceptile", "Planta", 3)),
  line(species(540, "Sewaddle", "Inseto/Planta"), species(541, "Swadloon", "Inseto/Planta", 2), species(542, "Leavanny", "Inseto/Planta", 3)),
  line(species(543, "Venipede", "Inseto/Veneno"), species(544, "Whirlipede", "Inseto/Veneno", 2), species(545, "Scolipede", "Inseto/Veneno", 3, "epic"))
];

const cavernaLines = [
  line(species(41, "Zubat", "Veneno/Voador"), species(42, "Golbat", "Veneno/Voador", 2), species(169, "Crobat", "Veneno/Voador", 3)),
  line(species(74, "Geodude", "Pedra/Terra"), species(75, "Graveler", "Pedra/Terra", 2), species(76, "Golem", "Pedra/Terra", 3)),
  line(species(66, "Machop", "Lutador"), species(67, "Machoke", "Lutador", 2), species(68, "Machamp", "Lutador", 3)),
  line(species(304, "Aron", "Aço/Pedra"), species(305, "Lairon", "Aço/Pedra", 2), species(306, "Aggron", "Aço/Pedra", 3)),
  line(species(524, "Roggenrola", "Pedra"), species(525, "Boldore", "Pedra", 2), species(526, "Gigalith", "Pedra", 3, "epic"))
];

const praiaLines = [
  line(species(60, "Poliwag", "Água"), species(61, "Poliwhirl", "Água", 2), species(62, "Poliwrath", "Água/Lutador", 3)),
  line(species(116, "Horsea", "Água"), species(117, "Seadra", "Água", 2), species(230, "Kingdra", "Água/Dragão", 3)),
  line(species(270, "Lotad", "Água/Planta"), species(271, "Lombre", "Água/Planta", 2), species(272, "Ludicolo", "Água/Planta", 3)),
  line(species(258, "Mudkip", "Água"), species(259, "Marshtomp", "Água/Terra", 2), species(260, "Swampert", "Água/Terra", 3)),
  line(species(7, "Squirtle", "Água"), species(8, "Wartortle", "Água", 2), species(9, "Blastoise", "Água", 3, "epic"))
];

const montanhasLines = [
  line(species(111, "Rhyhorn", "Terra/Pedra"), species(112, "Rhydon", "Terra/Pedra", 2), species(464, "Rhyperior", "Terra/Pedra", 3)),
  line(species(246, "Larvitar", "Pedra/Terra"), species(247, "Pupitar", "Pedra/Terra", 2), species(248, "Tyranitar", "Pedra/Sombrio", 3, "epic")),
  line(species(371, "Bagon", "Dragão"), species(372, "Shelgon", "Dragão", 2), species(373, "Salamence", "Dragão/Voador", 3, "epic")),
  line(species(328, "Trapinch", "Terra"), species(329, "Vibrava", "Terra/Dragão", 2), species(330, "Flygon", "Terra/Dragão", 3)),
  line(species(443, "Gible", "Dragão/Terra"), species(444, "Gabite", "Dragão/Terra", 2), species(445, "Garchomp", "Dragão/Terra", 3, "epic"))
];

const geloFinal = species(144, "Articuno", "Gelo/Voador", 3, "legendary");
const geloLines = [
  line(species(220, "Swinub", "Gelo/Terra"), species(221, "Piloswine", "Gelo/Terra", 2), species(473, "Mamoswine", "Gelo/Terra", 3)),
  line(species(363, "Spheal", "Gelo/Água"), species(364, "Sealeo", "Gelo/Água", 2), species(365, "Walrein", "Gelo/Água", 3)),
  line(species(582, "Vanillite", "Gelo"), species(583, "Vanillish", "Gelo", 2), species(584, "Vanilluxe", "Gelo", 3)),
  line(species(361, "Snorunt", "Gelo"), species(362, "Glalie", "Gelo", 2), species(478, "Froslass", "Gelo/Fantasma", 3)),
  line(species(613, "Cubchoo", "Gelo"), species(614, "Beartic", "Gelo", 2), species(614, "Beartic", "Gelo", 3, "epic"))
];

const fantasmaFinal = species(487, "Giratina", "Fantasma/Dragão", 3, "legendary");
const fantasmaLines = [
  line(species(92, "Gastly", "Fantasma/Veneno"), species(93, "Haunter", "Fantasma/Veneno", 2), species(94, "Gengar", "Fantasma/Veneno", 3, "epic")),
  line(species(355, "Duskull", "Fantasma"), species(356, "Dusclops", "Fantasma", 2), species(477, "Dusknoir", "Fantasma", 3)),
  line(species(607, "Litwick", "Fantasma/Fogo"), species(608, "Lampent", "Fantasma/Fogo", 2), species(609, "Chandelure", "Fantasma/Fogo", 3, "epic")),
  line(species(353, "Shuppet", "Fantasma"), species(354, "Banette", "Fantasma", 2), species(354, "Banette", "Fantasma", 3)),
  line(species(562, "Yamask", "Fantasma"), species(563, "Cofagrigus", "Fantasma", 2), species(563, "Cofagrigus", "Fantasma", 3, "epic"))
];

const vulcaoLines = [
  line(species(218, "Slugma", "Fogo"), species(219, "Magcargo", "Fogo/Pedra", 2), species(219, "Magcargo", "Fogo/Pedra", 3)),
  line(species(322, "Numel", "Fogo/Terra"), species(323, "Camerupt", "Fogo/Terra", 2), species(323, "Camerupt", "Fogo/Terra", 3)),
  line(species(240, "Magby", "Fogo"), species(126, "Magmar", "Fogo", 2), species(467, "Magmortar", "Fogo", 3, "epic")),
  line(species(390, "Chimchar", "Fogo"), species(391, "Monferno", "Fogo/Lutador", 2), species(392, "Infernape", "Fogo/Lutador", 3, "epic")),
  line(species(4, "Charmander", "Fogo"), species(5, "Charmeleon", "Fogo", 2), species(6, "Charizard", "Fogo/Voador", 3, "epic"))
];

const planaltoLines = [
  line(species(147, "Dratini", "Dragão"), species(148, "Dragonair", "Dragão", 2), species(149, "Dragonite", "Dragão/Voador", 3, "epic")),
  line(species(374, "Beldum", "Aço/Psíquico"), species(375, "Metang", "Aço/Psíquico", 2), species(376, "Metagross", "Aço/Psíquico", 3, "epic")),
  line(species(443, "Gible", "Dragão/Terra"), species(444, "Gabite", "Dragão/Terra", 2), species(445, "Garchomp", "Dragão/Terra", 3, "epic")),
  line(species(610, "Axew", "Dragão"), species(611, "Fraxure", "Dragão", 2), species(612, "Haxorus", "Dragão", 3, "epic")),
  line(species(633, "Deino", "Sombrio/Dragão"), species(634, "Zweilous", "Sombrio/Dragão", 2), species(635, "Hydreigon", "Sombrio/Dragão", 3, "epic"))
];

const eliteFinal = species(150, "Mewtwo", "Psíquico", 3, "legendary");
const eliteLines = [
  line(species(74, "Geodude", "Pedra/Terra"), species(75, "Graveler", "Pedra/Terra", 2), species(76, "Golem", "Pedra/Terra", 3)),
  line(species(60, "Poliwag", "Água"), species(61, "Poliwhirl", "Água", 2), species(62, "Poliwrath", "Água/Lutador", 3)),
  line(species(63, "Abra", "Psíquico"), species(64, "Kadabra", "Psíquico", 2), species(65, "Alakazam", "Psíquico", 3, "epic")),
  line(species(111, "Rhyhorn", "Terra/Pedra"), species(112, "Rhydon", "Terra/Pedra", 2), species(464, "Rhyperior", "Terra/Pedra", 3, "epic")),
  line(species(374, "Beldum", "Aço/Psíquico"), species(375, "Metang", "Aço/Psíquico", 2), species(376, "Metagross", "Aço/Psíquico", 3, "epic"))
];

export const ENVIRONMENTS = [
  world("bosque", "Bosque", "env-bosque", bosqueLines),
  world("floresta", "Floresta", "env-floresta", florestaLines),
  world("caverna", "Caverna", "env-caverna", cavernaLines),
  world("praia", "Praia", "env-praia", praiaLines),
  world("montanhas", "Montanhas", "env-montanhas", montanhasLines),
  world("caverna-gelo", "Caverna de Gelo", "env-gelo", geloLines, geloFinal),
  world("torre-fantasma", "Torre Fantasma", "env-fantasma", fantasmaLines, fantasmaFinal),
  world("vulcao", "Vulcão", "env-vulcao", vulcaoLines),
  world("planalto-indigo", "Planalto Índigo", "env-planalto", planaltoLines),
  world("elite-4", "Ginásios da Elite 4", "env-elite", eliteLines, eliteFinal)
];

export const TOTAL_ROUTES = ENVIRONMENTS.reduce((total, environment) => total + environment.routes.length, 0);

export const ALL_SPECIES = uniqueSpecies(
  ENVIRONMENTS.flatMap((environment) => environment.routes.flatMap((route) => [...route.encounters, route.boss]))
);

export function getRouteDefinition(worldIndex = 0, routeIndex = 0) {
  const safeWorldIndex = Math.max(0, Math.min(ENVIRONMENTS.length - 1, Number(worldIndex) || 0));
  const environment = ENVIRONMENTS[safeWorldIndex];
  const safeRouteIndex = Math.max(0, Math.min(environment.routes.length - 1, Number(routeIndex) || 0));
  return {
    ...environment.routes[safeRouteIndex],
    environment,
    worldIndex: safeWorldIndex,
    routeIndex: safeRouteIndex
  };
}

export function getRouteLevelRange(worldIndex = 0, routeIndex = 0, bossType = "mini") {
  const safeWorldIndex = Math.max(0, Math.min(ENVIRONMENTS.length - 1, Number(worldIndex) || 0));
  const safeRouteIndex = Math.max(0, Math.min(9, Number(routeIndex) || 0));
  const globalRouteNumber = safeWorldIndex * 10 + safeRouteIndex + 1;
  const minLevel = Math.min(100, globalRouteNumber + 2);
  const maxLevel = Math.min(100, globalRouteNumber + 4);
  const bossLevel = Math.min(100, maxLevel + (bossType === "final" ? 2 : 1));
  return { globalRouteNumber, minLevel, maxLevel, bossLevel };
}

export function createAreaState(worldIndex = 0, routeIndex = 0) {
  const route = getRouteDefinition(worldIndex, routeIndex);
  const levels = getRouteLevelRange(route.worldIndex, route.routeIndex, route.bossType);
  return {
    id: `${route.environment.id}-route-${route.routeNumber}`,
    name: `${route.environment.name} · Rota ${route.routeNumber}`,
    environmentId: route.environment.id,
    environmentName: route.environment.name,
    difficulty: route.worldIndex + 1,
    routeNumber: route.routeNumber,
    encounters: 0,
    victories: 0,
    regularVictories: 0,
    requiredVictories: route.requiredVictories,
    minLevel: levels.minLevel,
    maxLevel: levels.maxLevel,
    bossLevel: levels.bossLevel,
    bossDefeated: false,
    bossName: route.boss.name,
    bossType: route.bossType
  };
}

export function getNextRoutePosition(worldIndex, routeIndex) {
  const route = getRouteDefinition(worldIndex, routeIndex);
  if (route.routeIndex + 1 < route.environment.routes.length) {
    return { worldIndex: route.worldIndex, routeIndex: route.routeIndex + 1 };
  }
  if (route.worldIndex + 1 < ENVIRONMENTS.length) {
    return { worldIndex: route.worldIndex + 1, routeIndex: 0 };
  }
  return null;
}
