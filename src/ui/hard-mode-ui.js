import "../styles/hard-mode.css";
import "../styles/hard-mode-phase2.css";
import { getHardChallenge } from "../data/hard-endgame-data.js";
import { getHardBossTemplate } from "../data/hard-mode-data.js";
import { POKEDEX_SPECIES } from "../data/pokemon.js";
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

function hardBoss(route) {
  return getHardBossTemplate(route, POKEDEX_SPECIES);
}

function refreshHardRouteMap() {
  if (!currentState || currentState.campaignMode !== "hard") return;
  document.querySelectorAll("[data-route-world][data-route-index]").forEach((button) => {
    const worldIndex = Number(button.dataset.routeWorld);
    const routeIndex = Number(button.dataset.routeIndex);
    const route = getRouteDefinition(worldIndex, routeIndex);
    const levels = hardLevels(currentState, worldIndex, routeIndex, route.bossType);
    const boss = hardBoss(route);
    const levelCopy = button.querySelector("span");
    if (levelCopy) levelCopy.textContent = `NV. ${levels.minLevel}${levels.minLevel === levels.maxLevel ? "" : `–${levels.maxLevel}`}`;
    button.title = `Modo Hard · Chefe: ${boss.name} · NV. ${levels.bossLevel}`;
  });
}

function installRouteMapHardRefresh() {
  if (routeMapHardListenerInstalled) return;
  routeMapHardListenerInstalled = true;
  document.querySelector("#route-map-button")?.addEventListener("click", () => {
    window.requestAnimationFrame(refreshHardRouteMap);
  });
}

function battleStatus(pokemon) {
  if (!pokemon) return "";
  const labels = [];
  if (pokemon.isMega) labels.push("MEGA EVOLUÇÃO");
  if (pokemon.hardSecondPhase) labels.push("FASE 2");
  if (pokemon.hardExclusive) labels.push("EXCLUSIVO HARD");
  return labels.join(" · ");
}

function decorateBattleCard(card, pokemon) {
  if (!card) return;
  let label = card.querySelector(".hard-battle-status");
  const status = battleStatus(pokemon);
  if (status && !label) {
    card.querySelector(".pokemon-info")?.insertAdjacentHTML("beforeend", `<span class="hard-battle-status"></span>`);
    label = card.querySelector(".hard-battle-status");
  }
  if (label) {
    label.textContent = status;
    label.hidden = !status;
  }
  card.classList.toggle("hard-second-phase", Boolean(pokemon?.hardSecondPhase));
  card.classList.toggle("hard-mega-boss", Boolean(pokemon?.isBoss && pokemon?.isMega));
}

function decorateHardBattle(state) {
  if (state.mode === "battle") {
    decorateBattleCard(document.querySelector("#battle-stage .enemy-card"), state.enemy);
    decorateBattleCard(document.querySelector("#battle-stage .player-card"), state.team?.[state.activeTeamIndex]);
  }

  let captureLabel = document.querySelector("#hard-exclusive-capture-label");
  const showExclusive = state.mode === "capture" && Boolean(state.enemy?.hardExclusive);
  if (showExclusive && !captureLabel) {
    document.querySelector("#capture-title")?.insertAdjacentHTML("afterend", `<span id="hard-exclusive-capture-label" class="hard-exclusive-capture-label">◆ POKÉMON EXCLUSIVO DO MODO HARD</span>`);
    captureLabel = document.querySelector("#hard-exclusive-capture-label");
  }
  if (captureLabel) captureLabel.hidden = !showExclusive;
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
      const pokemon = roster[index];
      if (!pokemon?.capturedInHard) return;
      const info = card.querySelector(".team-card-info");
      const copy = pokemon.hardExclusive ? "◆ EXCLUSIVO DO HARD" : "◆ CAPTURADO NO HARD";
      info?.insertAdjacentHTML("beforeend", `<span class="hard-caught-label">${copy}</span>`);
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
  const chipCopy = state.hardEndgame?.championBadgeOwned ? "MODO HARD · CAMPEÃO" : "MODO HARD";
  if (isHard && heading && !chip) {
    heading.insertAdjacentHTML("afterbegin", `<span id="hard-campaign-chip" class="hard-campaign-chip">${chipCopy}</span>`);
    chip = document.querySelector("#hard-campaign-chip");
  }
  if (chip) {
    chip.hidden = !isHard;
    chip.textContent = chipCopy;
  }

  if (isHard) {
    const levels = hardLevels(state, route.worldIndex, route.routeIndex, route.bossType);
    const bossLabel = route.bossType === "final" ? "BOSS FINAL" : "MINI BOSS";
    const boss = hardBoss(route);
    const bossReady = state.area.regularVictories >= state.area.requiredVictories && !state.area.bossDefeated;
    const activeChallenge = getHardChallenge(state.hardEndgame?.activeChallengeId);
    const environmentLabel = document.querySelector("#environment-label");
    const routeLevels = document.querySelector("#route-levels");
    const routeHudLabel = document.querySelector("#route-hud-label");
    const routeHudBoss = document.querySelector("#route-hud-boss");
    const bossStatus = document.querySelector("#boss-status");
    const modeBadge = document.querySelector("#mode-badge");

    state.area.bossName = boss.name;
    if (activeChallenge) {
      if (environmentLabel) environmentLabel.textContent = `DESAFIO HARD · ${activeChallenge.name.toUpperCase()}`;
      if (routeLevels) routeLevels.textContent = "NV. 100";
      if (routeHudLabel) routeHudLabel.textContent = "PÓS-JOGO · DESAFIO DE CAMPEÃO";
      if (routeHudBoss) routeHudBoss.textContent = `${activeChallenge.subtitle} · NV. 100`;
      if (bossStatus) bossStatus.textContent = "DESAFIO EM ANDAMENTO";
      if (modeBadge) modeBadge.textContent = "DESAFIO HARD";
    } else {
      if (environmentLabel) environmentLabel.textContent = `MODO HARD · DIFICULDADE ${route.worldIndex + 1} · ${route.environment.name.toUpperCase()}`;
      if (routeLevels) routeLevels.textContent = `NV. ${levels.minLevel}${levels.minLevel === levels.maxLevel ? "" : `–${levels.maxLevel}`}`;
      if (routeHudLabel && !state.journey?.complete) routeHudLabel.textContent = `HARD · ROTA ${route.routeNumber} · NV. ${levels.minLevel}${levels.minLevel === levels.maxLevel ? "" : `–${levels.maxLevel}`}`;
      if (routeHudBoss) routeHudBoss.textContent = `${bossLabel}: ${boss.name} · NV. ${levels.bossLevel}`;
      if (bossStatus) bossStatus.textContent = state.area.bossDefeated
        ? `${bossLabel} derrotado`
        : bossReady ? `${bossLabel} disponível` : `${bossLabel}: ${boss.name}`;
      if (modeBadge && !state.journey?.complete && !state.revisit?.active) modeBadge.textContent = `HARD · ${modeBadge.textContent.replace(/^HARD · /, "")}`;
    }
  }

  decorateHardBattle(state);
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
