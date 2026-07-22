(() => {
  const CAPTURE_ROOT_SELECTOR = "#capture-ball-options";
  const SAFARI_BUTTON_SELECTOR = "button.safari-capture-button";
  const SAFARI_BACKGROUND_STYLE_ID = "safari-habitat-background-style";
  const SAFARI_TRACK_CLASS = "safari-seamless-track";
  const SAFARI_BACKGROUNDS = {
    "campo aberto": {
      id: "campo-aberto",
      sources: [
        "/assets/safari/campo-aberto.1.b64",
        "/assets/safari/campo-aberto.2.b64",
        "/assets/safari/campo-aberto.3.b64"
      ]
    },
    selva: {
      id: "selva",
      sources: ["/assets/safari/selva.webp.b64"]
    },
    "lago safari": {
      id: "lago-safari",
      sources: ["/assets/safari/lago-safari.webp.b64"]
    },
    desfiladeiro: {
      id: "desfiladeiro",
      sources: ["/assets/safari/desfiladeiro.webp.b64"]
    },
    "ruinas antigas": {
      id: "ruinas-antigas",
      sources: ["/assets/safari/ruinas-antigas.webp.b64"]
    }
  };

  const safariBackgroundCache = new Map();
  const safariBackgroundLoads = new Map();
  let installScheduled = false;

  function normalizeHabitatName(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function installSafariBackgroundStyle() {
    if (document.querySelector(`#${SAFARI_BACKGROUND_STYLE_ID}`)) return;
    const style = document.createElement("style");
    style.id = SAFARI_BACKGROUND_STYLE_ID;
    style.textContent = `
      body.safari-active #scene[data-safari-habitat-background]::before {
        background-image: none !important;
        animation: none !important;
      }

      body.safari-active #scene[data-safari-habitat-background] .${SAFARI_TRACK_CLASS} {
        --safari-tile-width: 676px;
        --safari-loop-offset: -1352px;
        position: absolute;
        z-index: 0;
        inset: 0 auto 0 0;
        display: flex;
        width: max-content;
        height: 100%;
        overflow: visible;
        pointer-events: none;
        will-change: transform;
        animation: safariSeamlessTreadmill 10s linear infinite;
        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
      }

      body.safari-active #scene[data-safari-habitat-background] .${SAFARI_TRACK_CLASS} > span {
        flex: 0 0 calc(var(--safari-tile-width) + 1px);
        width: calc(var(--safari-tile-width) + 1px);
        height: 100%;
        margin-right: -1px;
        background-image: var(--safari-habitat-background, var(--route-background));
        background-position: center;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        transform-origin: center;
        backface-visibility: hidden;
      }

      body.safari-active #scene[data-safari-habitat-background] .${SAFARI_TRACK_CLASS} > span:nth-child(even) {
        transform: scaleX(-1);
      }

      body.safari-active #scene.approach[data-safari-habitat-background] .${SAFARI_TRACK_CLASS} {
        animation-duration: 12s;
      }

      body.safari-active #scene.battle[data-safari-habitat-background] .${SAFARI_TRACK_CLASS},
      body.safari-active #scene.capture[data-safari-habitat-background] .${SAFARI_TRACK_CLASS},
      body.safari-active #scene.recovering[data-safari-habitat-background] .${SAFARI_TRACK_CLASS},
      body.safari-active #scene.journey-complete[data-safari-habitat-background] .${SAFARI_TRACK_CLASS} {
        animation-play-state: paused;
      }

      @keyframes safariSeamlessTreadmill {
        to { transform: translate3d(var(--safari-loop-offset), 0, 0); }
      }

      @media (max-width: 700px) {
        body.safari-active #scene[data-safari-habitat-background] .${SAFARI_TRACK_CLASS} {
          --safari-tile-width: 548px;
          --safari-loop-offset: -1096px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        body.safari-active #scene[data-safari-habitat-background] .${SAFARI_TRACK_CLASS} {
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureSafariSeamlessTrack(scene) {
    let track = scene.querySelector(`.${SAFARI_TRACK_CLASS}`);
    if (!track) {
      track = document.createElement("div");
      track.className = SAFARI_TRACK_CLASS;
      track.setAttribute("aria-hidden", "true");
      track.innerHTML = "<span></span><span></span><span></span><span></span>";
      scene.insertBefore(track, scene.firstChild);
    }
    return track;
  }

  async function getSafariBackground(entry) {
    if (safariBackgroundCache.has(entry.id)) return safariBackgroundCache.get(entry.id);

    if (!safariBackgroundLoads.has(entry.id)) {
      const load = Promise.all(entry.sources.map((source) =>
        fetch(source, { cache: "force-cache" }).then((response) => {
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.text();
        })
      ))
        .then((parts) => {
          const base64 = parts.map((part) => part.trim()).join("");
          const value = `url("data:image/webp;base64,${base64}")`;
          safariBackgroundCache.set(entry.id, value);
          return value;
        })
        .finally(() => safariBackgroundLoads.delete(entry.id));

      safariBackgroundLoads.set(entry.id, load);
    }

    return safariBackgroundLoads.get(entry.id);
  }

  async function applySafariHabitatBackground() {
    const scene = document.querySelector("#scene");
    if (!scene) return;

    const active = document.body.classList.contains("safari-active");
    const existingTrack = scene.querySelector(`.${SAFARI_TRACK_CLASS}`);

    if (!active) {
      existingTrack?.remove();
      scene.removeAttribute("data-safari-habitat-background");
      scene.style.removeProperty("--safari-habitat-background");
      return;
    }

    ensureSafariSeamlessTrack(scene);
    const habitatLabel = document.querySelector("#safari-hud-habitat");
    const entry = SAFARI_BACKGROUNDS[normalizeHabitatName(habitatLabel?.textContent)];
    if (!entry) return;

    scene.dataset.safariHabitatBackground = entry.id;

    try {
      const background = await getSafariBackground(entry);
      if (
        document.body.classList.contains("safari-active")
        && scene.dataset.safariHabitatBackground === entry.id
      ) {
        scene.style.setProperty("--safari-habitat-background", background);
      }
    } catch (error) {
      console.warn(`Idle Jorneymon: não foi possível carregar o cenário ${entry.id}.`, error);
    }
  }

  function moveSafariHudOutsideScene() {
    const scene = document.querySelector("#scene");
    const hud = document.querySelector("#safari-hud");
    if (!scene || !hud || hud.parentElement !== scene || !scene.parentElement) return;
    scene.parentElement.insertBefore(hud, scene);
  }

  function bindSafariCapturePointer() {
    const root = document.querySelector(CAPTURE_ROOT_SELECTOR);
    if (!root || root.dataset.safariPointerFix === "true") return;
    root.dataset.safariPointerFix = "true";

    root.addEventListener("pointerdown", (event) => {
      const button = event.target.closest(SAFARI_BUTTON_SELECTOR);
      if (!button || !root.contains(button) || button.disabled) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();
      button.click();
    }, { passive: false });
  }

  function installSafariFixes() {
    installSafariBackgroundStyle();
    moveSafariHudOutsideScene();
    bindSafariCapturePointer();
    applySafariHabitatBackground();
  }

  function scheduleInstallSafariFixes() {
    if (installScheduled) return;
    installScheduled = true;
    window.requestAnimationFrame(() => {
      installScheduled = false;
      installSafariFixes();
    });
  }

  function startObserver() {
    installSafariFixes();
    const observer = new MutationObserver(scheduleInstallSafariFixes);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }
})();
