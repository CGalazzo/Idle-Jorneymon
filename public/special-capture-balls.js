(() => {
  let scheduled = false;

  function decorateButton(button) {
    if (!button) return;
    if (button.classList.contains("safari-capture-button")) {
      button.dataset.captureBall = "safari-ball";
      button.setAttribute("aria-label", "Usar Safari Ball");
    }
    if (button.classList.contains("champions-hall-capture-button")) {
      button.dataset.captureBall = "luxury-ball";
      button.setAttribute("aria-label", "Usar Luxury Ball no Salão dos Campeões");
    }
  }

  function applySpecialCaptureBalls() {
    decorateButton(document.querySelector("#try-capture.safari-capture-button"));
    decorateButton(document.querySelector("#try-capture.champions-hall-capture-button"));
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

    // Este listener roda antes do módulo visual e garante que a animação receba
    // a sprite correta mesmo quando o botão acabou de ser recriado pela interface.
    document.addEventListener("click", (event) => {
      decorateButton(event.target.closest?.("#try-capture"));
    }, true);

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
