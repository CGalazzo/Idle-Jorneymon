import "../styles/champions-hall.css";
import { loadOfficialPokemonData } from "../data/battle-data.js";
import {
  CHAMPIONS_HALL_BACKGROUND,
  CHAMPIONS_HALL_CAPTURE_CHANCE,
  CHAMPIONS_HALL_LEVEL,
  CHAMPIONS_HALL_SPECIES
} from "../data/champions-hall-data.js";
import { loadOfficialPokemonMetrics } from "../data/pokemon-metrics.js";
import {
  acknowledgeChampionsHallUnlock,
  canStartChampionsHall,
  finishChampionsHallSession,
  startChampionsHallSession
} from "../systems/champions-hall.js";
import { saveGame } from "../systems/save.js";

let installed = false;
let currentState = null;

function renderChampionsHallCaptureOptions(state) {
  if (!state.championsHall?.active || state.mode !== "capture") return;
  const root = document.querySelector("#capture-ball-options");
  if (root) {
    root.innerHTML = `<button id="try-capture" class="champions-hall-capture-button">TENTAR CAPTURA — ${CHAMPIONS_HALL_CAPTURE_CHANCE}%<span>Chance fixa · sem consumir Poké Bolas</span></button>`;
  }
  const captureCopy = document.querySelector("#capture-panel > p");
  if (captureCopy) captureCopy.textContent = "Todos os Pokémon deste salão são shiny e nível 100. Tente a captura especial ou deixe o encontro seguir.";
}

function restoreNormalCaptureCopy() {
  const captureCopy = document.querySelector("#capture-panel > p");
  if (captureCopy) captureCopy.textContent = "Escolha como tentar adicionar este Pokémon à sua equipe.";
}

function decorateChampionsHallRoster() {
  if (!currentState) return;
  const decorate = (selector, roster) => {
    document.querySelectorAll(`${selector} .team-card`).forEach((card, index) => {
      card.querySelector(".champions-hall-caught-label")?.remove();
      const pokemon = roster[index];
      if (!pokemon?.capturedInChampionsHall) return;
      card.querySelector(".team-card-info")?.insertAdjacentHTML("beforeend", `<span class="champions-hall-caught-label">◆ CAPTURADO NO SALÃO DOS CAMPEÕES</span>`);
    });
  };
  decorate("#team-list", currentState.team || []);
  decorate("#storage-list", currentState.storage || []);
}

function installEvents() {
  if (installed) return;
  installed = true;

  document.querySelector("#champions-hall-button")?.addEventListener("click", () => {
    if (!currentState || !canStartChampionsHall(currentState)) return;
    const campaignButton = document.querySelector(currentState.campaignMode === "hard" ? "#hard-mode-button" : "#normal-mode-button");
    campaignButton?.click();
    if (!startChampionsHallSession(currentState)) return;
    saveGame(currentState);
  });

  document.querySelector("#champions-hall-exit-button")?.addEventListener("click", () => {
    if (!currentState?.championsHall?.active) return;
    if (!window.confirm("Deseja sair do Salão dos Campeões? Todas as capturas serão mantidas.")) return;
    finishChampionsHallSession(currentState);
    saveGame(currentState);
    renderChampionsHallState(currentState);
    document.querySelector("#menu-button")?.click();
  });

  document.querySelector("#champions-hall-unlock-menu-button")?.addEventListener("click", () => {
    if (!currentState) return;
    acknowledgeChampionsHallUnlock(currentState);
    saveGame(currentState);
    document.querySelector("#champions-hall-unlock-dialog")?.close();
    document.querySelector("#menu-button")?.click();
  });

  document.querySelector("#champions-hall-unlock-dialog")?.addEventListener("cancel", (event) => event.preventDefault());

  document.querySelector("#team-button")?.addEventListener("click", () => {
    window.requestAnimationFrame(decorateChampionsHallRoster);
  });
}

export function enhanceChampionsHallMarkup() {
  const hardActions = document.querySelector("#hard-menu-actions");
  if (hardActions && !document.querySelector("#champions-hall-button")) {
    hardActions.insertAdjacentHTML("beforeend", `
      <button id="champions-hall-button" class="champions-hall-button" hidden>
        SALÃO DOS CAMPEÕES
        <small>Recompensa máxima do Modo Hard</small>
      </button>`);
  }

  if (!document.querySelector("#champions-hall-unlock-dialog")) {
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="champions-hall-unlock-dialog" class="champions-hall-unlock-dialog">
        <div class="champions-hall-unlock-card">
          <div class="champions-hall-unlock-trophy" aria-hidden="true">🏆</div>
          <small>MODO HARD CONCLUÍDO</small>
          <h2>VOCÊ SE TORNOU UM CAMPEÃO HARD!</h2>
          <p>Agora você terá acesso à recompensa máxima! Um lugar onde só os verdadeiros Campeões merecem estar! Boa sorte!</p>
          <button id="champions-hall-unlock-menu-button">VOLTAR AO MENU PRINCIPAL</button>
        </div>
      </dialog>`);
  }

  const scene = document.querySelector("#scene");
  if (scene && !document.querySelector("#champions-hall-hud")) {
    scene.insertAdjacentHTML("afterbegin", `
      <aside id="champions-hall-hud" class="champions-hall-hud" hidden>
        <span><small>ÁREA ESPECIAL</small><strong>SALÃO DOS CAMPEÕES</strong></span>
        <span><small>ENCONTROS</small><strong id="champions-hall-encounters">0</strong></span>
        <span><small>CAPTURAS</small><strong id="champions-hall-captures">0</strong></span>
        <button id="champions-hall-exit-button" class="champions-hall-exit-button">SAIR DO SALÃO</button>
      </aside>`);
  }

  installEvents();
  const ids = CHAMPIONS_HALL_SPECIES.map((pokemon) => pokemon.id);
  loadOfficialPokemonData(ids).catch(() => {});
  loadOfficialPokemonMetrics(ids).catch(() => {});
}

export function renderChampionsHallMenu(state) {
  currentState = state;
  const button = document.querySelector("#champions-hall-button");
  if (!button) return;
  const unlocked = Boolean(state.championsHall?.unlocked && !state.championsHall?.unlockCelebrationPending);
  button.hidden = !unlocked;
  button.disabled = !unlocked || !canStartChampionsHall(state);
  const copy = button.querySelector("small");
  if (copy) copy.textContent = state.championsHall?.active
    ? "Exploração em andamento"
    : `Lendários e Míticos · NV. ${CHAMPIONS_HALL_LEVEL} · todos shiny`;
}

export function renderChampionsHallState(state) {
  currentState = state;
  const active = Boolean(state.championsHall?.active);
  document.body.classList.toggle("champions-hall-active", active);

  const hud = document.querySelector("#champions-hall-hud");
  if (hud) hud.hidden = !active;

  if (active) {
    const scene = document.querySelector("#scene");
    if (scene) {
      scene.classList.remove("journey-complete", "boss-ready");
      scene.style.setProperty("--route-background", `url("${CHAMPIONS_HALL_BACKGROUND}")`);
      scene.dataset.environmentBackground = "champions-hall";
      const completePanel = document.querySelector("#journey-complete-panel");
      if (completePanel) completePanel.hidden = true;
    }

    const environmentLabel = document.querySelector("#environment-label");
    const areaName = document.querySelector("#area-name");
    const routeLevels = document.querySelector("#route-levels");
    const bossStatus = document.querySelector("#boss-status");
    const modeBadge = document.querySelector("#mode-badge");
    if (environmentLabel) environmentLabel.textContent = "RECOMPENSA MÁXIMA DO MODO HARD";
    if (areaName) areaName.textContent = "Salão dos Campeões";
    if (routeLevels) routeLevels.textContent = `NV. ${CHAMPIONS_HALL_LEVEL} · SHINY`;
    if (bossStatus) bossStatus.textContent = `CAPTURA FIXA: ${CHAMPIONS_HALL_CAPTURE_CHANCE}%`;
    if (modeBadge) modeBadge.textContent = "SALÃO DOS CAMPEÕES";
    const encounters = document.querySelector("#champions-hall-encounters");
    const captures = document.querySelector("#champions-hall-captures");
    if (encounters) encounters.textContent = String(state.championsHall.encounters || 0);
    if (captures) captures.textContent = String(state.championsHall.captures || 0);
    renderChampionsHallCaptureOptions(state);
  } else {
    restoreNormalCaptureCopy();
  }

  const unlockDialog = document.querySelector("#champions-hall-unlock-dialog");
  const shouldOpen = Boolean(
    state.championsHall?.unlockCelebrationPending
    && state.campaignMode === "hard"
    && !state.safari?.active
    && !active
  );
  if (unlockDialog) {
    if (shouldOpen && !unlockDialog.open) unlockDialog.showModal();
    if (!shouldOpen && unlockDialog.open) unlockDialog.close();
  }
}

export function isChampionsHallUnlockScreenOpen() {
  return Boolean(document.querySelector("#champions-hall-unlock-dialog")?.open);
}
