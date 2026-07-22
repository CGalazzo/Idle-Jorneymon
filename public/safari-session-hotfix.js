(() => {
  const SAVE_KEY = "idle-jorneymon-save";
  const STYLE_ID = "safari-result-summary-hotfix-style";
  let menuClickAllowed = false;
  let refreshScheduled = false;

  function readLastResult() {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
      return saved?.safari?.lastResult || null;
    } catch {
      return null;
    }
  }

  function formatElapsed(milliseconds, reason = "") {
    const raw = Number(milliseconds);
    const safe = Number.isFinite(raw) && raw >= 0
      ? raw
      : reason === "time" ? 15 * 60 * 1000 : 0;
    const totalSeconds = Math.max(0, Math.floor(safe / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function installResultStyle() {
    if (document.querySelector(`#${STYLE_ID}`)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .safari-result-stats { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
      .safari-result-stats div { min-width: 0; }
      .safari-result-stats strong { font-variant-numeric: tabular-nums; }
      @media (max-width: 520px) {
        .safari-result-stats { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function ensureTimeStat() {
    const stats = document.querySelector("#safari-result-dialog .safari-result-stats");
    if (!stats) return null;

    let time = document.querySelector("#safari-result-time");
    if (!time) {
      const card = document.createElement("div");
      card.innerHTML = '<strong id="safari-result-time">00:00</strong><small>TEMPO</small>';
      stats.insertBefore(card, stats.firstChild);
      time = card.querySelector("strong");
    }
    return time;
  }

  function refreshResultSummary() {
    installResultStyle();
    const time = ensureTimeStat();
    const result = readLastResult();
    if (!time || !result) return;
    const nextValue = formatElapsed(result.elapsedMs, result.reason);
    if (time.textContent !== nextValue) time.textContent = nextValue;
  }

  function scheduleRefresh() {
    if (refreshScheduled) return;
    refreshScheduled = true;
    window.requestAnimationFrame(() => {
      refreshScheduled = false;
      refreshResultSummary();
    });
  }

  document.addEventListener("click", (event) => {
    const menuButton = event.target.closest?.("#menu-button");
    if (!menuButton || menuClickAllowed) return;

    const resultDialog = document.querySelector("#safari-result-dialog");
    if (!resultDialog || resultDialog.open || !readLastResult()) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    window.requestAnimationFrame(() => {
      menuClickAllowed = true;
      try {
        menuButton.click();
      } finally {
        menuClickAllowed = false;
      }
      refreshResultSummary();
    });
  }, true);

  function start() {
    refreshResultSummary();
    const observer = new MutationObserver(scheduleRefresh);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
