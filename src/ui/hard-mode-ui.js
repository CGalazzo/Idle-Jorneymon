import "../styles/hard-mode.css";
import { TOTAL_ROUTES } from "../data/worlds.js";
import { getCampaignProgress } from "../systems/campaign.js";

export function enhanceHardModeMarkup() {
  if (document.querySelector("#hard-unlock-dialog")) return;
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

export function renderHardModeState(state) {
  document.body.classList.toggle("hard-mode", state.campaignMode === "hard");
  const dialog = document.querySelector("#hard-unlock-dialog");
  if (!dialog) return;

  const shouldOpen = Boolean(state.hardUnlockCelebrationPending && state.campaignMode === "normal");
  if (shouldOpen && !dialog.open) dialog.showModal();
  if (!shouldOpen && dialog.open) dialog.close();
}

export function isHardUnlockScreenOpen() {
  return Boolean(document.querySelector("#hard-unlock-dialog")?.open);
}
