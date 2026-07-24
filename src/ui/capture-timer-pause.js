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

    // O módulo da animação remove a camada e, no mesmo fluxo, executa a
    // captura real. O observer só roda depois disso, quando o painel já fechou.
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
  if (countdownPaused) return;

  countdownPaused = true;
  frozenTimestamp = originalDateNow();
  Date.now = () => frozenTimestamp;
  document.body.classList.add("capture-countdown-paused");

  watchAnimationCompletion();
  cleanupTimer = window.setTimeout(restoreCountdownClock, MAX_PAUSE_MS);
}

document.addEventListener("click", (event) => {
  // Ignora o clique programático usado pela animação para concluir a captura.
  if (!event.isTrusted || !captureAnimationEnabled()) return;

  const button = event.target.closest("#try-capture, [data-capture-ball]");
  if (!button || button.disabled || !button.closest("#capture-ball-options")) return;

  // Este listener é carregado antes do interceptor visual. Assim, o relógio
  // congela no exato instante do clique, antes do primeiro frame da animação.
  pauseCountdownClock();
}, true);

window.addEventListener("pagehide", restoreCountdownClock);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) restoreCountdownClock();
});
