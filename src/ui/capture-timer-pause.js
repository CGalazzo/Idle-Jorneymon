const CAPTURE_ANIMATION_SETTING_KEY = "idle-jorneymon-capture-animation-enabled";
const MAX_PAUSE_MS = 5000;

const originalDateNow = Date.now.bind(Date);
let countdownPaused = false;
let frozenTimestamp = 0;
let sawAnimationLayer = false;
let cleanupTimer = null;
let animationObserver = null;

function captureAnimationEnabled() {
  return localStorage.getItem(CAPTURE_ANIMATION_SETTING_KEY) !== "false";
}

function isCaptureButton(target) {
  const button = target?.closest?.("#try-capture, [data-capture-ball]");
  if (!button || button.disabled || !button.closest("#capture-ball-options")) return null;
  return button;
}

function restoreCountdownClock() {
  if (!countdownPaused) return;

  countdownPaused = false;
  Date.now = originalDateNow;
  document.body.classList.remove("capture-countdown-paused");

  if (cleanupTimer) {
    window.clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  animationObserver?.disconnect();
  animationObserver = null;
  sawAnimationLayer = false;
}

function watchAnimationCompletion() {
  const scene = document.querySelector("#scene");
  if (!scene || typeof MutationObserver !== "function") return;

  animationObserver = new MutationObserver(() => {
    const animationLayer = scene.querySelector(".capture-throw-layer");
    const capturePanel = document.querySelector("#capture-panel");

    if (animationLayer) sawAnimationLayer = true;

    // A captura real é executada logo após a camada visual ser removida.
    // O relógio só volta quando a animação terminou ou o painel já foi fechado.
    if ((sawAnimationLayer && !animationLayer) || capturePanel?.hidden) {
      restoreCountdownClock();
    }
  });

  animationObserver.observe(scene, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["hidden", "class"]
  });
}

function pauseCountdownClock() {
  if (countdownPaused || !captureAnimationEnabled()) return;

  countdownPaused = true;
  frozenTimestamp = originalDateNow();
  Date.now = () => frozenTimestamp;
  document.body.classList.add("capture-countdown-paused");

  watchAnimationCompletion();
  cleanupTimer = window.setTimeout(restoreCountdownClock, MAX_PAUSE_MS);
}

// O Safari e o Salão dos Campeões possuem tratamentos próprios de pointerdown
// que podem interromper o evento antes de chegar ao document. Escutar no window,
// durante a captura, garante a pausa antes de qualquer modo especial agir.
window.addEventListener("pointerdown", (event) => {
  if (!event.isTrusted || !isCaptureButton(event.target)) return;
  if (event.pointerType === "mouse" && event.button !== 0) return;
  pauseCountdownClock();
}, true);

// Mantém suporte a teclado e dispositivos que disparam apenas click.
document.addEventListener("click", (event) => {
  if (!event.isTrusted || !isCaptureButton(event.target)) return;
  pauseCountdownClock();
}, true);

window.addEventListener("pagehide", restoreCountdownClock);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) restoreCountdownClock();
});
