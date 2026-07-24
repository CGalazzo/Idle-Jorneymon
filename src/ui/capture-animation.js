import "../styles/capture-animation.css";

const SETTING_KEY = "idle-jorneymon-capture-animation-enabled";
const ITEM_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";
const ANIMATION_MS = 2700;
const SPRITE_MEASURE_TIMEOUT_MS = 650;

let bypassNextCapture = false;
let captureAnimating = false;
const visibleBoundsCache = new Map();

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

function captureButtonSelector(button) {
  if (button?.id === "try-capture") return "#try-capture";
  const ballId = selectedBallId(button);
  const escaped = typeof CSS?.escape === "function"
    ? CSS.escape(ballId)
    : String(ballId).replace(/["\\]/g, "\\$&");
  return `[data-capture-ball="${escaped}"]`;
}

function displayedCaptureChance(button) {
  const matches = [...String(button?.textContent || "").matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)];
  if (!matches.length) return 50;
  const value = Number(matches.at(-1)[1].replace(",", "."));
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 50));
}

function rollCaptureResult(button) {
  return Math.random() * 100 < displayedCaptureChance(button);
}

function scanVisibleBounds(image) {
  if (!image?.naturalWidth || !image?.naturalHeight) return null;
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  try {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (pixels[(y * canvas.width + x) * 4 + 3] <= 16) continue;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (maxX < minX || maxY < minY) return null;
    return {
      centerX: ((minX + maxX + 1) / 2) / canvas.width,
      centerY: ((minY + maxY + 1) / 2) / canvas.height,
      naturalWidth: canvas.width,
      naturalHeight: canvas.height
    };
  } catch {
    return null;
  }
}

function loadVisibleBounds(url) {
  if (!url) return Promise.resolve(null);
  if (visibleBoundsCache.has(url)) return visibleBoundsCache.get(url);

  const promise = new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    let settled = false;

    const finish = (bounds = null) => {
      if (settled) return;
      settled = true;
      resolve(bounds);
    };

    const timeout = window.setTimeout(() => finish(null), SPRITE_MEASURE_TIMEOUT_MS);
    image.addEventListener("load", () => {
      window.clearTimeout(timeout);
      finish(scanVisibleBounds(image));
    }, { once: true });
    image.addEventListener("error", () => {
      window.clearTimeout(timeout);
      finish(null);
    }, { once: true });
    image.src = url;
  });

  visibleBoundsCache.set(url, promise);
  return promise;
}

async function getVisibleTargetPoint(target, sceneRect) {
  const targetRect = target?.getBoundingClientRect();
  if (!targetRect) {
    return { x: sceneRect.width * 0.5, y: sceneRect.height * 0.36 };
  }

  const fallback = {
    x: targetRect.left - sceneRect.left + targetRect.width / 2,
    y: targetRect.top - sceneRect.top + targetRect.height / 2
  };
  if (!(target instanceof HTMLImageElement)) return fallback;

  const bounds = await loadVisibleBounds(target.currentSrc || target.src);
  if (!bounds) return fallback;

  const naturalRatio = bounds.naturalWidth / bounds.naturalHeight;
  const boxRatio = targetRect.width / targetRect.height;
  const renderedWidth = boxRatio > naturalRatio
    ? targetRect.height * naturalRatio
    : targetRect.width;
  const renderedHeight = boxRatio > naturalRatio
    ? targetRect.height
    : targetRect.width / naturalRatio;
  const offsetX = (targetRect.width - renderedWidth) / 2;
  const offsetY = (targetRect.height - renderedHeight) / 2;

  return {
    x: targetRect.left - sceneRect.left + offsetX + renderedWidth * bounds.centerX,
    y: targetRect.top - sceneRect.top + offsetY + renderedHeight * bounds.centerY
  };
}

async function setTrajectory(layer, scene) {
  const sceneRect = scene.getBoundingClientRect();
  const panelRect = document.querySelector("#capture-panel")?.getBoundingClientRect();
  const target = document.querySelector("#battle-stage .capture-pokemon img")
    || document.querySelector("#battle-stage .capture-pokemon");
  const targetPoint = await getVisibleTargetPoint(target, sceneRect);
  const targetX = targetPoint.x;
  const targetY = targetPoint.y;

  const panelRight = panelRect ? panelRect.right - sceneRect.left : sceneRect.width * 0.75;
  const panelTop = panelRect ? panelRect.top - sceneRect.top : sceneRect.height * 0.58;
  const panelHeight = panelRect?.height || 130;
  const rightSpace = Math.max(0, sceneRect.width - panelRight);
  const hasRightLane = rightSpace >= 74;

  const startX = hasRightLane
    ? panelRight + Math.min(112, Math.max(42, rightSpace * 0.52))
    : sceneRect.width - 30;
  const startY = hasRightLane
    ? Math.min(sceneRect.height - 34, panelTop + Math.min(78, panelHeight * 0.52))
    : Math.max(34, panelTop - 34);

  const clearX = Math.min(sceneRect.width - 28, startX - (hasRightLane ? 8 : 0));
  const clearY = Math.max(28, panelTop - 42);
  const arcX = targetX + (clearX - targetX) * 0.44;
  const arcY = Math.max(22, targetY - Math.min(72, sceneRect.height * 0.22));

  const dropX = targetX + 4;
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

async function createAnimationLayer(ballId, captureSucceeded) {
  const scene = document.querySelector("#scene");
  if (!scene) return null;

  scene.querySelector(".capture-throw-layer")?.remove();
  const layer = document.createElement("div");
  layer.className = `capture-throw-layer ${captureSucceeded ? "capture-result-success" : "capture-result-failure"}`;
  layer.setAttribute("aria-hidden", "true");
  layer.innerHTML = `
    <span class="capture-drop-shadow"></span>
    <span class="capture-throw-ball">
      <img src="${ITEM_SPRITE_BASE}/${ballId}.png" alt="" decoding="async" />
    </span>
    <span class="capture-impact-flash"></span>
    <span class="capture-impact-ring"></span>
    <span class="capture-result-flash"></span>
  `;
  await setTrajectory(layer, scene);
  scene.appendChild(layer);
  return layer;
}

async function playCaptureAnimation(ballId, captureSucceeded) {
  const layer = await createAnimationLayer(ballId, captureSucceeded);
  if (!layer) return;

  document.querySelector("#capture-panel")?.classList.add("capture-animation-running");
  document.querySelector("#battle-stage")?.classList.add("capture-animation-target");

  await new Promise((resolve) => window.setTimeout(resolve, ANIMATION_MS));
  layer.remove();
  document.querySelector("#capture-panel")?.classList.remove("capture-animation-running");
  document.querySelector("#battle-stage")?.classList.remove("capture-animation-target");
}

function executeCaptureWithResult(button, captureSucceeded) {
  const originalRandom = Math.random;
  let firstRandomCall = true;
  bypassNextCapture = true;
  Math.random = () => {
    if (firstRandomCall) {
      firstRandomCall = false;
      return captureSucceeded ? 0 : 0.999999;
    }
    return originalRandom();
  };

  try {
    button.click();
  } finally {
    Math.random = originalRandom;
    bypassNextCapture = false;
  }
}

function toggleMarkup() {
  return `
    <section id="capture-animation-setting" class="inventory-section capture-animation-setting">
      <div class="capture-animation-setting-copy">
        <small>PREFERÊNCIA VISUAL</small>
        <h3>Animação de captura</h3>
        <p>Mostra a Poké Bola atingindo o Pokémon e indica o resultado com um clarão verde ou vermelho.</p>
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

function restoreCaptureButtons(root) {
  root?.querySelectorAll("button").forEach((entry) => {
    entry.disabled = entry.dataset.captureAnimationDisabled === "true";
    delete entry.dataset.captureAnimationDisabled;
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
    window.__idleJorneymonPauseCaptureTimer?.();

    const options = button.closest("#capture-ball-options");
    const buttonSelector = captureButtonSelector(button);
    const ballId = selectedBallId(button);
    options?.querySelectorAll("button").forEach((entry) => {
      entry.dataset.captureAnimationDisabled = entry.disabled ? "true" : "false";
      entry.disabled = true;
    });

    const captureSucceeded = rollCaptureResult(button);
    await playCaptureAnimation(ballId, captureSucceeded);

    const liveOptions = document.querySelector("#capture-ball-options");
    restoreCaptureButtons(options);
    if (liveOptions !== options) restoreCaptureButtons(liveOptions);

    const liveButton = liveOptions?.querySelector(buttonSelector) || button;
    try {
      executeCaptureWithResult(liveButton, captureSucceeded);
    } finally {
      captureAnimating = false;
      window.__idleJorneymonRestoreCaptureTimer?.();
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
