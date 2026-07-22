(() => {
  const CAPTURE_ROOT_SELECTOR = "#capture-ball-options";
  const SAFARI_BUTTON_SELECTOR = "button.safari-capture-button";

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

      // O botão é recriado pelo ciclo de renderização entre pressionar e soltar.
      // Disparar o clique imediatamente preserva a ação antes da troca do elemento.
      event.preventDefault();
      event.stopPropagation();
      button.click();
    }, { passive: false });
  }

  function installSafariFixes() {
    moveSafariHudOutsideScene();
    bindSafariCapturePointer();
  }

  function startObserver() {
    installSafariFixes();
    const observer = new MutationObserver(installSafariFixes);
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver, { once: true });
  } else {
    startObserver();
  }
})();