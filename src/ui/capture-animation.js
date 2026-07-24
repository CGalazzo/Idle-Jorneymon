import "../styles/capture-animation.css";

const SETTING_KEY = "idle-jorneymon-capture-animation-enabled";
const ITEM_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";
const ANIMATION_MS = 2400;

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

function setTrajectory(layer, scene) {
  const sceneRect = scene.getBoundingClientRect();
  const panelRect = document.querySelector("#capture-panel")?.getBoundingClientRect();
  const target = document.querySelector("#battle-stage .capture-pokemon img")
    || document.querySelector("#battle-stage .capture-pokemon");
  const targetRect = target?.getBoundingClientRect();

  const targetX = targetRect
    ? targetRect.left - sceneRect.left + targetRect.width / 2
    : sceneRect.width * 0.5;
  const targetY = targetRect
    ? targetRect.top - sceneRect.top + targetRect.height / 2
    : sceneRect.height * 0.36;

  const panelRight = panelRect ? panelRect.right - sceneRect.left : sceneRect.width * 0.75;
  const panelTop = panelRect ? panelRect.top - sceneRect.top : sceneRect.height * 0.58;
  const panelHeight = panelRect?.height || 130;
  const rightSpace = Math.max(0, sceneRect.width - panelRight);
  const hasRightLane = rightSpace >= 74;

  // A bola nasce sempre fora do painel. Quando há espaço, ela aparece
  // claramente à direita da caixa; em telas estreitas, nasce acima do canto direito.
  const startX = hasRightLane
    ? panelRight + Math.min(112, Math.max(42, rightSpace * 0.52))
    : sceneRect.width - 30;
  const startY = hasRightLane
    ? Math.min(sceneRect.height - 34, panelTop + Math.min(78, panelHeight * 0.52))
    : Math.max(34, panelTop - 34);

  // Primeiro a bola sobe pela lateral direita, sem cruzar a caixa de captura.
  const clearX = Math.min(sceneRect.width - 28, startX - (hasRightLane ? 8 : 0));
  const clearY = Math.max(28, panelTop - 42);

  // Depois faz o arco em direção ao centro real do Pokémon.
  const arcX = targetX + (clearX - targetX) * 0.48;
  const arcY = Math.max(24, targetY - Math.min(76, sceneRect.height * 0.23));

  // Após o impacto, a bola cai no chão logo abaixo do Pokémon, acima do painel.
  const dropX = targetX + 5;
  const dropLimit = Math.max(targetY + 56, panelTop - 28);
  const dropY = Math.min(dropLimit, targetY + 102);
  const bounceY = Math.max(targetY + 38, dropY - 16);

  const points = {
    "--capture-start-x": startX,
    "--capture-start-y": startY,
    "--capture-clear-x": clearX,
    "--capture-clear-y": clearY,
    "--capture-arc-x": arcX,
    "--capture-arc-y": arcY,
    "--capture-target-x": targetX,
    "--capture-target-y": targetY,
    "--capture-drop-x": dropX,
    "--capture-drop-y": dropY,
    "--capture-bounce-y": bounceY
  };

  Object.entries(points).forEach(([property, value]) => {
    layer.style.setProperty(property, `${Math.round(value)}px`);
  });
}

function createAnimationLayer(ballId) {
  const scene = document.querySelector("#scene");
  if (!scene) return null;

  scene.querySelector(".capture-throw-layer")?.remove();
  const layer = document.createElement("div");
  layer.className = "capture-throw-layer";
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <span class="capture-drop-shadow"></span>
    <span class="capture-throw-ball">
      <img src="${ITEM_SPRITE_BASE}/${ballId}.png" alt="" decoding="async" />
    </span>
    <span class="capture-impact-flash"></span>
    <span class="capture-impact-ring"></span>
  `;
  setTrajectory(layer, scene);
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
        <p>Mostra a Poké Bola sendo lançada, atingindo o Pokémon e caindo no chão antes do resultado.</p>
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