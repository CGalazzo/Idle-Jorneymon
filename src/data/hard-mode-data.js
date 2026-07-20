import { species, uniqueSpecies } from "./worlds-core.js";

const hardSpecies = (id, name, type, stage = 1, rarity = "rare") => ({
  ...species(id, name, type, stage, rarity),
  hardExclusive: true
});

export const HARD_EXCLUSIVE_BY_WORLD = {
  bosque: [
    hardSpecies(810, "Grookey", "Planta", 1, "uncommon"),
    hardSpecies(811, "Thwackey", "Planta", 2, "rare"),
    hardSpecies(812, "Rillaboom", "Planta", 3, "epic")
  ],
  floresta: [
    hardSpecies(540, "Sewaddle", "Inseto/Planta", 1, "uncommon"),
    hardSpecies(541, "Swadloon", "Inseto/Planta", 2, "rare"),
    hardSpecies(542, "Leavanny", "Inseto/Planta", 3, "epic")
  ],
  pantano: [hardSpecies(980, "Clodsire", "Veneno/Terra", 3, "epic")],
  caverna: [hardSpecies(703, "Carbink", "Pedra/Fada", 3, "epic")],
  praia: [
    hardSpecies(728, "Popplio", "Água", 1, "uncommon"),
    hardSpecies(729, "Brionne", "Água", 2, "rare"),
    hardSpecies(730, "Primarina", "Água/Fada", 3, "epic")
  ],
  "usina-eletrica": [
    hardSpecies(848, "Toxel", "Elétrico/Veneno", 1, "uncommon"),
    hardSpecies(849, "Toxtricity", "Elétrico/Veneno", 3, "epic")
  ],
  montanhas: [
    hardSpecies(744, "Rockruff", "Pedra", 1, "uncommon"),
    hardSpecies(745, "Lycanroc", "Pedra", 3, "epic")
  ],
  "dojo-luta": [hardSpecies(891, "Kubfu", "Lutador", 2, "epic")],
  "caverna-gelo": [
    hardSpecies(974, "Cetoddle", "Gelo", 1, "uncommon"),
    hardSpecies(975, "Cetitan", "Gelo", 3, "epic")
  ],
  "torre-fantasma": [
    hardSpecies(885, "Dreepy", "Dragão/Fantasma", 1, "uncommon"),
    hardSpecies(886, "Drakloak", "Dragão/Fantasma", 2, "rare"),
    hardSpecies(887, "Dragapult", "Dragão/Fantasma", 3, "epic")
  ],
  "torre-ilusoes": [
    hardSpecies(859, "Impidimp", "Sombrio/Fada", 1, "uncommon"),
    hardSpecies(860, "Morgrem", "Sombrio/Fada", 2, "rare"),
    hardSpecies(861, "Grimmsnarl", "Sombrio/Fada", 3, "epic")
  ],
  vulcao: [
    hardSpecies(909, "Fuecoco", "Fogo", 1, "uncommon"),
    hardSpecies(910, "Crocalor", "Fogo", 2, "rare"),
    hardSpecies(911, "Skeledirge", "Fogo/Fantasma", 3, "epic")
  ],
  "ilha-flutuante": [
    hardSpecies(940, "Wattrel", "Elétrico/Voador", 1, "uncommon"),
    hardSpecies(941, "Kilowattrel", "Elétrico/Voador", 3, "epic")
  ],
  "planalto-indigo": [
    hardSpecies(996, "Frigibax", "Dragão/Gelo", 1, "uncommon"),
    hardSpecies(997, "Arctibax", "Dragão/Gelo", 2, "rare"),
    hardSpecies(998, "Baxcalibur", "Dragão/Gelo", 3, "epic")
  ],
  "elite-4": [
    hardSpecies(1007, "Koraidon", "Lutador/Dragão", 3, "legendary"),
    hardSpecies(1008, "Miraidon", "Elétrico/Dragão", 3, "legendary")
  ]
};

const HARD_BOSS_REMIX_IDS = {
  bosque: [15, 3],
  floresta: [127, 254],
  pantano: [80, 260],
  caverna: [208, 306],
  praia: [130, 9],
  "usina-eletrica": [310, 181],
  montanhas: [142, 248],
  "dojo-luta": [308, 448],
  "caverna-gelo": [362, 460],
  "torre-fantasma": [354, 94],
  "torre-ilusoes": [282, 65],
  vulcao: [323, 6],
  "ilha-flutuante": [334, 373],
  "planalto-indigo": [445, 376],
  "elite-4": [150, 384]
};

export const HARD_BOSS_REMIX_SPECIES = [
  species(15, "Beedrill", "Inseto/Veneno", 3, "rare"),
  species(3, "Venusaur", "Planta/Veneno", 3, "rare"),
  species(127, "Pinsir", "Inseto", 3, "rare"),
  species(254, "Sceptile", "Planta", 3, "rare"),
  species(80, "Slowbro", "Água/Psíquico", 3, "rare"),
  species(260, "Swampert", "Água/Terra", 3, "rare"),
  species(208, "Steelix", "Aço/Terra", 3, "rare"),
  species(306, "Aggron", "Aço/Pedra", 3, "rare"),
  species(130, "Gyarados", "Água/Voador", 3, "rare"),
  species(9, "Blastoise", "Água", 3, "rare"),
  species(310, "Manectric", "Elétrico", 3, "rare"),
  species(181, "Ampharos", "Elétrico", 3, "rare"),
  species(142, "Aerodactyl", "Pedra/Voador", 3, "epic"),
  species(248, "Tyranitar", "Pedra/Sombrio", 3, "epic"),
  species(308, "Medicham", "Lutador/Psíquico", 3, "rare"),
  species(448, "Lucario", "Lutador/Aço", 3, "epic"),
  species(362, "Glalie", "Gelo", 3, "rare"),
  species(460, "Abomasnow", "Planta/Gelo", 3, "rare"),
  species(354, "Banette", "Fantasma", 3, "rare"),
  species(94, "Gengar", "Fantasma/Veneno", 3, "epic"),
  species(282, "Gardevoir", "Psíquico/Fada", 3, "epic"),
  species(65, "Alakazam", "Psíquico", 3, "epic"),
  species(323, "Camerupt", "Fogo/Terra", 3, "rare"),
  species(6, "Charizard", "Fogo/Voador", 3, "epic"),
  species(334, "Altaria", "Dragão/Voador", 3, "rare"),
  species(373, "Salamence", "Dragão/Voador", 3, "epic"),
  species(445, "Garchomp", "Dragão/Terra", 3, "epic"),
  species(376, "Metagross", "Aço/Psíquico", 3, "epic"),
  species(150, "Mewtwo", "Psíquico", 3, "legendary"),
  species(384, "Rayquaza", "Dragão/Voador", 3, "legendary")
];

export const HARD_MODE_SPECIES = uniqueSpecies([
  ...Object.values(HARD_EXCLUSIVE_BY_WORLD).flat(),
  ...HARD_BOSS_REMIX_SPECIES
]);

export const HARD_SHINY_CHANCE = 1 / 160;

function hardBossRemixId(route) {
  const remixIds = HARD_BOSS_REMIX_IDS[route.environment.id] || [];
  const remixSlot = route.routeIndex === 4 ? 0 : route.routeIndex === 9 ? 1 : -1;
  return remixSlot >= 0 ? remixIds[remixSlot] : null;
}

function exclusiveUnlocksForRoute(exclusives, routeIndex, environmentId) {
  if (!exclusives.length) return [];
  if (environmentId === "elite-4") {
    return exclusives.filter((_, index) => routeIndex >= [8, 9][index]);
  }
  if (exclusives.length === 1) return routeIndex >= 4 ? exclusives : [];
  if (exclusives.length === 2) {
    return exclusives.filter((_, index) => routeIndex >= [2, 7][index]);
  }
  return exclusives.filter((_, index) => routeIndex >= [1, 4, 7][index]);
}

export function getHardEncounterPool(route) {
  const routes = route.environment.routes;
  const routeIndex = route.routeIndex;
  const previous = routes[Math.max(0, routeIndex - 1)];
  const next = routes[Math.min(routes.length - 1, routeIndex + 1)];
  const earlierBoss = routes[Math.max(0, routeIndex - 2)]?.boss;
  const exclusives = exclusiveUnlocksForRoute(
    HARD_EXCLUSIVE_BY_WORLD[route.environment.id] || [],
    routeIndex,
    route.environment.id
  );
  const activeBossId = hardBossRemixId(route) || route.boss.id;

  const remixed = [
    ...route.encounters,
    previous?.encounters?.[routeIndex % Math.max(1, previous.encounters.length)],
    next?.encounters?.[(routeIndex + 1) % Math.max(1, next.encounters.length)],
    routeIndex >= 3 ? earlierBoss : null,
    ...exclusives
  ].filter(Boolean);

  return uniqueSpecies(remixed).filter((pokemon) => pokemon.id !== activeBossId);
}

export function getHardBossTemplate(route, speciesCatalog) {
  const remixId = hardBossRemixId(route);
  if (!remixId) return route.boss;
  return speciesCatalog.find((pokemon) => pokemon.id === remixId) || route.boss;
}
