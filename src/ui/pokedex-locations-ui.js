import { getHardBossTemplate, getHardEncounterPool } from "../data/hard-mode-data.js";
import { POKEDEX_SPECIES } from "../data/pokemon.js";
import { ENVIRONMENTS } from "../data/worlds.js";

let installed = false;
let cachedLocationIndex = null;

function addLocation(index, pokemon, location) {
  const speciesId = Number(pokemon?.id);
  if (!speciesId) return;
  if (!index.has(speciesId)) index.set(speciesId, []);
  const key = `${location.mode}:${location.worldIndex}:${location.routeNumber}:${location.role}`;
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
      addLocation(index, getHardBossTemplate(route, POKEDEX_SPECIES), {
        mode: "hard",
        worldIndex,
        worldNumber: worldIndex + 1,
        environmentName: environment.name,
        routeNumber: routeIndex + 1,
        role: route.bossType === "final" ? "boss final" : "miniboss"
      });
    });
  });

  index.forEach((entries) => entries.sort((a, b) => {
    if (a.mode !== b.mode) return a.mode === "normal" ? -1 : 1;
    if (a.worldIndex !== b.worldIndex) return a.worldIndex - b.worldIndex;
    return a.routeNumber - b.routeNumber;
  }));
  return index;
}

function groupedLocations(entries = []) {
  const groups = new Map();
  entries.forEach((entry) => {
    const key = `${entry.mode}:${entry.worldIndex}:${entry.role}`;
    if (!groups.has(key)) groups.set(key, { ...entry, routes: [] });
    const group = groups.get(key);
    if (!group.routes.includes(entry.routeNumber)) group.routes.push(entry.routeNumber);
  });

  return [...groups.values()].map((group) => {
    const routes = group.routes.sort((a, b) => a - b);
    const routeLabel = routes.length === 1 ? `Rota ${routes[0]}` : `Rotas ${routes.join(", ")}`;
    const roleLabel = group.role === "encontro" ? "" : ` · ${group.role === "boss final" ? "Boss Final" : "Miniboss"}`;
    return `${group.mode === "hard" ? "HARD" : "NORMAL"} · Nível ${group.worldNumber} · ${group.environmentName} · ${routeLabel}${roleLabel}`;
  });
}

function decoratePokedexLocations() {
  const grid = document.querySelector("#pokedex-grid");
  if (!grid) return;
  if (!cachedLocationIndex) cachedLocationIndex = buildLocationIndex();

  grid.querySelectorAll(".dex-card").forEach((card, index) => {
    card.querySelector(".dex-location-block")?.remove();
    if (card.classList.contains("unknown")) return;

    const pokemon = POKEDEX_SPECIES[index];
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
    window.requestAnimationFrame(decoratePokedexLocations);
  });
}
