(() => {
  "use strict";

  let scheduled = false;

  function activePokemonIsShiny() {
    return Boolean(document.querySelector("#team-mini .mini-member.active.shiny"));
  }

  function syncShinyAura() {
    scheduled = false;
    const isShiny = activePokemonIsShiny();

    document.querySelector(".partner-row")?.classList.toggle("shiny-used", isShiny);
    document.querySelector("#partner-sprite")?.classList.toggle("shiny-used", isShiny);
    document.querySelector("#battle-stage .player-card")?.classList.toggle("shiny-used", isShiny);
    document.querySelector("#walker")?.classList.toggle("shiny-used", isShiny);
  }

  function scheduleSync() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(syncShinyAura);
  }

  function install() {
    const root = document.querySelector("#app") || document.body;
    const observer = new MutationObserver(scheduleSync);
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class", "hidden", "src"]
    });

    scheduleSync();
    window.setInterval(scheduleSync, 500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
