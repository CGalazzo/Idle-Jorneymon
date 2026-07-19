import "./styles/base.css";
import { startNewJourney } from "./core/game-state.js";
import { createAppMarkup, render } from "./ui/render.js";
import { updateExploration } from "./systems/exploration.js";
import { updateBattle, updateRecovery } from "./systems/battle.js";
import { hasSavedGame, loadGame, resetGame, saveGame } from "./systems/save.js";

const app = document.querySelector("#app");
const hadSaveAtLaunch = hasSavedGame();
app.innerHTML = createAppMarkup();

let state = loadGame();
let lastFrame = performance.now();
let lastSave = performance.now();

const welcomeScreen = document.querySelector("#welcome-screen");
const welcomeActions = document.querySelector("#welcome-actions");
const starterSelection = document.querySelector("#starter-selection");
const continueButton = document.querySelector("#continue-button");

function showGame() {
  welcomeScreen.classList.add("is-hidden");
  document.body.classList.remove("welcome-open");
  lastFrame = performance.now();
  render(state);
}

function showWelcome() {
  welcomeScreen.classList.remove("is-hidden");
  document.body.classList.add("welcome-open");
  welcomeActions.hidden = false;
  starterSelection.hidden = true;
  continueButton.hidden = !hadSaveAtLaunch;
}

function loop(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.25);
  lastFrame = now;

  if (state.hasStarted && !document.hidden) {
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

document.querySelectorAll("[data-starter-id]").forEach((button) => {
  button.addEventListener("click", () => {
    if (hadSaveAtLaunch && !window.confirm("Começar uma nova jornada apagará o progresso atual. Deseja continuar?")) return;
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
