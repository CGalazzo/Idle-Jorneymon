import "./styles/base.css";
import "./styles/start-menu.css";
import "./styles/progression.css";
import "./styles/quality-of-life.css";
import "./styles/eevee-evolution.css";
import "./styles/shop.css";
import { randomEncounterTarget, startNewJourney } from "./core/game-state.js";
import { loadOfficialPokemonData } from "./data/battle-data.js";
import { getExplorationSpriteUrl } from "./data/exploration-sprites.js";
import { MEGA_FORM_IDS } from "./data/mega-data.js";
import { loadOfficialPokemonMetrics } from "./data/pokemon-metrics.js";
import { POKEDEX_SPECIES, getPokemonSpriteUrls } from "./data/pokemon.js";
import { createAreaState, getRouteDefinition } from "./data/worlds.js";
import { createAppMarkup, render as renderBase, renderPokedex, renderTeam } from "./ui/render.js";
import { enhanceProgressionMarkup, renderProgression } from "./ui/progression-ui.js";
import { enhanceEeveeEvolutionMarkup, renderEeveeEvolutionChoice } from "./ui/eevee-evolution-ui.js";
import {
  decorateHardCapturedRoster,
  enhanceHardModeMarkup,
  isHardUnlockScreenOpen,
  renderCampaignMenu,
  renderHardModeState
} from "./ui/hard-mode-ui.js";
import {
  enhanceShopMarkup,
  renderItems,
  renderShop,
  renderShopHud,
  selectShopTab,
  showShopFeedback
} from "./ui/shop-ui.js";
import { installSpriteFallbacks } from "./ui/sprite-fallbacks.js";
import { updateApproach, updateExploration } from "./systems/exploration.js";
import { updateBattle, updateRecovery } from "./systems/battle.js";
import { acknowledgeHardUnlock, switchCampaign } from "./systems/campaign.js";
import { hasSavedGame, loadGame, resetGame, saveGame } from "./systems/save.js";
import { addToTeam, sendToStorage, setActivePokemon, setTeamPosition } from "./systems/team.js";
import { attemptCapture, declineCapture, updateCaptureDecision } from "./systems/capture.js";
import { acceptEeveeEvolution, declineEeveeEvolution } from "./systems/progression.js";
import { equipMegaStone } from "./systems/mega.js";
import { buyBall, buyExpShare, buyMegaStone } from "./systems/shop.js";

const UI_RENDER_INTERVAL_MS = 50;

async function boot() {
  const app = document.querySelector("#app");
  app.innerHTML = '<div class="game-loading"><strong>Preparando a jornada...</strong><span>Carregando atributos e tamanhos oficiais dos Pokémon</span></div>';
  const speciesIds = [...new Set([
    ...POKEDEX_SPECIES.map((pokemon) => pokemon.id),
    ...MEGA_FORM_IDS
  ])];
  await Promise.all([
    loadOfficialPokemonData(speciesIds),
    loadOfficialPokemonMetrics(POKEDEX_SPECIES.map((pokemon) => pokemon.id))
  ]);
  app.innerHTML = createAppMarkup();
  installSpriteFallbacks();

  const welcomeRoot = document.querySelector("#welcome-screen");
  welcomeRoot.insertAdjacentHTML("beforeend", `
    <div id="journey-menu-screen" class="journey-menu-screen" hidden>
      <div class="journey-menu-card">
        <small>MENU DA JORNADA</small>
        <h1>Escolha o modo de jogo</h1>
        <div class="campaign-mode-actions">
          <button id="normal-mode-button" class="campaign-mode-button normal">
            <strong>MODO NORMAL</strong>
            <small id="normal-mode-status">0/150 rotas concluídas</small>
          </button>
          <button id="hard-mode-button" class="campaign-mode-button hard" disabled>
            <strong>MODO HARD</strong>
            <small id="hard-mode-status">Bloqueado · conclua as 150 rotas normais</small>
          </button>
        </div>
        <div class="journey-menu-actions">
          <button id="new-journey-button" class="journey-menu-action secondary">COMEÇAR NOVA JORNADA</button>
        </div>
        <button id="back-to-splash" class="journey-menu-back">← Voltar à tela inicial</button>
      </div>
    </div>
  `);

  enhanceProgressionMarkup();
  enhanceEeveeEvolutionMarkup();
  enhanceShopMarkup();
  enhanceHardModeMarkup();

  function memoizeInnerHTML(element) {
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    if (!element || !descriptor?.get || !descriptor?.set) return;

    let previousValue = descriptor.get.call(element);
    Object.defineProperty(element, "innerHTML", {
      configurable: true,
      get() {
        return descriptor.get.call(this);
      },
      set(value) {
        const nextValue = String(value);
        if (nextValue === previousValue) return;
        previousValue = nextValue;
        descriptor.set.call(this, nextValue);
      }
    });
  }

  [
    "#pokedex-grid",
    "#team-list",
    "#storage-list",
    "#team-mini",
    "#activity-log",
    "#capture-ball-options",
    "#shop-ball-grid",
    "#shop-exp-grid",
    "#shop-mega-grid",
    "#inventory-ball-grid",
    "#inventory-exp-grid",
    "#inventory-mega-grid"
  ].forEach((selector) => memoizeInnerHTML(document.querySelector(selector)));

  const spriteCache = new Map();
  let preloadedRouteKey = "";
  let preloadedRoutePromise = Promise.resolve();

  function preloadSprite(url) {
    if (!url) return Promise.resolve();
    const cached = spriteCache.get(url);
    if (cached) return cached.promise;

    const image = new Image();
    image.decoding = "async";
    const promise = new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      image.addEventListener("load", finish, { once: true });
      image.addEventListener("error", finish, { once: true });
      image.src = url;
      if (typeof image.decode === "function") image.decode().then(finish).catch(() => {});
    });

    spriteCache.set(url, { image, promise });
    return promise;
  }

  function preloadRouteSprites(currentState) {
    const teamKey = currentState.team.map((pokemon) => `${pokemon.id}:${pokemon.isShiny ? 1 : 0}`).join(",");
    const routeKey = `${currentState.campaignMode}:${currentState.journey?.worldIndex || 0}:${currentState.journey?.routeIndex || 0}:${teamKey}`;
    if (routeKey === preloadedRouteKey) return preloadedRoutePromise;
    preloadedRouteKey = routeKey;

    const route = getRouteDefinition(currentState.journey?.worldIndex, currentState.journey?.routeIndex);
    const routePokemon = [...route.encounters, route.boss].map((entry) => {
      return POKEDEX_SPECIES.find((pokemon) => pokemon.id === Number(entry.id)) || entry;
    });
    const pokemon = [...routePokemon, ...currentState.team];
    const urls = new Set();

    pokemon.forEach((entry) => {
      [false, true].forEach((isShiny) => {
        const sprites = getPokemonSpriteUrls(entry.megaFormId || entry.id, isShiny);
        urls.add(sprites.sprite);
        urls.add(sprites.backSprite);
        urls.add(getExplorationSpriteUrl({ ...entry, isShiny }, isShiny));
      });
    });

    preloadedRoutePromise = Promise.all([...urls].map(preloadSprite));
    return preloadedRoutePromise;
  }

  let state = loadGame();
  let lastFrame = performance.now();
  let lastRender = 0;
  let lastSave = performance.now();
  let isMenuOpen = true;
  let isTeamOpen = false;
  let isShopOpen = false;
  let isItemsOpen = false;

  const welcomeScreen = document.querySelector("#welcome-screen");
  const splashScreen = document.querySelector("#splash-screen");
  const journeyMenuScreen = document.querySelector("#journey-menu-screen");
  const starterCard = document.querySelector("#starter-card");
  const starterSelection = document.querySelector("#starter-selection");
  const normalModeButton = document.querySelector("#normal-mode-button");
  const hardModeButton = document.querySelector("#hard-mode-button");
  const resetButton = document.querySelector("#reset-button");
  const environmentLabel = document.querySelector("#environment-label");
  const scene = document.querySelector("#scene");
  const eeveeEvolutionDialog = document.querySelector("#eevee-evolution-dialog");
  const hardUnlockDialog = document.querySelector("#hard-unlock-dialog");
  const teamDialog = document.querySelector("#team-dialog");
  const shopDialog = document.querySelector("#shop-dialog");
  const itemsDialog = document.querySelector("#items-dialog");

  document.querySelector("#back-to-welcome").textContent = "← Voltar ao menu";
  starterSelection.querySelector("p").textContent = "Escolha um dos Pokémon abaixo para iniciar sua jornada.";
  resetButton.title = "Reiniciar rota";
  resetButton.setAttribute("aria-label", "Reiniciar rota");
  if (environmentLabel) {
    environmentLabel.style.color = "#000";
    environmentLabel.style.opacity = "1";
    environmentLabel.style.textShadow = "0 1px 2px rgba(255,255,255,.75)";
  }

  function updateSceneMetrics() {
    const width = scene.clientWidth || 1;
    scene.style.setProperty("--approach-distance", `${Math.max(1, Math.round(width * 0.42))}px`);
  }

  updateSceneMetrics();
  if (typeof ResizeObserver === "function") {
    const sceneResizeObserver = new ResizeObserver(updateSceneMetrics);
    sceneResizeObserver.observe(scene);
  } else {
    window.addEventListener("resize", updateSceneMetrics, { passive: true });
  }

  function renderGame() {
    preloadRouteSprites(state);
    renderBase(state);
    renderProgression(state);
    renderShopHud(state);
    renderHardModeState(state);
    if (teamDialog.open) decorateHardCapturedRoster(state);
    renderEeveeEvolutionChoice(state, !isMenuOpen && !isTeamOpen && !isShopOpen && !isItemsOpen && !isHardUnlockScreenOpen());
  }

  function setWelcomeView(view) {
    splashScreen.hidden = view !== "splash";
    journeyMenuScreen.hidden = view !== "menu";
    starterCard.hidden = view !== "starters";
    starterSelection.hidden = view !== "starters";
    welcomeScreen.classList.toggle("showing-secondary", view !== "splash");
  }

  function showGame() {
    isMenuOpen = false;
    welcomeScreen.classList.add("is-hidden");
    welcomeScreen.classList.remove("showing-secondary");
    document.body.classList.remove("welcome-open");
    lastFrame = performance.now();
    updateSceneMetrics();
    renderGame();
  }

  function showWelcome() {
    isMenuOpen = true;
    saveGame(state);
    welcomeScreen.classList.remove("is-hidden");
    document.body.classList.add("welcome-open");
    setWelcomeView("splash");
  }

  function showJourneyMenu() {
    isMenuOpen = true;
    saveGame(state);
    welcomeScreen.classList.remove("is-hidden");
    document.body.classList.add("welcome-open");
    renderCampaignMenu(state);
    setWelcomeView("menu");
  }

  function showStarterSelection() {
    isMenuOpen = true;
    setWelcomeView("starters");
  }

  function restartCurrentRoute() {
    const worldIndex = Math.max(0, Number(state.journey?.worldIndex) || 0);
    const routeIndex = Math.max(0, Number(state.journey?.routeIndex) || 0);

    state.area = createAreaState(worldIndex, routeIndex);
    state.mode = "exploring";
    state.pendingRouteAdvance = false;
    state.battleParticipants = [];
    state.captureOffer = null;
    state.approachProgress = 0;
    state.enemy = null;
    state.exploration = 0;
    state.nextEncounterAt = randomEncounterTarget();
    state.battleCooldown = 0;
    state.recoveryCooldown = 0;

    state.team.forEach((pokemon) => {
      pokemon.hp = pokemon.maxHp;
    });
    if (!state.team[state.activeTeamIndex]) state.activeTeamIndex = 0;

    if (Array.isArray(state.log)) {
      state.log.unshift(`Rota ${state.area.routeNumber}${state.campaignMode === "hard" ? " Hard" : ""} reiniciada. Sua equipe foi curada.`);
      state.log = state.log.slice(0, 7);
    }

    preloadedRouteKey = "";
    saveGame(state);
    lastSave = performance.now();
    lastFrame = performance.now();
    renderGame();
  }

  function loop(now) {
    const delta = Math.min((now - lastFrame) / 1000, 0.25);
    lastFrame = now;

    const evolutionChoicePending = Boolean(state.pendingEvolutionChoices?.length);
    if (state.hasStarted && !document.hidden && !isMenuOpen && !isTeamOpen && !isShopOpen && !isItemsOpen && !isHardUnlockScreenOpen() && !evolutionChoicePending) {
      const previousMode = state.mode;
      if (state.mode === "exploring") updateExploration(state, delta);
      if (state.mode === "approach") updateApproach(state, delta);
      if (state.mode === "battle") updateBattle(state, delta);
      if (state.mode === "recovering") updateRecovery(state, delta);
      if (state.mode === "capture" && updateCaptureDecision(state, Date.now())) {
        saveGame(state);
        lastSave = now;
      }

      if (now - lastSave >= 5000) {
        saveGame(state);
        lastSave = now;
      }

      const modeChanged = previousMode !== state.mode;
      if (modeChanged || state.pendingEvolutionChoices?.length || state.hardUnlockCelebrationPending || now - lastRender >= UI_RENDER_INTERVAL_MS) {
        renderGame();
        lastRender = now;
      }
    }

    requestAnimationFrame(loop);
  }

  document.querySelector("#start-image-button").addEventListener("click", showJourneyMenu);
  document.querySelector("#back-to-splash").addEventListener("click", showWelcome);
  document.querySelector("#new-journey-button").addEventListener("click", showStarterSelection);
  document.querySelector("#back-to-welcome").addEventListener("click", showJourneyMenu);
  document.querySelector("#menu-button").addEventListener("click", showJourneyMenu);

  document.querySelectorAll("[data-starter-id]").forEach((button) => {
    button.addEventListener("click", () => {
      if (hasSavedGame() && !window.confirm("Começar uma nova jornada apagará o progresso atual. Deseja continuar?")) return;
      resetGame();
      state = startNewJourney(button.dataset.starterId);
      preloadedRouteKey = "";
      saveGame(state);
      showGame();
    });
  });

  normalModeButton.addEventListener("click", () => {
    if (!hasSavedGame() || normalModeButton.disabled) return;
    if (!switchCampaign(state, "normal")) return;
    preloadedRouteKey = "";
    saveGame(state);
    showGame();
  });

  hardModeButton.addEventListener("click", () => {
    if (!hasSavedGame() || hardModeButton.disabled) return;
    if (!switchCampaign(state, "hard")) return;
    preloadedRouteKey = "";
    saveGame(state);
    showGame();
  });

  document.querySelector("#hard-unlock-menu-button").addEventListener("click", () => {
    acknowledgeHardUnlock(state);
    saveGame(state);
    if (hardUnlockDialog.open) hardUnlockDialog.close();
    showJourneyMenu();
  });
  hardUnlockDialog.addEventListener("cancel", (event) => event.preventDefault());

  document.querySelector("#pokedex-button").addEventListener("click", () => {
    renderPokedex(state);
    document.querySelector("#pokedex-dialog").showModal();
  });

  document.querySelector("#close-pokedex").addEventListener("click", () => {
    document.querySelector("#pokedex-dialog").close();
  });

  document.querySelector("#team-button").addEventListener("click", () => {
    isTeamOpen = true;
    saveGame(state);
    renderTeam(state);
    decorateHardCapturedRoster(state);
    teamDialog.showModal();
  });

  document.querySelector("#close-team").addEventListener("click", () => {
    teamDialog.close();
  });

  teamDialog.addEventListener("close", () => {
    isTeamOpen = false;
    lastFrame = performance.now();
    renderGame();
  });

  teamDialog.addEventListener("click", (event) => {
    if (event.target.id === "team-dialog") {
      teamDialog.close();
      return;
    }

    const actionButton = event.target.closest("button");
    if (!actionButton || actionButton.disabled) return;
    let changed = false;
    if (actionButton.dataset.teamPosition) changed = setTeamPosition(state, actionButton.dataset.teamPosition, actionButton.dataset.position);
    if (actionButton.dataset.setActive) changed = setActivePokemon(state, actionButton.dataset.setActive);
    if (actionButton.dataset.sendStorage) changed = sendToStorage(state, actionButton.dataset.sendStorage);
    if (actionButton.dataset.addTeam) changed = addToTeam(state, actionButton.dataset.addTeam);
    if (actionButton.dataset.equipMega) changed = equipMegaStone(state, actionButton.dataset.equipMega, actionButton.dataset.megaPokemon);
    if (changed) {
      preloadedRouteKey = "";
      saveGame(state);
      renderTeam(state);
      decorateHardCapturedRoster(state);
      renderGame();
    }
  });

  document.querySelector("#capture-ball-options").addEventListener("click", (event) => {
    const normalButton = event.target.closest("#try-capture");
    const ballButton = event.target.closest("[data-capture-ball]");
    if ((!normalButton && !ballButton) || ballButton?.disabled) return;
    attemptCapture(state, ballButton?.dataset.captureBall || null);
    saveGame(state);
    renderGame();
  });

  document.querySelector("#decline-capture").addEventListener("click", () => {
    declineCapture(state);
    saveGame(state);
    renderGame();
  });

  document.querySelector("#shop-button").addEventListener("click", () => {
    if (state.mode !== "exploring" || state.pendingEvolutionChoices?.length) return;
    isShopOpen = true;
    saveGame(state);
    selectShopTab("balls");
    showShopFeedback("");
    renderShop(state);
    shopDialog.showModal();
  });

  document.querySelector("#close-shop").addEventListener("click", () => shopDialog.close());

  shopDialog.addEventListener("close", () => {
    isShopOpen = false;
    lastFrame = performance.now();
    renderGame();
  });

  shopDialog.addEventListener("click", (event) => {
    if (event.target === shopDialog) {
      shopDialog.close();
      return;
    }

    const tabButton = event.target.closest("[data-shop-tab]");
    if (tabButton) {
      selectShopTab(tabButton.dataset.shopTab);
      return;
    }

    const actionButton = event.target.closest("button");
    if (!actionButton || actionButton.disabled) return;
    let changed = false;
    if (actionButton.dataset.buyBall) changed = buyBall(state, actionButton.dataset.buyBall);
    if (actionButton.dataset.buyExpShare) changed = buyExpShare(state, actionButton.dataset.buyExpShare);
    if (actionButton.dataset.buyMegaStone) changed = buyMegaStone(state, actionButton.dataset.buyMegaStone);
    if (changed) {
      saveGame(state);
      renderShop(state);
      showShopFeedback("Compra concluída! O item já aparece no botão ITENS.");
      renderGame();
    }
  });

  document.querySelector("#items-button").addEventListener("click", () => {
    if (state.mode !== "exploring" || state.pendingEvolutionChoices?.length) return;
    isItemsOpen = true;
    saveGame(state);
    renderItems(state);
    itemsDialog.showModal();
  });

  document.querySelector("#close-items").addEventListener("click", () => itemsDialog.close());

  itemsDialog.addEventListener("close", () => {
    isItemsOpen = false;
    lastFrame = performance.now();
    renderGame();
  });

  itemsDialog.addEventListener("click", (event) => {
    if (event.target === itemsDialog) itemsDialog.close();
  });

  document.querySelector("#accept-eevee-evolution").addEventListener("click", () => {
    acceptEeveeEvolution(state);
    preloadedRouteKey = "";
    saveGame(state);
    lastSave = performance.now();
    lastFrame = performance.now();
    renderGame();
  });

  document.querySelector("#decline-eevee-evolution").addEventListener("click", () => {
    declineEeveeEvolution(state);
    saveGame(state);
    lastSave = performance.now();
    lastFrame = performance.now();
    renderGame();
  });

  eeveeEvolutionDialog.addEventListener("cancel", (event) => event.preventDefault());

  document.querySelector("#pokedex-dialog").addEventListener("click", (event) => {
    if (event.target.id === "pokedex-dialog") event.target.close();
  });

  resetButton.addEventListener("click", () => {
    if (!window.confirm("Deseja reiniciar a rota atual e curar toda a equipe?")) return;
    restartCurrentRoute();
  });

  window.addEventListener("beforeunload", () => saveGame(state));
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveGame(state);
    lastFrame = performance.now();
  });

  await preloadRouteSprites(state);
  renderGame();
  showWelcome();
  requestAnimationFrame(loop);
}

boot();
