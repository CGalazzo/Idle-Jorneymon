(() => {
  const STYLE_ID = "encounter-sprite-smooth-style";
  const READY_CLASS = "encounter-sprite-ready";
  const ANIMATED_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";
  const SHOWDOWN_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown";
  const LAST_GENERATION_FIVE_SPECIES_ID = 649;
  const SAFARI_HABITAT_SPECIES = {
    "campo aberto": [531, 83, 113, 241, 115, 128, 132],
    selva: [214, 127, 123, 357, 570, 636, 352],
    "lago safari": [349, 147, 131, 366, 350, 230, 489],
    desfiladeiro: [447, 610, 246, 374, 443, 782, 884],
    "ruinas antigas": [201, 355, 442, 479, 477, 571, 999]
  };

  const preloadedUrls = new Set();
  let currentToken = 0;
  let attachedImage = null;
  let attachedEnemy = null;
  let attachedScene = null;
  let wasApproaching = false;
  let activationScheduled = false;

  function normalize(value = "") {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();
  }

  function explorationSpriteUrl(speciesId, shiny = false) {
    const id = Math.max(1, Number(speciesId) || 1);
    const shinyPath = shiny ? "shiny/" : "";
    const base = id <= LAST_GENERATION_FIVE_SPECIES_ID
      ? ANIMATED_SPRITE_BASE
      : SHOWDOWN_SPRITE_BASE;
    return `${base}/${shinyPath}${id}.gif`;
  }

  function preloadUrl(url) {
    if (!url || preloadedUrls.has(url)) return;
    preloadedUrls.add(url);
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    if (typeof image.decode === "function") image.decode().catch(() => {});
  }

  function preloadSafariHabitat() {
    const habitatName = normalize(document.querySelector("#safari-hud-habitat")?.textContent);
    const speciesIds = SAFARI_HABITAT_SPECIES[habitatName];
    if (!speciesIds) return;

    speciesIds.forEach((id) => {
      preloadUrl(explorationSpriteUrl(id, false));
      preloadUrl(explorationSpriteUrl(id, true));
    });
  }

  function addPreconnect(url) {
    if (document.head.querySelector(`link[data-encounter-preconnect="${url}"]`)) return;
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = url;
    link.crossOrigin = "anonymous";
    link.dataset.encounterPreconnect = url;
    document.head.appendChild(link);
  }

  function installStyle() {
    if (document.querySelector(`#${STYLE_ID}`)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #scene .approaching-enemy {
        opacity: 0;
        transition: opacity .18s ease-out;
      }

      #scene .approaching-enemy.${READY_CLASS} {
        opacity: 1;
      }

      #scene.approach .approaching-enemy:not(.${READY_CLASS}):not([hidden]) {
        animation-play-state: paused !important;
      }

      #scene.approach .approaching-enemy.${READY_CLASS}:not([hidden]) {
        animation-play-state: running !important;
      }

      @media (prefers-reduced-motion: reduce) {
        #scene .approaching-enemy { transition: none; }
      }
    `;
    document.head.appendChild(style);
  }

  function waitForImage(image, token) {
    if (!image) return Promise.resolve();
    if (image.complete && image.naturalWidth > 0) {
      return typeof image.decode === "function"
        ? image.decode().catch(() => {})
        : Promise.resolve();
    }

    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        image.removeEventListener("load", finish);
        image.removeEventListener("error", finish);
        resolve();
      };
      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });
      window.setTimeout(finish, 700);
    }).then(() => {
      if (token !== currentToken) return;
      if (image.complete && image.naturalWidth > 0 && typeof image.decode === "function") {
        return image.decode().catch(() => {});
      }
    });
  }

  function restartApproachAnimation() {
    if (!attachedEnemy) return;
    attachedEnemy.classList.remove(READY_CLASS);
    attachedEnemy.style.animation = "none";
    void attachedEnemy.offsetWidth;
    attachedEnemy.style.removeProperty("animation");
  }

  function activateWhenReady() {
    if (!attachedScene || !attachedEnemy || !attachedImage) return;
    if (!attachedScene.classList.contains("approach") || attachedEnemy.hidden) return;
    if (activationScheduled) return;

    activationScheduled = true;
    const token = ++currentToken;
    const expectedSrc = attachedImage.currentSrc || attachedImage.src;
    restartApproachAnimation();

    waitForImage(attachedImage, token).then(() => {
      if (token !== currentToken) return;
      if (!attachedScene?.classList.contains("approach") || attachedEnemy?.hidden) return;
      if ((attachedImage.currentSrc || attachedImage.src) !== expectedSrc) return;

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          activationScheduled = false;
          if (token !== currentToken) return;
          if (!attachedScene?.classList.contains("approach") || attachedEnemy?.hidden) return;
          attachedEnemy.classList.add(READY_CLASS);
        });
      });
    }).catch(() => {
      activationScheduled = false;
      if (token === currentToken && attachedScene?.classList.contains("approach") && !attachedEnemy?.hidden) {
        attachedEnemy.classList.add(READY_CLASS);
      }
    });
  }

  function handleSceneState() {
    if (!attachedScene || !attachedEnemy) return;
    const approaching = attachedScene.classList.contains("approach");

    if (approaching && !wasApproaching) {
      currentToken += 1;
      activationScheduled = false;
      restartApproachAnimation();
      activateWhenReady();
    }

    if (!approaching && wasApproaching) {
      currentToken += 1;
      activationScheduled = false;
      attachedEnemy.classList.remove(READY_CLASS);
      attachedEnemy.style.removeProperty("animation");
    }

    wasApproaching = approaching;
  }

  function attachEncounterElements() {
    const scene = document.querySelector("#scene");
    const enemy = document.querySelector("#approaching-enemy");
    const image = document.querySelector("#approaching-enemy-sprite");
    if (!scene || !enemy || !image) return false;
    if (scene === attachedScene && enemy === attachedEnemy && image === attachedImage) return true;

    attachedScene = scene;
    attachedEnemy = enemy;
    attachedImage = image;
    wasApproaching = scene.classList.contains("approach");

    const imageObserver = new MutationObserver(() => {
      currentToken += 1;
      activationScheduled = false;
      attachedEnemy.classList.remove(READY_CLASS);
      preloadUrl(attachedImage.currentSrc || attachedImage.src);
      activateWhenReady();
    });
    imageObserver.observe(image, { attributes: true, attributeFilter: ["src"] });

    const enemyObserver = new MutationObserver(() => {
      if (enemy.hidden) {
        currentToken += 1;
        activationScheduled = false;
        enemy.classList.remove(READY_CLASS);
        return;
      }
      activateWhenReady();
    });
    enemyObserver.observe(enemy, { attributes: true, attributeFilter: ["hidden"] });

    const sceneObserver = new MutationObserver(handleSceneState);
    sceneObserver.observe(scene, { attributes: true, attributeFilter: ["class"] });

    preloadSafariHabitat();
    handleSceneState();
    return true;
  }

  function start() {
    installStyle();
    addPreconnect("https://raw.githubusercontent.com");
    attachEncounterElements();

    const pageObserver = new MutationObserver(() => {
      attachEncounterElements();
      preloadSafariHabitat();
    });
    pageObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
