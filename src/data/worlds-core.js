export const ROUTE_TARGETS = [3, 4, 5, 6, 7, 8, 8, 9, 9, 10];

export function species(id, name, type, stage = 1, rarity) {
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

export const line = (base, middle, final) => [base, middle, final];
export const route = (encounters, boss, bossType = "mini") => ({ encounters, boss, bossType });

export function uniqueSpecies(list) {
  return [...new Map(list.map((pokemon) => [pokemon.id, pokemon])).values()];
}

export function finalizeRoutes(routes) {
  return routes.map((entry, routeIndex) => ({
    ...entry,
    encounters: uniqueSpecies(entry.encounters).filter((pokemon) => pokemon.id !== entry.boss.id),
    routeNumber: routeIndex + 1,
    requiredVictories: ROUTE_TARGETS[routeIndex]
  }));
}

export function buildRoutes(lines, finalBoss = null) {
  const bases = lines.map(([base]) => base);
  const routes = [];

  lines.forEach((evolutionLine, lineIndex) => {
    const [base, middle, final] = evolutionLine;
    const nextBase = bases[(lineIndex + 1) % bases.length];
    const secondBase = bases[(lineIndex + 2) % bases.length];

    routes.push(route(uniqueSpecies([base, nextBase, secondBase]), middle));
    routes.push(route(uniqueSpecies([base, middle, nextBase, final]), final));
  });

  if (finalBoss) routes[routes.length - 1].boss = finalBoss;
  routes[routes.length - 1].bossType = "final";
  return routes;
}

function replaceEncounter(routeEntry, replacedId, replacement) {
  routeEntry.encounters = routeEntry.encounters.map((pokemon) => (pokemon.id === replacedId ? replacement : pokemon));
}

function addEncounters(routeEntry, ...pokemon) {
  routeEntry.encounters = uniqueSpecies([...routeEntry.encounters, ...pokemon]);
}

function customizeRoutes(id, routes, lines) {
  if (id === "bosque") {
    routes[0].boss = lines[2][1];
    routes[2].boss = lines[3][1];
    routes[6].boss = lines[3][2];
    routes[7].boss = species(71, "Victreebel", "Planta/Veneno", 3);
    const eevee = species(133, "Eevee", "Normal");
    routes.forEach((entry) => addEncounters(entry, eevee));
  }

  if (id === "floresta") {
    const leafeon = species(470, "Leafeon", "Planta", 3, "rare");
    [3, 5, 7, 9].forEach((index) => addEncounters(routes[index], leafeon));
  }

  if (id === "caverna") {
    [routes[7], routes[8]] = [routes[8], routes[7]];
    replaceEncounter(routes[9], 41, species(169, "Crobat", "Veneno/Voador", 3));
  }

  if (id === "praia") {
    const vaporeon = species(134, "Vaporeon", "Água", 3, "rare");
    replaceEncounter(routes[1], 62, species(258, "Mudkip", "Água"));
    replaceEncounter(routes[9], 9, species(259, "Marshtomp", "Água/Terra", 2));
    [3, 5, 7, 9].forEach((index) => addEncounters(routes[index], vaporeon));
  }

  if (id === "montanhas") {
    replaceEncounter(routes[1], 464, species(247, "Pupitar", "Pedra/Terra", 2));
  }

  if (id === "caverna-gelo") {
    const vaporeon = species(134, "Vaporeon", "Água", 3);
    const glaceon = species(471, "Glaceon", "Gelo", 3, "rare");
    const jynx = species(124, "Jynx", "Gelo/Psíquico", 3);
    const lapras = species(131, "Lapras", "Água/Gelo", 3, "epic");

    addEncounters(routes[2], vaporeon, jynx);
    routes[2].boss = lapras;
    addEncounters(routes[4], vaporeon, glaceon);
    addEncounters(routes[6], jynx, glaceon);
    addEncounters(routes[8], vaporeon, jynx, glaceon);
  }

  if (id === "torre-fantasma") {
    const umbreon = species(197, "Umbreon", "Sombrio", 3, "rare");
    routes[6].boss = species(778, "Mimikyu", "Fantasma/Fada", 3, "epic");
    [3, 5, 7, 9].forEach((index) => addEncounters(routes[index], umbreon));
  }

  if (id === "vulcao") {
    const flareon = species(136, "Flareon", "Fogo", 3, "rare");
    routes[1].boss = flareon;
    addEncounters(routes[2], species(58, "Growlithe", "Fogo"));
    routes[2].boss = species(59, "Arcanine", "Fogo", 2, "rare");
    [5, 7, 9].forEach((index) => addEncounters(routes[index], flareon));
  }
}

export function world(id, name, theme, lines, finalBoss = null) {
  const routes = buildRoutes(lines, finalBoss);
  customizeRoutes(id, routes, lines);
  return { id, name, theme, routes: finalizeRoutes(routes) };
}

export function customWorld(id, name, theme, routes) {
  return { id, name, theme, routes: finalizeRoutes(routes) };
}
