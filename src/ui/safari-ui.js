import "../styles/safari.css";
import { loadOfficialPokemonData } from "../data/battle-data.js";
import { COMPLETE_POKEDEX_SPECIES } from "../data/pokedex-data.js";
import { loadOfficialPokemonMetrics } from "../data/pokemon-metrics.js";
import {
  SAFARI_BALLS_PER_SESSION,
  SAFARI_CAPTURE_CHANCE,
  SAFARI_ENTRY_PRICE,
  SAFARI_HABITATS,
  SAFARI_SPECIES,
  getSafariHabitat
} from "../data/safari-data.js";
import { SCENE_BACKGROUNDS } from "../data/scene-backgrounds.js";
import {
  canStartSafari,
  clearSafariResult,
  finishSafariSession,
  safariRemainingMs,
  startSafariSession,
  updateSafariSession
} from "../systems/safari.js";
import { saveGame } from "../systems/save.js";
import { decoratePokedexLocations } from "./pokedex-locations-ui.js";

let installed = false;
let currentState = null;
let selectedHabitatId = SAFARI_HABITATS[0]?.id || null;

function formatCoins(value) {
  return Math.max(0, Number(value) || 0).toLocaleString("pt-BR");
}

function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function typeMarkup(type = "Normal") {
  return String(type).split("/").map((entry) => `<i>${entry}</i>`).join("");
}

function renderCompletePokedex(state) {
  const grid = document.querySelector("#pokedex-grid");
  if (!grid) return;
  let seenTotal = 0;
  let caughtTotal = 0;
  grid.innerHTML = COMPLETE_POKEDEX_SPECIES.map((pokemon) => {
    const entry = state.pokedex?.[pokemon.id] || { seen: 0, caught: 0 };
    if (entry.seen) seenTotal += 1;
    if (entry.caught) caughtTotal += 1;
    const status = entry.caught ? "captured" : entry.seen ? "seen" : "unknown";
    const shinyCopy = entry.shinyCaught ? ` · ✨ ${entry.shinyCaught}` : "";
    const label = entry.caught
      ? `${entry.caught} capturado${entry.caught > 1 ? "s" : ""}${shinyCopy}`
      : entry.seen ? "Visto" : "Não encontrado";
    return `<article class="dex-card ${status}">
      <span class="dex-number">#${String(pokemon.id).padStart(3, "0")}</span>
      <img src="${pokemon.sprite}" alt="${status === "unknown" ? "Pokémon desconhecido" : pokemon.name}" />
      <strong>${status === "unknown" ? "???" : pokemon.name}</strong>
      ${status === "unknown" ? "" : `<span class="dex-types">${typeMarkup(pokemon.type)}</span>`}
      <small>${label}</small>
    </article>`;
  }).join("");
  document.querySelector("#seen-total").textContent = `${seenTotal} de ${COMPLETE_POKEDEX_SPECIES.length} vistos`;
  document.querySelector("#caught-total").textContent = `${caughtTotal} espécies capturadas`;
  decoratePokedexLocations();
}

function decorateSafariRoster() {
  if (!currentState) return;
  const decorate = (selector, roster) => {
    document.querySelectorAll(`${selector} .team-card`).forEach((card, index) => {
      card.querySelector(".safari-caught-label")?.remove();
      const pokemon = roster[index];
      if (!pokemon?.capturedInSafari && !pokemon?.safariEncounter) return;
      card.querySelector(".team-card-info")?.insertAdjacentHTML("beforeend", `<span class="safari-caught-label">◆ CAPTURADO NA ZONA SAFARI</span>`);
    });
  };
  decorate("#team-list", currentState.team || []);
  decorate("#storage-list", currentState.storage || []);
}

function habitatCards() {
  return SAFARI_HABITATS.map((habitat) => `
    <button class="safari-habitat ${habitat.id === selectedHabitatId ? "selected" : ""}" data-safari-habitat="${habitat.id}">
      <strong>${habitat.name}</strong>
      <small>${habitat.types}</small>
      <span>${habitat.description}</span>
    </button>`).join("");
}

function refreshHabitatSelection() {
  document.querySelectorAll("[data-safari-habitat]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.safariHabitat === selectedHabitatId);
  });
}

function updateSafariStartState() {
  const button = document.querySelector("#start-safari-session");
  const feedback = document.querySelector("#safari-entry-feedback");
  if (!button || !currentState) return;
  const hasCoins = Number(currentState.shop?.coins) >= SAFARI_ENTRY_PRICE;
  const safeMode = currentState.mode === "exploring" && !currentState.pendingEvolutionChoices?.length;
  button.disabled = !selectedHabitatId || !canStartSafari(currentState);
  if (feedback) {
    feedback.textContent = !hasCoins
      ? `Você precisa de ${formatCoins(SAFARI_ENTRY_PRICE)} PokéCoins. Saldo atual: ${formatCoins(currentState.shop?.coins)}.`
      : !safeMode
        ? "Termine a batalha, captura ou evolução antes de entrar."
        : `Entrada disponível · saldo após a compra: ${formatCoins(Number(currentState.shop?.coins) - SAFARI_ENTRY_PRICE)} PokéCoins.`;
  }
}

function installEvents() {
  if (installed) return;
  installed = true;

  document.querySelector("#safari-menu-button")?.addEventListener("click", () => {
    if (!currentState?.hasStarted) return;
    selectedHabitatId = selectedHabitatId || SAFARI_HABITATS[0]?.id;
    refreshHabitatSelection();
    updateSafariStartState();
    document.querySelector("#safari-dialog")?.showModal();
  });

  document.querySelector("#safari-dialog")?.addEventListener("click", (event) => {
    const habitatButton = event.target.closest("[data-safari-habitat]");
    if (habitatButton) {
      selectedHabitatId = habitatButton.dataset.safariHabitat;
      refreshHabitatSelection();
      updateSafariStartState();
      return;
    }
    if (event.target.id === "safari-dialog") event.currentTarget.close();
  });

  document.querySelector("#close-safari")?.addEventListener("click", () => document.querySelector("#safari-dialog")?.close());
  document.querySelector("#cancel-safari")?.addEventListener("click", () => document.querySelector("#safari-dialog")?.close());

  document.querySelector("#start-safari-session")?.addEventListener("click", () => {
    if (!currentState || !startSafariSession(currentState, selectedHabitatId)) {
      updateSafariStartState();
      return;
    }
    saveGame(currentState);
    document.querySelector("#safari-dialog")?.close();
    const campaignButton = document.querySelector(currentState.campaignMode === "hard" ? "#hard-mode-button" : "#normal-mode-button");
    campaignButton?.click();
  });

  document.querySelector("#safari-exit-button")?.addEventListener("click", () => {
    if (!currentState?.safari?.active) return;
    if (!window.confirm("Deseja sair da Zona Safari? Todas as capturas serão mantidas.")) return;
    finishSafariSession(currentState, "exit");
    saveGame(currentState);
    renderSafariState(currentState);
  });

  document.querySelector("#safari-result-menu-button")?.addEventListener("click", () => {
    if (!currentState) return;
    clearSafariResult(currentState);
    saveGame(currentState);
    document.querySelector("#safari-result-dialog")?.close();
    document.querySelector("#menu-button")?.click();
  });

  document.querySelector("#pokedex-button")?.addEventListener("click", () => {
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => renderCompletePokedex(currentState)));
  });

  document.querySelector("#team-button")?.addEventListener("click", () => {
    window.requestAnimationFrame(decorateSafariRoster);
  });
}

export function enhanceSafariMarkup() {
  const menuActions = document.querySelector(".journey-menu-actions");
  if (menuActions && !document.querySelector("#safari-menu-button")) {
    menuActions.insertAdjacentHTML("afterbegin", `
      <button id="safari-menu-button" class="safari-menu-button">
        ZONA SAFARI
        <small>Capture Pokémon raros sem alterar as rotas</small>
      </button>`);
  }

  if (!document.querySelector("#safari-dialog")) {
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="safari-dialog" class="safari-dialog">
        <div class="dialog-heading"><div><small>EXPEDIÇÃO DE CAPTURA</small><h2>Zona Safari</h2></div><button id="close-safari" class="icon-button" aria-label="Fechar Zona Safari">×</button></div>
        <p class="safari-intro">Escolha um habitat. A sessão não possui rotas, minibosses ou objetivo de conclusão. Você mantém todas as capturas realizadas.</p>
        <div class="safari-rules">
          <span>Entrada: ${formatCoins(SAFARI_ENTRY_PRICE)} PokéCoins</span>
          <span>15 minutos</span>
          <span>${SAFARI_BALLS_PER_SESSION} Safari Balls</span>
          <span>Captura fixa: ${SAFARI_CAPTURE_CHANCE}%</span>
          <span>Shiny: 1/128</span>
          <span>25% do XP · sem moedas</span>
        </div>
        <div class="safari-habitat-grid">${habitatCards()}</div>
        <p id="safari-entry-feedback" class="safari-intro"></p>
        <div class="safari-dialog-actions"><button id="cancel-safari" class="safari-cancel-button">CANCELAR</button><button id="start-safari-session" class="safari-start-button">COMPRAR INGRESSO E ENTRAR</button></div>
      </dialog>
      <dialog id="safari-result-dialog" class="safari-result-dialog">
        <div class="safari-result-card">
          <span aria-hidden="true">🧭</span>
          <small>EXPEDIÇÃO ENCERRADA</small>
          <h2 id="safari-result-title">Zona Safari concluída</h2>
          <p id="safari-result-reason"></p>
          <div class="safari-result-stats"><div><strong id="safari-result-encounters">0</strong><small>ENCONTROS</small></div><div><strong id="safari-result-captures">0</strong><small>CAPTURAS</small></div><div><strong id="safari-result-balls">0</strong><small>BOLAS USADAS</small></div></div>
          <button id="safari-result-menu-button">VOLTAR AO MENU</button>
        </div>
      </dialog>`);
  }

  const scene = document.querySelector("#scene");
  if (scene && !document.querySelector("#safari-hud")) {
    scene.insertAdjacentHTML("afterbegin", `
      <aside id="safari-hud" class="safari-hud" hidden>
        <span><small>HABITAT</small><strong id="safari-hud-habitat">Zona Safari</strong></span>
        <span><small>TEMPO</small><strong id="safari-hud-time">15:00</strong></span>
        <span><small>SAFARI BALLS</small><strong id="safari-hud-balls">30</strong></span>
        <button id="safari-exit-button" class="safari-exit-button">SAIR DO SAFARI</button>
      </aside>`);
  }

  installEvents();
  loadOfficialPokemonData(SAFARI_SPECIES.map((pokemon) => pokemon.id)).catch(() => {});
  loadOfficialPokemonMetrics(SAFARI_SPECIES.map((pokemon) => pokemon.id)).catch(() => {});
}

export function renderSafariMenu(state) {
  currentState = state;
  const button = document.querySelector("#safari-menu-button");
  if (!button) return;
  button.disabled = !state.hasStarted || Boolean(state.safari?.active);
  const copy = button.querySelector("small");
  if (copy) copy.textContent = state.safari?.active
    ? "Sessão em andamento"
    : `Entrada: ${formatCoins(SAFARI_ENTRY_PRICE)} PokéCoins · Saldo: ${formatCoins(state.shop?.coins)}`;
  updateSafariStartState();
}

export function renderSafariState(state, now = Date.now()) {
  currentState = state;
  const ended = updateSafariSession(state, now);
  if (ended) saveGame(state);

  const active = Boolean(state.safari?.active);
  document.body.classList.toggle("safari-active", active);
  const hud = document.querySelector("#safari-hud");
  if (hud) hud.hidden = !active;

  if (active) {
    const habitat = getSafariHabitat(state.safari.habitatId) || SAFARI_HABITATS[0];
    const scene = document.querySelector("#scene");
    const background = SCENE_BACKGROUNDS.bosque;
    if (scene && background) {
      scene.style.setProperty("--route-background", `url("${background}")`);
      scene.dataset.environmentBackground = `safari:${habitat.id}`;
    }
    document.querySelector("#environment-label").textContent = `ZONA SAFARI · ${habitat.name.toUpperCase()}`;
    document.querySelector("#area-name").textContent = habitat.name;
    document.querySelector("#route-levels").textContent = "SHINY 1/128";
    document.querySelector("#boss-status").textContent = "SEM OBJETIVO DE ROTA";
    document.querySelector("#mode-badge").textContent = "ZONA SAFARI";
    document.querySelector("#safari-hud-habitat").textContent = habitat.name;
    document.querySelector("#safari-hud-time").textContent = formatTime(safariRemainingMs(state, now));
    document.querySelector("#safari-hud-balls").textContent = state.safari.ballsRemaining;
  }

  const result = state.safari?.lastResult;
  const resultDialog = document.querySelector("#safari-result-dialog");
  if (result && resultDialog) {
    const reasonCopy = result.reason === "balls"
      ? "As 30 Safari Balls acabaram e a sessão foi encerrada automaticamente."
      : result.reason === "time"
        ? "Os 15 minutos terminaram."
        : "Você encerrou a expedição antes do limite.";
    document.querySelector("#safari-result-title").textContent = result.habitatName;
    document.querySelector("#safari-result-reason").textContent = reasonCopy;
    document.querySelector("#safari-result-encounters").textContent = result.encounters;
    document.querySelector("#safari-result-captures").textContent = result.captures;
    document.querySelector("#safari-result-balls").textContent = result.ballsUsed;
    if (!resultDialog.open) resultDialog.showModal();
  }
}
