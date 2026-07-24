(() => {
  const STYLE_ID = "champions-hall-capture-hotfix-style";
  const ACTION_SELECTOR = "#try-capture.champions-hall-capture-button, #decline-capture";
  let pointerActionInProgress = false;

  function installStyle() {
    if (document.querySelector(`#${STYLE_ID}`)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      body.champions-hall-active #capture-panel button {
        pointer-events: auto !important;
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(style);
  }

  function isChampionsHallCaptureOpen() {
    const scene = document.querySelector("#scene");
    const panel = document.querySelector("#capture-panel");
    return Boolean(
      document.body.classList.contains("champions-hall-active")
      && scene?.classList.contains("capture")
      && panel
      && !panel.hidden
    );
  }

  document.addEventListener("pointerdown", (event) => {
    if (pointerActionInProgress || !isChampionsHallCaptureOpen()) return;

    const button = event.target.closest?.(ACTION_SELECTOR);
    if (!button || button.disabled) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    pointerActionInProgress = true;
    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      if (button.classList.contains("champions-hall-capture-button")) {
        button.dataset.captureBall = "luxury-ball";
        window.__idleJorneymonPauseCaptureTimer?.();
      }
      button.click();
    } finally {
      window.setTimeout(() => {
        pointerActionInProgress = false;
      }, 0);
    }
  }, { capture: true, passive: false });

  installStyle();
})();
