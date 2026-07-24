import "../styles/capture-animation.css";

const SETTING_KEY = "idle-jorneymon-capture-animation-enabled";
const ITEM_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";
const ANIMATION_MS = 780;

let bypassNextCapture = false;
let captureAnimating = false;

function animationEnabled() {
  return localStorage.getItem(SETTING_KEY) !== "false";
}

function setAnimationEnabled(enabled) {
  localStorage.setItem(SETTING_KEY, enabled ? "true" : "false");
  renderToggleState();
}

function selectedBallId(button) {
  return button?.dataset.captureBall || "poke-ball";
}

function createAnimationLayer(ballId) {
  const scene = document.querySelector("#scene");
  if (!scene) return null;

  scene.querySelector(".capture-throw-layer")?.remove();
  const layer = document.createElement("div");
  layer.className = "capture-throw-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <span class="capture-throw-ball">
      <img src="${ITEM_SPRITE_BASE}/${ballId}.png" alt="" decoding="async" />
    </span>
    <span class="capture-impact-flash"></span>
  `;
  scene.appendChild(layer);
  return layer;
}

function playCaptureAnimation(ballId) {
  const layer = createAnimationLayer(ballId);
  if (!layer) return Promise.resolve();

  document.querySelector("#capture-panel")?.classList.add("capture-animation-running");
  document.querySelector("#battle-stage")?.classList.add("capture-animation-target");

  return new Promise((resolve) => {
    window.setTimeout(() => {
      layer.remove();
      document.querySelector("#capture-panel")?.classList.remove("capture-animation-running");
      document.querySelector("#battle-stage")?.classList.remove("capture-animation-target");
      resolve();
    }, ANIMATION_MS);
  });
}

function toggleMarkup() {
  return `
    <section id="capture-animation-setting" class="inventory-section capture-animation-setting">
      <div class="capture-animation-setting-copy">
        <small>PREFERÊNCIA VISUAL</small>
        <h3>Animação de captura</h3>
        <p>Mostra uma animação curta da Poké Bola sendo lançada antes do resultado da captura.</p>
      </div>
      <button id="capture-animation-toggle" type="button" role="switch" aria-checked="true">
        <span class="capture-animation-toggle-dot"></span>
        <strong>Ligada</strong>
      </button>
    </section>
  `;
}

function ensureToggle() {
  const inventoryScroll = document.querySelector("#items-dialog .inventory-scroll");
  if (!inventoryScroll) return false;
  if (!document.querySelector("#capture-animation-setting")) {
    inventoryScroll.insertAdjacentHTML("afterbegin", toggleMarkup());
  }
  renderToggleState();
  return true;
}

function renderToggleState() {
  const button = document.querySelector("#capture-animation-toggle");
  if (!button) return;
  const enabled = animationEnabled();
  button.classList.toggle("enabled", enabled);
  button.setAttribute("aria-checked", String(enabled));
  const label = button.querySelector("strong");
  if (label) label.textContent = enabled ? "Ligada" : "Desligada";
}

function installToggleListener() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("#capture-animation-toggle");
    if (!button) return;
    event.preventDefault();
    setAnimationEnabled(!animationEnabled());
  });
}

function installCaptureInterceptor() {
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("#try-capture, [data-capture-ball]");
    if (!button || button.disabled || !button.closest("#capture-ball-options")) return;
    if (bypassNextCapture || !animationEnabled()) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (captureAnimating) return;

    captureAnimating = true;
    button.closest("#capture-ball-options")?.querySelectorAll("button").forEach((entry) => {
      entry.dataset.captureAnimationDisabled = entry.disabled ? "true" : "false";
      entry.disabled = true;
    });

    await playCaptureAnimation(selectedBallId(button));

    button.closest("#capture-ball-options")?.querySelectorAll("button").forEach((entry) => {
      entry.disabled = entry.dataset.captureAnimationDisabled === "true";
      delete entry.dataset.captureAnimationDisabled;
    });

    bypassNextCapture = true;
    try {
      button.click();
    } finally {
      bypassNextCapture = false;
      captureAnimating = false;
    }
  }, true);
}

function bootCaptureAnimation() {
  installToggleListener();
  installCaptureInterceptor();
  if (ensureToggle()) return;

  const observer = new MutationObserver(() => {
    if (!ensureToggle()) return;
    observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}

bootCaptureAnimation();
