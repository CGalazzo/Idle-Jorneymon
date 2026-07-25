(() => {
  "use strict";

  let scheduled = false;

  function activePokemonIsShiny() {
    return Boolean(document.querySelector("#team-mini .mini-member.active.shiny"));
  }

  function resolveWalkerSprite() {
    const walker = document.querySelector("#walker");
    if (!walker) return null;

    if (walker.matches("img, picture, canvas, svg")) {
      return walker;
    }

    return walker.querySelector("img, picture, canvas, svg") || walker;
  }

  function currentAuraTargets() {
    return new Set([
      document.querySelector("#partner-sprite"),
      document.querySelector("#battle-stage .player-card .pokemon-sprite"),
      resolveWalkerSprite()
    ].filter(Boolean));
  }

  function syncShinyAura() {
    scheduled = false;
    const isShiny = activePokemonIsShiny();
    const targets = currentAuraTargets();

    document.querySelector(".partner-row")?.classList.toggle("shiny-used", isShiny);
    document.querySelector("#battle-stage .player-card")?.classList.toggle("shiny-used", isShiny);
    document.querySelector("#walker")?.classList.toggle("shiny-used", isShiny);

    document.querySelectorAll(".shiny-sprite-aura").forEach((element) => {
      if (!isShiny || !targets.has(element)) {
        element.classList.remove("shiny-sprite-aura");
      }
    });

    if (isShiny) {
      targets.forEach((element) => element.classList.add("shiny-sprite-aura"));
    }
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
