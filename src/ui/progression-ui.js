import { SCENE_BACKGROUNDS } from "../data/scene-backgrounds.js";
import { ENVIRONMENTS, getRouteDefinition, getRouteLevelRange, TOTAL_ROUTES } from "../data/worlds.js";

function createWorldTrack() {
  return ENVIRONMENTS.map((environment, index) => `
    <span class="world-step" data-world-step="${index}" title="Dificuldade ${index + 1}: ${environment.name}">
      <i></i><b>${index + 1}</b>
    </span>`).join("");
}

export function enhanceProgressionMarkup() {
  const heading = document.querySelector(".journey-heading > div");
  const headingLabel = heading?.querySelector("small");
  if (headingLabel) headingLabel.id = "environment-label";

  if (heading && !document.querySelector("#route-summary")) {
    heading.insertAdjacentHTML("beforeend", `
      <div id="route-summary" class="route-summary">
        <span id="route-count">0 / 3 Pokémon</span>
        <span id="route-levels">NV. 3–5</span>
        <span id="boss-status">Mini Boss</span>
      </div>`);
  }

  const scene = document.querySelector("#scene");
  if (scene && !document.querySelector("#route-hud")) {
    scene.insertAdjacentHTML("afterbegin", `
      <aside id="route-hud" class="route-hud">
        <div class="route-hud-copy">
          <small id="route-hud-label">PROGRESSO DA ROTA</small>
          <strong id="route-hud-boss"></strong>
        </div>
        <div class="bar route-progress"><i id="route-progress-bar"></i></div>
        <div id="world-track" class="world-track">${createWorldTrack()}</div>
      </aside>
      <div id="journey-complete-panel" class="journey-complete-panel" hidden>
        <span>🏆</span>
        <strong>JORNADA CONCLUÍDA!</strong>
        <p>Você venceu as 100 rotas e derrotou o chefe final.</p>
      </div>`);
  }

  const statsRow = document.querySelector(".stats-row");
  if (statsRow && !document.querySelector("#routes-completed-stat")) {
    const statLabels = statsRow.querySelectorAll("small");
    if (statLabels[0]) statLabels[0].textContent = "ENCONTROS NA ROTA";
    if (statLabels[1]) statLabels[1].textContent = "VITÓRIAS NA ROTA";
    statsRow.insertAdjacentHTML("beforeend", `
      <div><small>ROTAS CONCLUÍDAS</small><strong id="routes-completed-stat">0 / ${TOTAL_ROUTES}</strong></div>
      <div><small>PROGRESSO TOTAL</small><strong id="journey-progress-stat">0%</strong></div>`);
  }

  const pokedexHeading = document.querySelector("#pokedex-dialog .dialog-heading small");
  if (pokedexHeading) pokedexHeading.textContent = "REGISTRO DA JORNADA";
}

export function renderProgression(state) {
  const route = getRouteDefinition(state.journey?.worldIndex, state.journey?.routeIndex);
  const levels = getRouteLevelRange(route.worldIndex, route.routeIndex, route.bossType);
  const scene = document.querySelector("#scene");
  const completedRoutes = Math.max(0, Number(state.journey?.completedRoutes) || 0);
  const regularVictories = Math.min(state.area.requiredVictories, state.area.regularVictories || 0);
  const bossDefeated = Boolean(state.area.bossDefeated);
  const routeSteps = state.area.requiredVictories + 1;
  const clearedSteps = regularVictories + (bossDefeated ? 1 : 0);
  const routePercent = Math.min(100, (clearedSteps / routeSteps) * 100);
  const bossReady = regularVictories >= state.area.requiredVictories && !bossDefeated;
  const bossLabel = route.bossType === "final" ? "BOSS FINAL" : "MINI BOSS";

  if (scene) {
    [...scene.classList].filter((className) => className.startsWith("env-")).forEach((className) => scene.classList.remove(className));
    scene.classList.add(route.environment.theme);

    const environmentId = route.environment.id;
    const background = SCENE_BACKGROUNDS[environmentId];
    if (background && scene.dataset.environmentBackground !== environmentId) {
      scene.style.setProperty("--route-background", `url("${background}")`);
      scene.dataset.environmentBackground = environmentId;
    }

    scene.classList.toggle("boss-ready", bossReady);
    scene.classList.toggle("journey-complete", Boolean(state.journey?.complete));
  }

  document.querySelector("#environment-label").textContent = `DIFICULDADE ${route.worldIndex + 1} · ${route.environment.name.toUpperCase()}`;
  document.querySelector("#area-name").textContent = state.journey?.complete ? "Campeão da Jornada" : `Rota ${route.routeNumber}`;
  document.querySelector("#route-count").textContent = `${regularVictories} / ${state.area.requiredVictories} Pokémon`;
  document.querySelector("#route-levels").textContent = levels.minLevel === levels.maxLevel
    ? `NV. ${levels.minLevel}`
    : `NV. ${levels.minLevel}–${levels.maxLevel}`;
  document.querySelector("#boss-status").textContent = bossDefeated
    ? `${bossLabel} derrotado`
    : bossReady ? `${bossLabel} disponível` : `${bossLabel}: ${route.boss.name}`;
  document.querySelector("#route-hud-label").textContent = bossReady
    ? `${bossLabel} PRONTO PARA A BATALHA`
    : `ROTA ${route.routeNumber} · NV. ${levels.minLevel}${levels.minLevel === levels.maxLevel ? "" : `–${levels.maxLevel}`}`;
  document.querySelector("#route-hud-boss").textContent = bossDefeated
    ? `${route.boss.name} derrotado`
    : `${bossLabel}: ${route.boss.name} · NV. ${levels.bossLevel}`;
  document.querySelector("#route-progress-bar").style.width = `${routePercent}%`;
  document.querySelector("#routes-completed-stat").textContent = `${completedRoutes} / ${TOTAL_ROUTES}`;
  document.querySelector("#journey-progress-stat").textContent = `${Math.round((completedRoutes / TOTAL_ROUTES) * 100)}%`;

  document.querySelectorAll("[data-world-step]").forEach((step) => {
    const index = Number(step.dataset.worldStep);
    step.classList.toggle("completed", index < (state.journey?.completedWorlds || 0));
    step.classList.toggle("active", index === route.worldIndex && !state.journey?.complete);
  });

  const completePanel = document.querySelector("#journey-complete-panel");
  if (completePanel) completePanel.hidden = !state.journey?.complete;
  if (state.journey?.complete) document.querySelector("#mode-badge").textContent = "JORNADA CONCLUÍDA";

  const footerVersion = document.querySelector("footer span:last-child");
  if (footerVersion) footerVersion.textContent = "PROTÓTIPO v0.5.1";
}
