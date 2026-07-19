import "./styles/base.css";
import { startNewJourney } from "./core/game-state.js";
import { createAppMarkup, render } from "./ui/render.js";
import { updateExploration } from "./systems/exploration.js";
import { updateBattle, updateRecovery } from "./systems/battle.js";
import { hasSavedGame, loadGame, resetGame, saveGame } from "./systems/save.js";
import { addToTeam, moveTeamMember, sendToStorage } from "./systems/team.js";
import { attemptCapture, declineCapture } from "./systems/capture.js";

const app = document.querySelector("#app");
app.innerHTML = createAppMarkup();

let state = loadGame();
let lastFrame = performance.now();
let lastSave = performance.now();
let isMenuOpen = false;

const welcomeScreen = document.querySelector("#welcome-screen");
const welcomeActions = document.querySelector("#welcome-actions");
const starterSelection = document.querySelector("#starter-selection");
const continueButton = document.querySelector("#continue-button");

function showGame() {
  isMenuOpen = false;
  welcomeScreen.classList.add("is-hidden");
  document.body.classList.remove("welcome-open");
  lastFrame = performance.now();
  render(state);
}

function showWelcome() {
  isMenuOpen = true;
  saveGame(state);
  welcomeScreen.classList.remove("is-hidden");
  document.body.classList.add("welcome-open");
  welcomeActions.hidden = false;
  starterSelection.hidden = true;
  continueButton.hidden = !hasSavedGame();
}

function loop(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.25);
  lastFrame = now;

  if (state.hasStarted && !document.hidden && !isMenuOpen) {
    if (state.mode === "exploring") updateExploration(state, delta);
    if (state.mode === "battle") updateBattle(state, delta);
    if (state.mode === "recovering") updateRecovery(state, delta);

    if (now - lastSave >= 5000) {
      saveGame(state);
      lastSave = now;
    }
    render(state);
  }

  requestAnimationFrame(loop);
}

document.querySelector("#new-journey-button").addEventListener("click", () => {
  welcomeActions.hidden = true;
  starterSelection.hidden = false;
});

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

document.querySelector("#team-button").addEventListener("click", () => {
  document.querySelector("#team-dialog").showModal();
});

document.querySelector("#close-team").addEventListener("click", () => {
  document.querySelector("#team-dialog").close();
});

document.querySelector("#team-dialog").addEventListener("click", (event) => {
  if (event.target.id === "team-dialog") {
    event.target.close();
    return;
  }

  const actionButton = event.target.closest("button");
  if (!actionButton || actionButton.disabled) return;
  let changed = false;
  if (actionButton.dataset.teamUp) changed = moveTeamMember(state, actionButton.dataset.teamUp, -1);
  if (actionButton.dataset.teamDown) changed = moveTeamMember(state, actionButton.dataset.teamDown, 1);
  if (actionButton.dataset.sendStorage) changed = sendToStorage(state, actionButton.dataset.sendStorage);
  if (actionButton.dataset.addTeam) changed = addToTeam(state, actionButton.dataset.addTeam);
  if (changed) {
    saveGame(state);
    render(state);
  }
});

document.querySelector("#try-capture").addEventListener("click", () => {
  attemptCapture(state);
  saveGame(state);
  render(state);
});

document.querySelector("#decline-capture").addEventListener("click", () => {
  declineCapture(state);
  saveGame(state);
  render(state);
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

render(state);
if (state.hasStarted) showGame();
else showWelcome();
requestAnimationFrame(loop);
