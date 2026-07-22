(() => {
  const STYLE_ID = "beach-seamless-background-style";
  const TRACK_CLASS = "beach-seamless-track";

  function normalize(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function installStyle() {
    if (document.querySelector(`#${STYLE_ID}`)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      body:not(.safari-active) #scene.beach-seamless-active::before {
        background-image: none !important;
        animation: none !important;
      }

      body:not(.safari-active) #scene.beach-seamless-active .${TRACK_CLASS} {
        --beach-tile-width: 676px;
        --beach-loop-offset: -1352px;
        position: absolute;
        z-index: 0;
        inset: 0 auto 0 0;
        display: flex;
        width: max-content;
        height: 100%;
        overflow: visible;
        pointer-events: none;
        will-change: transform;
        animation: beachSeamlessTreadmill 10s linear infinite;
        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
      }

      body:not(.safari-active) #scene.beach-seamless-active .${TRACK_CLASS} > span {
        flex: 0 0 calc(var(--beach-tile-width) + 1px);
        width: calc(var(--beach-tile-width) + 1px);
        height: 100%;
        margin-right: -1px;
        background-image: var(--route-background);
        background-position: center;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        transform-origin: center;
        backface-visibility: hidden;
      }

      body:not(.safari-active) #scene.beach-seamless-active .${TRACK_CLASS} > span:nth-child(even) {
        transform: scaleX(-1);
      }

      body:not(.safari-active) #scene.beach-seamless-active.approach .${TRACK_CLASS} {
        animation-duration: 12s;
      }

      body:not(.safari-active) #scene.beach-seamless-active.battle .${TRACK_CLASS},
      body:not(.safari-active) #scene.beach-seamless-active.capture .${TRACK_CLASS},
      body:not(.safari-active) #scene.beach-seamless-active.recovering .${TRACK_CLASS},
      body:not(.safari-active) #scene.beach-seamless-active.journey-complete .${TRACK_CLASS} {
        animation-play-state: paused;
      }

      @keyframes beachSeamlessTreadmill {
        to { transform: translate3d(var(--beach-loop-offset), 0, 0); }
      }

      @media (max-width: 700px) {
        body:not(.safari-active) #scene.beach-seamless-active .${TRACK_CLASS} {
          --beach-tile-width: 548px;
          --beach-loop-offset: -1096px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        body:not(.safari-active) #scene.beach-seamless-active .${TRACK_CLASS} {
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function isBeachScene(scene) {
    if (!scene || document.body.classList.contains("safari-active")) return false;

    const areaName = normalize(document.querySelector("#area-name")?.textContent);
    const environmentLabel = normalize(document.querySelector("#environment-label")?.textContent);
    const backgroundId = normalize(scene.dataset.environmentBackground);
    const hasBeachClass = [...scene.classList].some((className) => normalize(className).includes("praia"));

    return areaName.includes("praia")
      || environmentLabel.includes("praia")
      || backgroundId.includes("praia")
      || hasBeachClass;
  }

  function createTrack(scene) {
    let track = scene.querySelector(`.${TRACK_CLASS}`);
    if (track) return track;

    track = document.createElement("div");
    track.className = TRACK_CLASS;
    track.setAttribute("aria-hidden", "true");
    track.innerHTML = "<span></span><span></span><span></span><span></span>";
    scene.insertBefore(track, scene.firstChild);
    return track;
  }

  function syncBeachTrack() {
    installStyle();

    const scene = document.querySelector("#scene");
    if (!scene) return;

    const active = isBeachScene(scene);
    scene.classList.toggle("beach-seamless-active", active);

    const track = scene.querySelector(`.${TRACK_CLASS}`);
    if (active) createTrack(scene);
    else track?.remove();
  }

  function start() {
    syncBeachTrack();

    const observer = new MutationObserver(syncBeachTrack);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "data-environment-background"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
