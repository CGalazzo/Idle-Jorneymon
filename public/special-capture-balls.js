(() => {
  let scheduled = false;

  function applySpecialCaptureBalls() {
    const safariButton = document.querySelector("#try-capture.safari-capture-button");
    if (safariButton) {
      safariButton.dataset.captureBall = "safari-ball";
      safariButton.setAttribute("aria-label", "Usar Safari Ball");
    }

    const championsButton = document.querySelector("#try-capture.champions-hall-capture-button");
    if (championsButton) {
      championsButton.dataset.captureBall = "poke-ball";
      championsButton.setAttribute("aria-label", "Usar Poké Bola dourada do Salão dos Campeões");
    }
  }

  function scheduleApply() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      applySpecialCaptureBalls();
    });
  }

  function start() {
    applySpecialCaptureBalls();
    const observer = new MutationObserver(scheduleApply);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "hidden"]
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
