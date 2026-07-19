import "./styles/base.css";
import { createAppMarkup, render } from "./ui/render.js";
import { updateExploration } from "./systems/exploration.js";
import { updateBattle, updateRecovery } from "./systems/battle.js";
import { loadGame, resetGame, saveGame } from "./systems/save.js";

const app = document.querySelector("#app");
app.innerHTML = createAppMarkup();

let state = loadGame();
let lastFrame = performance.now();
let lastSave = performance.now();

function loop(now) {
  const delta = Math.min((now - lastFrame) / 1000, 0.25);
  lastFrame = now;

  if (state.mode === "exploring") updateExploration(state, delta);
  if (state.mode === "battle") updateBattle(state, delta);
  if (state.mode === "recovering") updateRecovery(state, delta);

  if (now - lastSave >= 5000) {
    saveGame(state);
    lastSave = now;
  }

  render(state);
  requestAnimationFrame(loop);
}

document.querySelector("#reset-button").addEventListener("click", () => {
  if (!window.confirm("Deseja apagar todo o progresso e reiniciar a jornada?")) return;
  resetGame();
  window.location.reload();
});

window.addEventListener("beforeunload", () => saveGame(state));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) saveGame(state);
});

render(state);
requestAnimationFrame(loop);
