import { CHAMPIONS_HALL_SPECIES } from "../data/champions-hall-data.js";
import { getHardBossTemplate, getHardEncounterPool } from "../data/hard-mode-data.js";
import { COMPLETE_POKEDEX_SPECIES } from "../data/pokedex-data.js";
import { SAFARI_HABITATS } from "../data/safari-data.js";
import { ENVIRONMENTS } from "../data/worlds.js";

let installed = false;
let cachedLocationIndex = null;

function addLocation(index, pokemon, location) {
  const speciesId = Number(pokemon?.id);
  if (!speciesId) return;
  if (!index.has(speciesId)) index.set(speciesId, []);
  const key = location.mode === "safari"
    ? `safari:${location.habitatId}`
    : location.mode === "champions-hall"
      ? "champions-hall"
      : `${location.mode}:${location.worldIndex}:${location.routeNumber}:${location.role}`;
  const entries = index.get(speciesId);
  if (!entries.some((entry) => entry.key === key)) entries.push({ ...location, key });
}

function buildLocationIndex() {
  const index = new Map();

  ENVIRONMENTS.forEach((environment, worldIndex) => {
    environment.routes.forEach((routeData, routeIndex) => {
      const route = {
        ...routeData,
        environment,
        worldIndex,
        routeIndex,
        routeNumber: routeIndex + 1
      };

      route.encounters.forEach((pokemon) => addLocation(index, pokemon, {
        mode: "normal",
        worldIndex,
        worldNumber: worldIndex + 1,
        environmentName: environment.name,
        routeNumber: routeIndex + 1,
        role: "encontro"
      }));
      addLocation(index, route.boss, {
        mode: "normal",
        worldIndex,
        worldNumber: worldIndex + 1,
        environmentName: environment.name,
        routeNumber: routeIndex + 1,
        role: route.bossType === "final" ? "boss final" : "miniboss"
      });

      getHardEncounterPool(route).forEach((pokemon) => addLocation(index, pokemon, {
        mode: "hard",
        worldIndex,
        worldNumber: worldIndex + 1,
        environmentName: environment.name,
        routeNumber: routeIndex + 1,
        role: "encontro"
      }));
      addLocation(index, getHardBossTemplate(route, COMPLETE_POKEDEX_SPECIES), {
        mode: "hard",
        worldIndex,
        worldNumber: worldIndex + 1,
        environmentName: environment.name,
        routeNumber: routeIndex + 1,
        role: route.bossType === "final" ? "boss final" : "miniboss"
      });
    });
  });

  SAFARI_HABITATS.forEach((habitat) => {
    habitat.encounters.forEach((entry) => addLocation(index, entry.pokemon, {
      mode: "safari",
      habitatId: habitat.id,
      habitatName: habitat.name,
      role: "encontro"
    }));
  });

  CHAMPIONS_HALL_SPECIES.forEach((pokemon) => addLocation(index, pokemon, {
    mode: "champions-hall",
    role: "encontro"
  }));

  index.forEach((entries) => entries.sort((a, b) => {
    const modeOrder = { normal: 0, hard: 1, safari: 2, "champions-hall": 3 };
    if (a.mode !== b.mode) return (modeOrder[a.mode] ?? 9) - (modeOrder[b.mode] ?? 9);
    if (a.mode === "safari") return a.habitatName.localeCompare(b.habitatName);
    if (a.mode === "champions-hall") return 0;
    if (a.worldIndex !== b.worldIndex) return a.worldIndex - b.worldIndex;
    return a.routeNumber - b.routeNumber;
  }));
  return index;
}

function groupedLocations(entries = []) {
  const groups = new Map();
  entries.forEach((entry) => {
    if (entry.mode === "safari") {
      const key = `safari:${entry.habitatId}`;
      if (!groups.has(key)) groups.set(key, entry);
      return;
    }
    if (entry.mode === "champions-hall") {
      if (!groups.has("champions-hall")) groups.set("champions-hall", entry);
      return;
    }
    const key = `${entry.mode}:${entry.worldIndex}:${entry.role}`;
    if (!groups.has(key)) groups.set(key, { ...entry, routes: [] });
    const group = groups.get(key);
    if (!group.routes.includes(entry.routeNumber)) group.routes.push(entry.routeNumber);
  });

  return [...groups.values()].map((group) => {
    if (group.mode === "safari") return `ZONA SAFARI · ${group.habitatName}`;
    if (group.mode === "champions-hall") return "SALÃO DOS CAMPEÕES · NV. 100 · SHINY";
    const routes = group.routes.sort((a, b) => a - b);
    const routeLabel = routes.length === 1 ? `Rota ${routes[0]}` : `Rotas ${routes.join(", ")}`;
    const roleLabel = group.role === "encontro" ? "" : ` · ${group.role === "boss final" ? "Boss Final" : "Miniboss"}`;
    return `${group.mode === "hard" ? "HARD" : "NORMAL"} · Nível ${group.worldNumber} · ${group.environmentName} · ${routeLabel}${roleLabel}`;
  });
}

export function decoratePokedexLocations() {
  const grid = document.querySelector("#pokedex-grid");
  if (!grid) return;
  if (!cachedLocationIndex) cachedLocationIndex = buildLocationIndex();

  grid.querySelectorAll(".dex-card").forEach((card, index) => {
    card.querySelector(".dex-location-block")?.remove();
    if (card.classList.contains("unknown")) return;

    const pokemon = COMPLETE_POKEDEX_SPECIES[index];
    const locations = groupedLocations(cachedLocationIndex.get(Number(pokemon?.id)) || []);
    const block = document.createElement("div");
    block.className = "dex-location-block";
    block.innerHTML = locations.length
      ? `<b>LOCALIZAÇÃO</b><span>${locations.map((location) => `<i>${location}</i>`).join("")}</span>`
      : `<b>LOCALIZAÇÃO</b><span><i>Obtido por evolução ou evento especial.</i></span>`;
    card.appendChild(block);
  });
}

export function installPokedexLocationDisplay() {
  if (installed) return;
  installed = true;
  document.querySelector("#pokedex-button")?.addEventListener("click", () => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(decoratePokedexLocations));
  });
}
