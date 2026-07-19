import "./styles/base.css";
import "./styles/progression.css";
import { startNewJourney } from "./core/game-state.js";
import { loadOfficialPokemonData } from "./data/battle-data.js";
import { POKEDEX_SPECIES } from "./data/pokemon.js";
import { createAppMarkup, render as renderBase, renderTeam } from "./ui/render.js";
import { enhanceProgressionMarkup, renderProgression } from "./ui/progression-ui.js";
import { updateApproach, updateExploration } from "./systems/exploration.js";
import { updateBattle, updateRecovery } from "./systems/battle.js";
import { hasSavedGame, loadGame, resetGame, saveGame } from "./systems/save.js";
import { addToTeam, sendToStorage, setActivePokemon, setTeamPosition } from "./systems/team.js";
import { attemptCapture, declineCapture } from "./systems/capture.js";

async function boot() {
  const app = document.querySelector("#app");
  app.innerHTML = '<div class="game-loading"><strong>Preparando a jornada...</strong><span>Carregando atributos oficiais dos Pokémon</span></div>';
  await loadOfficialPokemonData(POKEDEX_SPECIES.map((pokemon) => pokemon.id));
  app.innerHTML = createAppMarkup();
  enhanceProgressionMarkup();

  function memoizeInnerHTML(element) {
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    if (!element || !descriptor?.get || !descriptor?.set) return;

    let previousValue = descriptor.get.call(element);
    Object.defineProperty(element, "innerHTML", {
      configurable: true,
      get() {
        return descriptor.get.call(this);
      },
      set(value) {
        const nextValue = String(value);
        if (nextValue === previousValue) return;
        previousValue = nextValue;
        descriptor.set.call(this, nextValue);
      }
    });
  }

  [
    "#pokedex-grid",
    "#team-list",
    "#storage-list",
    "#team-mini",
    "#activity-log"
  ].forEach((selector) => memoizeInnerHTML(document.querySelector(selector)));

  let state = loadGame();
  let lastFrame = performance.now();
  let lastSave = performance.now();
  let isMenuOpen = false;
  let isTeamOpen = false;

  const welcomeScreen = document.querySelector("#welcome-screen");
  const splashScreen = document.querySelector("#splash-screen");
  const starterCard = document.querySelector("#starter-card");
  const starterSelection = document.querySelector("#starter-selection");
  const continueButton = document.querySelector("#continue-button");

  function renderGame() {
    renderBase(state);
    renderProgression(state);
  }

  function showGame() {
    isMenuOpen = false;
    welcomeScreen.classList.add("is-hidden");
    document.body.classList.remove("welcome-open");
    lastFrame = performance.now();
    renderGame();
  }

  function showWelcome() {
    isMenuOpen = true;
    saveGame(state);
    welcomeScreen.classList.remove("is-hidden");
    document.body.classList.add("welcome-open");
    splashScreen.hidden = false;
    starterCard.hidden = true;
    continueButton.hidden = !hasSavedGame();
  }

  function showStarterSelection() {
    splashScreen.hidden = true;
    starterCard.hidden = false;
    starterSelection.hidden = false;
  }

  function loop(now) {
    const delta = Math.min((now - lastFrame) / 1000, 0.25);
    lastFrame = now;

    if (state.hasStarted && !document.hidden && !isMenuOpen && !isTeamOpen) {
      if (state.mode === "exploring") updateExploration(state, delta);
      if (state.mode === "approach") updateApproach(state, delta);
      if (state.mode === "battle") updateBattle(state, delta);
      if (state.mode === "recovering") updateRecovery(state, delta);

      if (now - lastSave >= 5000) {
        saveGame(state);
        lastSave = now;
      }
      renderGame();
    }

    requestAnimationFrame(loop);
  }

  document.querySelector("#start-image-button").addEventListener("click", showStarterSelection);
  document.querySelector("#back-to-welcome").addEventListener("click", showWelcome);
  document.querySelector("#menu-button").addEventListener("click", showWelcome);

  document.querySelectorAll("[data-starter-id]").forEach((button) => {
    button.addEventListener("click", () => {
      if (hasSavedGame() && !window.confirm("Começar uma nova jornada apagará o progresso atual. Deseja continuar?")) return;
      resetGame();
      state = startNewJourney(button.dataset.starterId);
      saveGame(state);
      showGame();
    });
  });

  continueButton.addEventListener("click", showGame);

  document.querySelector("#pokedex-button").addEventListener("click", () => {
    document.querySelector("#pokedex-dialog").showModal();
  });

  document.querySelector("#close-pokedex").addEventListener("click", () => {
    document.querySelector("#pokedex-dialog").close();
  });

  const teamDialog = document.querySelector("#team-dialog");

  document.querySelector("#team-button").addEventListener("click", () => {
    isTeamOpen = true;
    saveGame(state);
    renderTeam(state);
    teamDialog.showModal();
  });

  document.querySelector("#close-team").addEventListener("click", () => {
    teamDialog.close();
  });

  teamDialog.addEventListener("close", () => {
    isTeamOpen = false;
    lastFrame = performance.now();
    renderGame();
  });

  teamDialog.addEventListener("click", (event) => {
    if (event.target.id === "team-dialog") {
      teamDialog.close();
      return;
    }

    const actionButton = event.target.closest("button");
    if (!actionButton || actionButton.disabled) return;
    let changed = false;
    if (actionButton.dataset.teamPosition) changed = setTeamPosition(state, actionButton.dataset.teamPosition, actionButton.dataset.position);
    if (actionButton.dataset.setActive) changed = setActivePokemon(state, actionButton.dataset.setActive);
    if (actionButton.dataset.sendStorage) changed = sendToStorage(state, actionButton.dataset.sendStorage);
    if (actionButton.dataset.addTeam) changed = addToTeam(state, actionButton.dataset.addTeam);
    if (changed) {
      saveGame(state);
      renderTeam(state);
    }
  });

  document.querySelector("#try-capture").addEventListener("click", () => {
    attemptCapture(state);
    saveGame(state);
    renderGame();
  });

  document.querySelector("#decline-capture").addEventListener("click", () => {
    declineCapture(state);
    saveGame(state);
    renderGame();
  });

  document.querySelector("#pokedex-dialog").addEventListener("click", (event) => {
    if (event.target.id === "pokedex-dialog") event.target.close();
  });

  document.querySelector("#reset-button").addEventListener("click", () => {
    if (!window.confirm("Deseja apagar todo o progresso e reiniciar a jornada?")) return;
    resetGame();
    window.location.reload();
  });

  window.addEventListener("beforeunload", () => saveGame(state));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveGame(state);
    lastFrame = performance.now();
  });

  renderGame();
  if (state.hasStarted) showGame();
  else showWelcome();
  requestAnimationFrame(loop);
}

boot();
