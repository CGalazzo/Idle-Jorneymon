import "../styles/hard-mode.css";
import { getRouteDefinition, getRouteLevelRange, TOTAL_ROUTES } from "../data/worlds.js";
import { getCampaignProgress } from "../systems/campaign.js";

let routeMapHardListenerInstalled = false;
let currentState = null;

function strongestTeamLevel(state) {
  return Math.max(1, ...(state.team || []).map((pokemon) => Number(pokemon.level) || 1));
}

function hardLevels(state, worldIndex, routeIndex, bossType) {
  return getRouteLevelRange(worldIndex, routeIndex, bossType, "hard", strongestTeamLevel(state));
}

function refreshHardRouteMap() {
  if (!currentState || currentState.campaignMode !== "hard") return;
  document.querySelectorAll("[data-route-world][data-route-index]").forEach((button) => {
    const worldIndex = Number(button.dataset.routeWorld);
    const routeIndex = Number(button.dataset.routeIndex);
    const route = getRouteDefinition(worldIndex, routeIndex);
    const levels = hardLevels(currentState, worldIndex, routeIndex, route.bossType);
    const levelCopy = button.querySelector("span");
    if (levelCopy) levelCopy.textContent = `NV. ${levels.minLevel}${levels.minLevel === levels.maxLevel ? "" : `–${levels.maxLevel}`}`;
    button.title = `Modo Hard · Chefe: ${route.boss.name} · NV. ${levels.bossLevel}`;
  });
}

function installRouteMapHardRefresh() {
  if (routeMapHardListenerInstalled) return;
  routeMapHardListenerInstalled = true;
  document.querySelector("#route-map-button")?.addEventListener("click", () => {
    window.requestAnimationFrame(refreshHardRouteMap);
  });
}

export function enhanceHardModeMarkup() {
  if (!document.querySelector("#hard-unlock-dialog")) {
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="hard-unlock-dialog" class="hard-unlock-dialog">
        <div class="hard-unlock-card">
          <div class="hard-unlock-trophy" aria-hidden="true">🏆</div>
          <small>JORNADA NORMAL CONCLUÍDA</small>
          <h2>PARABÉNS, VOCÊ CONQUISTOU TODOS OS NÍVEIS COM EXCELÊNCIA!</h2>
          <p>MODO HARD DESBLOQUEADO</p>
          <button id="hard-unlock-menu-button">VOLTAR AO MENU INICIAL</button>
        </div>
      </dialog>
    `);
  }
  installRouteMapHardRefresh();
}

function progressCopy(progress, mode) {
  if (progress.complete) return `${TOTAL_ROUTES}/${TOTAL_ROUTES} rotas concluídas · CAMPEÃO`;
  if (!progress.started && mode === "hard") return "Nova Jornada+ disponível";
  return `${progress.completedRoutes}/${TOTAL_ROUTES} rotas concluídas`;
}

export function renderCampaignMenu(state) {
  const normalButton = document.querySelector("#normal-mode-button");
  const hardButton = document.querySelector("#hard-mode-button");
  const normalStatus = document.querySelector("#normal-mode-status");
  const hardStatus = document.querySelector("#hard-mode-status");
  if (!normalButton || !hardButton) return;

  const normalProgress = getCampaignProgress(state, "normal");
  const hardProgress = getCampaignProgress(state, "hard");
  const hasStarted = Boolean(state.hasStarted);

  normalButton.disabled = !hasStarted;
  normalButton.classList.toggle("active", state.campaignMode === "normal");
  hardButton.disabled = !hasStarted || !state.hardModeUnlocked;
  hardButton.classList.toggle("active", state.campaignMode === "hard");

  if (normalStatus) normalStatus.textContent = hasStarted ? progressCopy(normalProgress, "normal") : "Comece uma nova jornada para liberar";
  if (hardStatus) {
    hardStatus.textContent = state.hardModeUnlocked
      ? progressCopy(hardProgress, "hard")
      : `Bloqueado · conclua as ${TOTAL_ROUTES} rotas normais`;
  }
}

export function decorateHardCapturedRoster(state) {
  const decorate = (selector, roster) => {
    document.querySelectorAll(`${selector} .team-card`).forEach((card, index) => {
      card.querySelector(".hard-caught-label")?.remove();
      if (!roster[index]?.capturedInHard) return;
      const info = card.querySelector(".team-card-info");
      info?.insertAdjacentHTML("beforeend", `<span class="hard-caught-label">◆ CAPTURADO NO HARD</span>`);
    });
  };
  decorate("#team-list", state.team || []);
  decorate("#storage-list", state.storage || []);
}

export function renderHardModeState(state) {
  currentState = state;
  const isHard = state.campaignMode === "hard";
  document.body.classList.toggle("hard-mode", isHard);

  const route = getRouteDefinition(state.journey?.worldIndex, state.journey?.routeIndex);
  const heading = document.querySelector(".journey-heading");
  let chip = document.querySelector("#hard-campaign-chip");
  if (isHard && heading && !chip) {
    heading.insertAdjacentHTML("afterbegin", `<span id="hard-campaign-chip" class="hard-campaign-chip">MODO HARD</span>`);
    chip = document.querySelector("#hard-campaign-chip");
  }
  if (chip) chip.hidden = !isHard;

  if (isHard) {
    const levels = hardLevels(state, route.worldIndex, route.routeIndex, route.bossType);
    const bossLabel = route.bossType === "final" ? "BOSS FINAL" : "MINI BOSS";
    const environmentLabel = document.querySelector("#environment-label");
    const routeLevels = document.querySelector("#route-levels");
    const routeHudLabel = document.querySelector("#route-hud-label");
    const routeHudBoss = document.querySelector("#route-hud-boss");
    const modeBadge = document.querySelector("#mode-badge");

    if (environmentLabel) environmentLabel.textContent = `MODO HARD · DIFICULDADE ${route.worldIndex + 1} · ${route.environment.name.toUpperCase()}`;
    if (routeLevels) routeLevels.textContent = `NV. ${levels.minLevel}${levels.minLevel === levels.maxLevel ? "" : `–${levels.maxLevel}`}`;
    if (routeHudLabel && !state.journey?.complete) routeHudLabel.textContent = `HARD · ROTA ${route.routeNumber} · NV. ${levels.minLevel}${levels.minLevel === levels.maxLevel ? "" : `–${levels.maxLevel}`}`;
    if (routeHudBoss) routeHudBoss.textContent = `${bossLabel}: ${route.boss.name} · NV. ${levels.bossLevel}`;
    if (modeBadge && !state.journey?.complete && !state.revisit?.active) modeBadge.textContent = `HARD · ${modeBadge.textContent.replace(/^HARD · /, "")}`;
  }

  if (document.querySelector("#route-map-dialog")?.open) refreshHardRouteMap();

  const dialog = document.querySelector("#hard-unlock-dialog");
  if (!dialog) return;
  const shouldOpen = Boolean(state.hardUnlockCelebrationPending && state.campaignMode === "normal");
  if (shouldOpen && !dialog.open) dialog.showModal();
  if (!shouldOpen && dialog.open) dialog.close();
}

export function isHardUnlockScreenOpen() {
  return Boolean(document.querySelector("#hard-unlock-dialog")?.open);
}
