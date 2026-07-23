(() => {
  const STYLE_ID = "route-seamless-background-style";
  const TRACK_CLASS = "route-seamless-track";
  const ACTIVE_CLASS = "route-seamless-active";

  function installStyle() {
    if (document.querySelector(`#${STYLE_ID}`)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      body:not(.safari-active):not(.champions-hall-active) #scene.${ACTIVE_CLASS}::before {
        background-image: none !important;
        animation: none !important;
      }

      body:not(.safari-active):not(.champions-hall-active) #scene.${ACTIVE_CLASS} .${TRACK_CLASS} {
        --route-seamless-tile-width: 676px;
        --route-seamless-loop-offset: -1352px;
        position: absolute;
        z-index: 0;
        inset: 0 auto 0 0;
        display: flex;
        width: max-content;
        height: 100%;
        overflow: visible;
        pointer-events: none;
        will-change: transform;
        animation: routeSeamlessTreadmill 10s linear infinite;
        transform: translate3d(0, 0, 0);
        backface-visibility: hidden;
      }

      body:not(.safari-active):not(.champions-hall-active) #scene.${ACTIVE_CLASS} .${TRACK_CLASS} > span {
        flex: 0 0 calc(var(--route-seamless-tile-width) + 1px);
        width: calc(var(--route-seamless-tile-width) + 1px);
        height: 100%;
        margin-right: -1px;
        background-image: var(--route-background);
        background-position: center;
        background-repeat: no-repeat;
        background-size: 100% 100%;
        transform-origin: center;
        backface-visibility: hidden;
      }

      body:not(.safari-active):not(.champions-hall-active) #scene.${ACTIVE_CLASS} .${TRACK_CLASS} > span:nth-child(even) {
        transform: scaleX(-1);
      }

      body:not(.safari-active):not(.champions-hall-active) #scene.${ACTIVE_CLASS}.approach .${TRACK_CLASS} {
        animation-duration: 12s;
      }

      body:not(.safari-active):not(.champions-hall-active) #scene.${ACTIVE_CLASS}.battle .${TRACK_CLASS},
      body:not(.safari-active):not(.champions-hall-active) #scene.${ACTIVE_CLASS}.capture .${TRACK_CLASS},
      body:not(.safari-active):not(.champions-hall-active) #scene.${ACTIVE_CLASS}.recovering .${TRACK_CLASS},
      body:not(.safari-active):not(.champions-hall-active) #scene.${ACTIVE_CLASS}.journey-complete .${TRACK_CLASS} {
        animation-play-state: paused;
      }

      @keyframes routeSeamlessTreadmill {
        to { transform: translate3d(var(--route-seamless-loop-offset), 0, 0); }
      }

      @media (max-width: 700px) {
        body:not(.safari-active):not(.champions-hall-active) #scene.${ACTIVE_CLASS} .${TRACK_CLASS} {
          --route-seamless-tile-width: 548px;
          --route-seamless-loop-offset: -1096px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        body:not(.safari-active):not(.champions-hall-active) #scene.${ACTIVE_CLASS} .${TRACK_CLASS} {
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);
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

  function isSpecialArea() {
    return document.body.classList.contains("safari-active")
      || document.body.classList.contains("champions-hall-active");
  }

  function hasRouteBackground(scene) {
    if (!scene) return false;
    if (scene.dataset.environmentBackground) return true;
    return Boolean(getComputedStyle(scene).getPropertyValue("--route-background").trim());
  }

  function syncRouteTrack() {
    installStyle();

    const scene = document.querySelector("#scene");
    if (!scene) return;

    const active = !isSpecialArea() && hasRouteBackground(scene);
    scene.classList.toggle(ACTIVE_CLASS, active);

    const track = scene.querySelector(`.${TRACK_CLASS}`);
    if (active) createTrack(scene);
    else track?.remove();
  }

  function start() {
    syncRouteTrack();

    const observer = new MutationObserver(syncRouteTrack);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "data-environment-background", "style"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
