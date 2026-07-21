import "../styles/route-map.css";
import "../styles/menu-readability.css";
import { addLog, randomEncounterTarget } from "../core/game-state.js";
import { SCENE_BACKGROUNDS } from "../data/scene-backgrounds.js";
import { createAreaState, ENVIRONMENTS, getRouteDefinition, getRouteLevelRange, TOTAL_ROUTES } from "../data/worlds.js";
import { saveGame } from "../systems/save.js";
import { installPokedexLocationDisplay } from "./pokedex-locations-ui.js";

let currentState = null;

function cloneValue(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function createWorldTrack() {
  return ENVIRONMENTS.map((environment, index) => `
    <span class="world-step" data-world-step="${index}" title="Dificuldade ${index + 1}: ${environment.name}">
      <i></i><b>${index + 1}</b>
    </span>`).join("");
}

function globalRouteIndex(worldIndex, routeIndex) {
  return ENVIRONMENTS
    .slice(0, Math.max(0, Number(worldIndex) || 0))
    .reduce((total, environment) => total + environment.routes.length, 0)
    + Math.max(0, Number(routeIndex) || 0);
}

function mainJourney(state) {
  return state.revisit?.active && state.revisit.originJourney
    ? state.revisit.originJourney
    : state.journey;
}

function maximumUnlockedRoute(state) {
  const journey = mainJourney(state);
  if (journey?.complete) return TOTAL_ROUTES - 1;
  return Math.max(0, Math.min(TOTAL_ROUTES - 1, Number(journey?.completedRoutes) || 0));
}

function resetRuntimeForTravel(state, { preserveExploration = false } = {}) {
  state.mode = "exploring";
  state.pendingRouteAdvance = false;
  state.battleParticipants = [];
  state.captureOffer = null;
  state.approachProgress = 0;
  state.enemy = null;
  state.battleCooldown = 0;
  state.recoveryCooldown = 0;
  if (!preserveExploration) {
    state.exploration = 0;
    state.nextEncounterAt = randomEncounterTarget();
  }
  state.team.forEach((pokemon) => { pokemon.hp = pokemon.maxHp; });
  state.activeTeamIndex = Math.max(0, state.team.findIndex((pokemon) => pokemon.hp > 0));
}

function beginRevisit(state, worldIndex, routeIndex) {
  const unlockedLimit = maximumUnlockedRoute(state);
  const targetGlobalIndex = globalRouteIndex(worldIndex, routeIndex);
  if (targetGlobalIndex > unlockedLimit) return false;

  const originJourney = mainJourney(state);
  const originWorldIndex = Number(originJourney?.worldIndex) || 0;
  const originRouteIndex = Number(originJourney?.routeIndex) || 0;
  const selectingMainPosition = worldIndex === originWorldIndex && routeIndex === originRouteIndex;

  // Durante uma jornada em andamento, selecionar a rota atual apenas fecha o mapa.
  // Depois de concluir as 150 rotas, a mesma posição precisa iniciar uma revisita real.
  if (!state.revisit?.active && selectingMainPosition && !originJourney?.complete) return true;
  if (state.revisit?.active && selectingMainPosition) return resumeMainJourney(state);

  if (!state.revisit?.active) {
    state.revisit = {
      active: true,
      originJourney: cloneValue(state.journey),
      originArea: cloneValue(state.area),
      originRuntime: {
        exploration: Math.max(0, Number(state.exploration) || 0),
        nextEncounterAt: Math.max(1, Number(state.nextEncounterAt) || randomEncounterTarget())
      },
      startedAt: Date.now()
    };
  }

  state.revisit.targetWorldIndex = worldIndex;
  state.revisit.targetRouteIndex = routeIndex;
  state.journey = {
    ...state.journey,
    worldIndex,
    routeIndex,
    complete: false,
    completedRoutes: Number(state.revisit.originJourney?.completedRoutes) || 0,
    completedWorlds: Number(state.revisit.originJourney?.completedWorlds) || 0
  };
  state.area = createAreaState(worldIndex, routeIndex);
  resetRuntimeForTravel(state);

  const route = getRouteDefinition(worldIndex, routeIndex);
  addLog(state, `Você voltou para ${route.environment.name} · Rota ${route.routeNumber} para capturar e treinar.`);
  saveGame(state);
  return true;
}

function resumeMainJourney(state) {
  const revisit = state.revisit;
  if (!revisit?.active || !revisit.originJourney || !revisit.originArea) return false;

  state.journey = cloneValue(revisit.originJourney);
  state.area = cloneValue(revisit.originArea);
  const originRuntime = revisit.originRuntime || {};
  state.exploration = Math.max(0, Number(originRuntime.exploration) || 0);
  state.nextEncounterAt = Math.max(1, Number(originRuntime.nextEncounterAt) || randomEncounterTarget());
  state.revisit = null;
  resetRuntimeForTravel(state, { preserveExploration: true });

  const route = getRouteDefinition(state.journey.worldIndex, state.journey.routeIndex);
  addLog(state, `Jornada principal retomada em ${route.environment.name} · Rota ${route.routeNumber}.`);
  saveGame(state);
  return true;
}

function routeStatus(state, worldIndex, routeIndex, unlockedLimit) {
  const journey = mainJourney(state);
  const index = globalRouteIndex(worldIndex, routeIndex);
  const isRevisiting = Boolean(state.revisit?.active)
    && Number(state.journey?.worldIndex) === worldIndex
    && Number(state.journey?.routeIndex) === routeIndex;
  const isMainCurrent = Number(journey?.worldIndex) === worldIndex
    && Number(journey?.routeIndex) === routeIndex;
  const completed = Boolean(journey?.complete) || index < (Number(journey?.completedRoutes) || 0);
  const unlocked = index <= unlockedLimit;

  if (isRevisiting) return { label: "Revisitando", className: "revisiting", unlocked };
  if (completed && journey?.complete) return { label: "Concluída · Revisitar", className: "completed", unlocked };
  if (isMainCurrent) return { label: "Jornada atual", className: "main-current", unlocked };
  if (completed) return { label: "Concluída", className: "completed", unlocked };
  if (unlocked) return { label: "Liberada", className: "", unlocked };
  return { label: "Bloqueada", className: "", unlocked: false };
}

function renderRouteMap(state) {
  const dialog = document.querySelector("#route-map-dialog");
  const worldsRoot = document.querySelector("#route-map-worlds");
  if (!dialog || !worldsRoot) return;

  const unlockedLimit = maximumUnlockedRoute(state);
  const journey = mainJourney(state);
  const mainRoute = getRouteDefinition(journey.worldIndex, journey.routeIndex);
  const introCopy = document.querySelector("#route-map-intro-copy");
  const returnButton = document.querySelector("#route-map-main-return");

  introCopy.innerHTML = state.revisit?.active
    ? `Você está revisitando uma rota. Sua jornada principal está guardada em <strong>${mainRoute.environment.name} · Rota ${mainRoute.routeNumber}</strong>.`
    : journey?.complete
      ? `Jornada concluída. Escolha qualquer rota, incluindo <strong>${mainRoute.environment.name} · Rota ${mainRoute.routeNumber}</strong>, para revisitar e enfrentar os Pokémon novamente.`
      : `Escolha qualquer rota já liberada. Sua posição atual em <strong>${mainRoute.environment.name} · Rota ${mainRoute.routeNumber}</strong> ficará preservada.`;
  returnButton.hidden = !state.revisit?.active;

  worldsRoot.innerHTML = ENVIRONMENTS.map((environment, worldIndex) => {
    const firstIndex = globalRouteIndex(worldIndex, 0);
    const worldLocked = firstIndex > unlockedLimit;
    const routeButtons = environment.routes.map((route, routeIndex) => {
      const levels = getRouteLevelRange(worldIndex, routeIndex, route.bossType);
      const status = routeStatus(state, worldIndex, routeIndex, unlockedLimit);
      return `<button class="route-map-route ${status.className}" data-route-world="${worldIndex}" data-route-index="${routeIndex}" ${status.unlocked ? "" : "disabled"} title="Chefe: ${route.boss.name} · NV. ${levels.bossLevel}">
        <strong>ROTA ${route.routeNumber}</strong>
        <span>NV. ${levels.minLevel}${levels.minLevel === levels.maxLevel ? "" : `–${levels.maxLevel}`}</span>
        <small>${status.label}</small>
      </button>`;
    }).join("");

    return `<section class="route-map-world ${worldLocked ? "locked" : ""}">
      <div class="route-map-world-heading">
        <div><i>${worldIndex + 1}</i><strong>${environment.name}</strong></div>
        <small>${worldLocked ? "Bloqueado" : "Rotas liberadas"}</small>
      </div>
      <div class="route-map-routes">${routeButtons}</div>
    </section>`;
  }).join("");
}

function setupRouteMapEvents() {
  const dialog = document.querySelector("#route-map-dialog");
  const openButton = document.querySelector("#route-map-button");
  const closeButton = document.querySelector("#close-route-map");
  const returnButtons = [
    document.querySelector("#route-map-main-return"),
    document.querySelector("#resume-journey-button")
  ];

  openButton?.addEventListener("click", () => {
    if (!currentState || openButton.disabled) return;
    renderRouteMap(currentState);
    dialog.showModal();
  });

  closeButton?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  document.querySelector("#route-map-worlds")?.addEventListener("click", (event) => {
    const routeButton = event.target.closest("[data-route-world][data-route-index]");
    if (!routeButton || routeButton.disabled || !currentState) return;
    if (currentState.mode !== "exploring") {
      window.alert("Aguarde a batalha ou a captura terminar para viajar pelo mapa.");
      return;
    }

    const worldIndex = Number(routeButton.dataset.routeWorld);
    const routeIndex = Number(routeButton.dataset.routeIndex);
    if (beginRevisit(currentState, worldIndex, routeIndex)) {
      dialog.close();
      renderProgression(currentState);
    }
  });

  returnButtons.forEach((button) => button?.addEventListener("click", () => {
    if (!currentState || currentState.mode !== "exploring") return;
    if (resumeMainJourney(currentState)) {
      if (dialog.open) dialog.close();
      renderProgression(currentState);
    }
  }));
}

export function enhanceProgressionMarkup() {
  const headingSection = document.querySelector(".journey-heading");
  const heading = headingSection?.querySelector(":scope > div");
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

  const modeBadge = document.querySelector("#mode-badge");
  if (headingSection && modeBadge && !document.querySelector("#route-hud")) {
    modeBadge.insertAdjacentHTML("beforebegin", `
      <aside id="route-hud" class="route-hud route-hud-inline">
        <button id="route-map-button" class="route-map-button" aria-label="Abrir mapa de rotas" title="Mapa de Rotas">
          <span aria-hidden="true">🗺️</span><b>MAPA DE ROTAS</b>
        </button>
        <div class="route-hud-copy">
          <small id="route-hud-label">PROGRESSO DA ROTA</small>
          <strong id="route-hud-boss"></strong>
        </div>
        <div class="bar route-progress"><i id="route-progress-bar"></i></div>
        <div id="world-track" class="world-track">${createWorldTrack()}</div>
        <button id="resume-journey-button" class="resume-journey-button" hidden>↩ RETOMAR JORNADA PRINCIPAL</button>
      </aside>`);
  }

  const scene = document.querySelector("#scene");
  if (scene && !document.querySelector("#journey-complete-panel")) {
    scene.insertAdjacentHTML("afterbegin", `
      <div id="journey-complete-panel" class="journey-complete-panel" hidden>
        <span>🏆</span>
        <strong>JORNADA CONCLUÍDA!</strong>
        <p>Você venceu as ${TOTAL_ROUTES} rotas e derrotou o chefe final.</p>
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

  if (!document.querySelector("#route-map-dialog")) {
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="route-map-dialog" class="route-map-dialog">
        <div class="dialog-heading"><div><small>NAVEGAÇÃO E TREINAMENTO</small><h2>Mapa de Rotas</h2></div><button id="close-route-map" class="icon-button" aria-label="Fechar mapa">×</button></div>
        <div class="route-map-intro"><span id="route-map-intro-copy"></span><button id="route-map-main-return" class="route-map-main-return" hidden>RETOMAR JORNADA</button></div>
        <div id="route-map-worlds" class="route-map-worlds"></div>
      </dialog>`);
  }

  setupRouteMapEvents();
  installPokedexLocationDisplay();
}

export function renderProgression(state) {
  currentState = state;
  const route = getRouteDefinition(state.journey?.worldIndex, state.journey?.routeIndex);
  const levels = getRouteLevelRange(route.worldIndex, route.routeIndex, route.bossType);
  const scene = document.querySelector("#scene");
  const journey = mainJourney(state);
  const completedRoutes = Math.max(0, Number(journey?.completedRoutes) || 0);
  const regularVictories = Math.min(state.area.requiredVictories, state.area.regularVictories || 0);
  const bossDefeated = Boolean(state.area.bossDefeated);
  const routeSteps = state.area.requiredVictories + 1;
  const clearedSteps = regularVictories + (bossDefeated ? 1 : 0);
  const routePercent = Math.min(100, (clearedSteps / routeSteps) * 100);
  const bossReady = regularVictories >= state.area.requiredVictories && !bossDefeated;
  const bossLabel = route.bossType === "final" ? "BOSS FINAL" : "MINI BOSS";
  const revisiting = Boolean(state.revisit?.active);
  const journeyComplete = Boolean(state.journey?.complete) && !revisiting;
  const showCompletionTrophy = journeyComplete && (
    state.campaignMode !== "normal" || Boolean(state.hardUnlockCelebrationPending)
  );

  if (scene) {
    const theme = route.environment.theme;
    if (scene.dataset.environmentTheme !== theme) {
      const previousTheme = scene.dataset.environmentTheme;
      if (previousTheme) scene.classList.remove(previousTheme);
      scene.classList.add(theme);
      scene.dataset.environmentTheme = theme;
    }

    const environmentId = route.environment.id;
    const background = SCENE_BACKGROUNDS[environmentId];
    if (background && scene.dataset.environmentBackground !== environmentId) {
      scene.style.setProperty("--route-background", `url("${background}")`);
      scene.dataset.environmentBackground = environmentId;
    }

    scene.classList.toggle("boss-ready", bossReady);
    scene.classList.toggle("journey-complete", showCompletionTrophy);
  }

  document.querySelector("#environment-label").textContent = `${revisiting ? "REVISITANDO · " : ""}DIFICULDADE ${route.worldIndex + 1} · ${route.environment.name.toUpperCase()}`;
  document.querySelector("#area-name").textContent = journeyComplete ? "Campeão da Jornada" : `Rota ${route.routeNumber}${revisiting ? " · Revisita" : ""}`;
  document.querySelector("#route-count").textContent = `${regularVictories} / ${state.area.requiredVictories} Pokémon`;
  document.querySelector("#route-levels").textContent = levels.minLevel === levels.maxLevel
    ? `NV. ${levels.minLevel}`
    : `NV. ${levels.minLevel}–${levels.maxLevel}`;
  document.querySelector("#boss-status").textContent = bossDefeated
    ? `${bossLabel} derrotado`
    : bossReady ? `${bossLabel} disponível` : `${bossLabel}: ${route.boss.name}`;
  document.querySelector("#route-hud-label").textContent = bossReady
    ? `${bossLabel} PRONTO PARA A BATALHA`
    : `${revisiting ? "REVISITANDO · " : ""}ROTA ${route.routeNumber} · NV. ${levels.minLevel}${levels.minLevel === levels.maxLevel ? "" : `–${levels.maxLevel}`}`;
  document.querySelector("#route-hud-boss").textContent = bossDefeated
    ? `${route.boss.name} derrotado`
    : `${bossLabel}: ${route.boss.name} · NV. ${levels.bossLevel}`;
  document.querySelector("#route-progress-bar").style.width = `${routePercent}%`;
  document.querySelector("#routes-completed-stat").textContent = `${completedRoutes} / ${TOTAL_ROUTES}`;
  document.querySelector("#journey-progress-stat").textContent = `${Math.round((completedRoutes / TOTAL_ROUTES) * 100)}%`;

  const mapButton = document.querySelector("#route-map-button");
  mapButton.disabled = !state.hasStarted || state.mode !== "exploring";
  mapButton.title = mapButton.disabled ? "Disponível quando a equipe estiver explorando" : "Abrir Mapa de Rotas";
  mapButton.classList.toggle("active", revisiting);
  document.querySelector("#resume-journey-button").hidden = !revisiting;

  document.querySelectorAll("[data-world-step]").forEach((step) => {
    const index = Number(step.dataset.worldStep);
    step.classList.toggle("completed", index < (journey?.completedWorlds || 0));
    step.classList.toggle("active", index === route.worldIndex && !journeyComplete);
  });

  const completePanel = document.querySelector("#journey-complete-panel");
  if (completePanel) completePanel.hidden = !showCompletionTrophy;
  if (journeyComplete) document.querySelector("#mode-badge").textContent = "JORNADA CONCLUÍDA · ABRA O MAPA PARA REVISITAR";
  if (revisiting) document.querySelector("#mode-badge").textContent = "REVISITANDO";

  const footerVersion = document.querySelector("footer span:last-child");
  if (footerVersion) footerVersion.textContent = "PROTÓTIPO v0.6.1";
}
