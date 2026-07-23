import "../styles/champions-hall.css";
import { loadOfficialPokemonData } from "../data/battle-data.js";
import { CHAMPIONS_HALL_CAPTURE_CHANCE, CHAMPIONS_HALL_SPECIES } from "../data/champions-hall-data.js";
import { loadOfficialPokemonMetrics } from "../data/pokemon-metrics.js";
import {
  acknowledgeChampionsHallUnlock,
  finishChampionsHall,
  startChampionsHall
} from "../systems/champions-hall.js";
import { saveGame } from "../systems/save.js";

let currentState = null;
let installed = false;
let backgroundPromise = null;

async function loadBackground() {
  if (!backgroundPromise) {
    backgroundPromise = fetch("/assets/champions-hall/champions-hall.webp.b64", { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((base64) => `url("data:image/webp;base64,${base64.trim()}")`);
  }
  return backgroundPromise;
}

function ensureTrack(scene) {
  let track = scene.querySelector(".champions-hall-track");
  if (!track) {
    track = document.createElement("div");
    track.className = "champions-hall-track";
    track.setAttribute("aria-hidden", "true");
    track.innerHTML = "<span></span><span></span><span></span><span></span>";
    scene.insertBefore(track, scene.firstChild);
  }
  return track;
}

async function applyBackground(active) {
  const scene = document.querySelector("#scene");
  if (!scene) return;
  if (!active) {
    scene.querySelector(".champions-hall-track")?.remove();
    scene.style.removeProperty("--champions-hall-background");
    return;
  }
  ensureTrack(scene);
  try {
    const background = await loadBackground();
    if (currentState?.championsHall?.active) scene.style.setProperty("--champions-hall-background", background);
  } catch (error) {
    console.warn("Idle Jorneymon: não foi possível carregar o Salão dos Campeões.", error);
  }
}

function renderCaptureOptions(state) {
  if (!state.championsHall?.active || state.mode !== "capture") return;
  const root = document.querySelector("#capture-ball-options");
  if (root) {
    root.innerHTML = `<button id="try-capture" class="champions-hall-capture-button">TENTAR CAPTURA — ${CHAMPIONS_HALL_CAPTURE_CHANCE}%<span>Chance fixa do Salão dos Campeões · nenhuma bola é consumida</span></button>`;
  }
  const copy = document.querySelector("#capture-panel > p");
  if (copy) copy.textContent = "Tente capturar este Campeão shiny ou deixe-o seguir. A chance é sempre de 5%.";
}

function restoreCaptureCopy() {
  const copy = document.querySelector("#capture-panel > p");
  if (copy) copy.textContent = "Escolha como tentar adicionar este Pokémon à sua equipe.";
}

function installEvents() {
  if (installed) return;
  installed = true;

  document.querySelector("#champions-hall-menu-button")?.addEventListener("click", () => {
    if (!currentState?.championsHall?.unlocked) return;
    document.querySelector("#champions-hall-entry-dialog")?.showModal();
  });

  document.querySelector("#champions-hall-cancel")?.addEventListener("click", () => {
    document.querySelector("#champions-hall-entry-dialog")?.close();
  });

  document.querySelector("#champions-hall-enter")?.addEventListener("click", () => {
    if (!currentState || !startChampionsHall(currentState)) return;
    saveGame(currentState);
    document.querySelector("#champions-hall-entry-dialog")?.close();
    document.querySelector("#hard-mode-button")?.click();
  });

  document.querySelector("#champions-hall-exit-button")?.addEventListener("click", () => {
    if (!currentState?.championsHall?.active) return;
    if (!window.confirm("Deseja sair do Salão dos Campeões? Todas as capturas serão mantidas.")) return;
    finishChampionsHall(currentState);
    saveGame(currentState);
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
}

export function enhanceChampionsHallMarkup() {
  const actions = document.querySelector(".journey-menu-actions");
  if (actions && !document.querySelector("#champions-hall-menu-button")) {
    actions.insertAdjacentHTML("afterbegin", `<button id="champions-hall-menu-button" class="champions-hall-menu-button" hidden><strong>SALÃO DOS CAMPEÕES</strong><small>Lendários e Míticos shiny · NV. 100 · captura 5%</small></button>`);
  }

  if (!document.querySelector("#champions-hall-entry-dialog")) {
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="champions-hall-entry-dialog" class="champions-hall-entry-dialog">
        <div class="champions-hall-card"><small>RECOMPENSA MÁXIMA</small><h2>Salão dos Campeões</h2><p>Um lugar reservado aos verdadeiros Campeões. Todos os encontros são Lendários ou Míticos, nível 100 e obrigatoriamente shiny.</p><div class="champions-hall-rules"><span>Sem limite de tempo</span><span>Todos shiny</span><span>Captura fixa: 5%</span></div><button id="champions-hall-cancel">CANCELAR</button> <button id="champions-hall-enter">ENTRAR NO SALÃO</button></div>
      </dialog>
      <dialog id="champions-hall-unlock-dialog" class="champions-hall-unlock-dialog">
        <div class="champions-hall-card"><div aria-hidden="true" style="font-size:3rem">🏆</div><small>MODO HARD CONCLUÍDO</small><h2>PARABÉNS, CAMPEÃO!</h2><p>Agora você terá acesso à recompensa máxima! Um lugar onde só os verdadeiros Campeões merecem estar! Boa sorte!</p><button id="champions-hall-unlock-menu-button">VOLTAR AO MENU PRINCIPAL</button></div>
      </dialog>`);
  }

  const scene = document.querySelector("#scene");
  if (scene && !document.querySelector("#champions-hall-hud")) {
    scene.parentElement?.insertBefore(document.createRange().createContextualFragment(`<aside id="champions-hall-hud" class="champions-hall-hud" hidden><span><small>LOCAL</small><strong>SALÃO DOS CAMPEÕES</strong></span><span><small>ENCONTROS</small><strong id="champions-hall-encounters">0</strong></span><span><small>CAPTURAS</small><strong id="champions-hall-captures">0</strong></span><button id="champions-hall-exit-button" class="champions-hall-exit-button">SAIR DO SALÃO</button></aside>`), scene);
  }

  installEvents();
  const ids = CHAMPIONS_HALL_SPECIES.map((pokemon) => pokemon.id);
  loadOfficialPokemonData(ids).catch(() => {});
  loadOfficialPokemonMetrics(ids).catch(() => {});
}

export function renderChampionsHallMenu(state) {
  currentState = state;
  const button = document.querySelector("#champions-hall-menu-button");
  if (!button) return;
  button.hidden = !state.championsHall?.unlocked;
  button.disabled = Boolean(state.championsHall?.active);
}

export function renderChampionsHallState(state) {
  currentState = state;
  const active = Boolean(state.championsHall?.active);
  document.body.classList.toggle("champions-hall-active", active);
  const hud = document.querySelector("#champions-hall-hud");
  if (hud) hud.hidden = !active;
  applyBackground(active);

  if (active) {
    document.querySelector("#environment-label").textContent = "SALÃO DOS CAMPEÕES";
    document.querySelector("#area-name").textContent = "Salão dos Campeões";
    document.querySelector("#route-levels").textContent = "NV. 100 · TODOS SHINY";
    document.querySelector("#boss-status").textContent = "CAPTURA FIXA: 5%";
    document.querySelector("#mode-badge").textContent = "SALÃO DOS CAMPEÕES";
    const routeHudLabel = document.querySelector("#route-hud-label");
    const routeHudBoss = document.querySelector("#route-hud-boss");
    if (routeHudLabel) routeHudLabel.textContent = "PÓS-JOGO HARD · SEM LIMITE DE TEMPO";
    if (routeHudBoss) routeHudBoss.textContent = "LENDÁRIOS E MÍTICOS SHINY · NV. 100";
    document.querySelector("#champions-hall-encounters").textContent = state.championsHall.encounters;
    document.querySelector("#champions-hall-captures").textContent = state.championsHall.captures;
    renderCaptureOptions(state);
  } else {
    restoreCaptureCopy();
  }

  const dialog = document.querySelector("#champions-hall-unlock-dialog");
  const shouldOpen = Boolean(state.championsHall?.unlockCelebrationPending && !state.championsHall?.active);
  if (shouldOpen && !dialog?.open) dialog?.showModal();
  if (!shouldOpen && dialog?.open) dialog.close();
}

export function isChampionsHallUnlockOpen() {
  return Boolean(document.querySelector("#champions-hall-unlock-dialog")?.open);
}
