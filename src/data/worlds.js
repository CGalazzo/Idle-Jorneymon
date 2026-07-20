import { customWorld, uniqueSpecies, world } from "./worlds-core.js";
export { ROUTE_TARGETS } from "./worlds-core.js";
import { bosqueLines, florestaLines, pantanoRoutes, cavernaLines, praiaLines } from "./worlds-data-early.js";
import { usinaRoutes, montanhasLines, dojoRoutes, geloFinal, geloLines, fantasmaRoutes } from "./worlds-data-middle.js";
import { ilusoesRoutes, vulcaoLines, ilhaRoutes, planaltoLines, eliteRoutes } from "./worlds-data-late.js";

export const ENVIRONMENTS = [
  world("bosque", "Bosque", "env-bosque", bosqueLines),
  world("floresta", "Floresta", "env-floresta", florestaLines),
  customWorld("pantano", "Pântano", "env-pantano", pantanoRoutes),
  world("caverna", "Caverna", "env-caverna", cavernaLines),
  world("praia", "Praia", "env-praia", praiaLines),
  customWorld("usina-eletrica", "Usina Elétrica", "env-usina", usinaRoutes),
  world("montanhas", "Montanhas", "env-montanhas", montanhasLines),
  customWorld("dojo-luta", "Dojo de Luta", "env-dojo", dojoRoutes),
  world("caverna-gelo", "Caverna de Gelo", "env-gelo", geloLines, geloFinal),
  customWorld("torre-fantasma", "Torre Fantasma", "env-fantasma", fantasmaRoutes),
  customWorld("torre-ilusoes", "Torre das Ilusões", "env-ilusoes", ilusoesRoutes),
  world("vulcao", "Vulcão", "env-vulcao", vulcaoLines),
  customWorld("ilha-flutuante", "Ilha Flutuante", "env-ilha", ilhaRoutes),
  world("planalto-indigo", "Planalto Índigo", "env-planalto", planaltoLines),
  customWorld("elite-4", "Ginásios da Elite 4", "env-elite", eliteRoutes)
];

export const TOTAL_ROUTES = ENVIRONMENTS.reduce((total, environment) => total + environment.routes.length, 0);

export const ALL_SPECIES = uniqueSpecies(
  ENVIRONMENTS.flatMap((environment) => environment.routes.flatMap((routeEntry) => [...routeEntry.encounters, routeEntry.boss]))
);

export function getEnvironmentIndexById(environmentId) {
  return ENVIRONMENTS.findIndex((environment) => environment.id === environmentId);
}

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
  const currentRoute = getRouteDefinition(worldIndex, routeIndex);
  const completedBefore = ENVIRONMENTS
    .slice(0, currentRoute.worldIndex)
    .reduce((total, environment) => total + environment.routes.length, 0);
  const globalRouteNumber = completedBefore + currentRoute.routeIndex + 1;
  const progress = TOTAL_ROUTES <= 1 ? 0 : (globalRouteNumber - 1) / (TOTAL_ROUTES - 1);
  const minLevel = Math.max(1, Math.min(97, Math.round(3 + progress * 94)));
  const maxLevel = Math.min(99, minLevel + 2);
  const bossLevel = Math.min(100, maxLevel + 1);
  return { globalRouteNumber, minLevel, maxLevel, bossLevel, bossType };
}

export function createAreaState(worldIndex = 0, routeIndex = 0) {
  const route = getRouteDefinition(worldIndex, routeIndex);
  return {
    environmentId: route.environment.id,
    name: `${route.environment.name} · Rota ${route.routeNumber}`,
    routeNumber: route.routeNumber,
    requiredVictories: route.requiredVictories,
    bossName: route.boss.name,
    bossType: route.bossType,
    encounters: 0,
    victories: 0,
    regularVictories: 0,
    bossDefeated: false
  };
}

export function getNextRoutePosition(worldIndex = 0, routeIndex = 0) {
  const route = getRouteDefinition(worldIndex, routeIndex);
  if (route.routeIndex + 1 < route.environment.routes.length) {
    return { worldIndex: route.worldIndex, routeIndex: route.routeIndex + 1 };
  }
  if (route.worldIndex + 1 < ENVIRONMENTS.length) {
    return { worldIndex: route.worldIndex + 1, routeIndex: 0 };
  }
  return null;
}
