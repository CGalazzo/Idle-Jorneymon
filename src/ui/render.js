import { getMegaStonesForSpecies } from "../data/mega-data.js";
import { POKEDEX_SPECIES, STARTERS } from "../data/pokemon.js";
import { getExplorationSpriteUrl } from "../data/exploration-sprites.js";
import { getExplorationSpriteSize } from "../data/pokemon-metrics.js";
import { getActivePokemon, MAX_TEAM_SIZE } from "../core/game-state.js";
import {
  CAPTURE_DECISION_MS,
  getCaptureBallOptions,
  getCaptureChance
} from "../systems/capture.js";

const modeCopy = {
  exploring: ["EXPLORANDO", "Próximo encontro"],
  approach: ["ENCONTRO!", "Pokémon se aproximando"],
  battle: ["BATALHA AUTOMÁTICA", "Batalha em andamento"],
  capture: ["DECISÃO DE CAPTURA", "Pokémon derrotado"],
  recovering: ["RECUPERANDO", "Retornando à jornada"]
};

const SCENE_MODE_CLASSES = Object.keys(modeCopy);
const GROUND_CONTACT_INSET_PX = 4;
const DEFAULT_BOTTOM_PADDING_RATIO = 0.08;
const groundPaddingCache = new Map();

function percent(value, max) {
  return Math.max(0, Math.min(100, (value / max) * 100));
}

function healthClass(value, max) {
  const ratio = value / max;
  if (ratio <= 0.25) return "danger";
  if (ratio <= 0.5) return "warning";
  return "";
}

function pokemonCard(pokemon, enemy = false) {
  if (!pokemon) return "";
  const hpPercent = percent(pokemon.hp, pokemon.maxHp);
  const sprite = enemy ? pokemon.sprite : pokemon.backSprite;

  return `
    <article class="pokemon-card ${enemy ? "enemy-card" : "player-card"}">
      <div class="pokemon-info">
        <div class="name-line"><strong>${pokemon.name}</strong><span>NV. ${pokemon.level}</span></div>
        <div class="bar health"><i class="${healthClass(pokemon.hp, pokemon.maxHp)}" style="width:${hpPercent}%"></i></div>
        <small>${pokemon.hp} / ${pokemon.maxHp} HP</small>
      </div>
      <img class="pokemon-sprite" src="${sprite}" alt="${pokemon.name}" />
    </article>`;
}

function applyGroundOffset(element, size, bottomPaddingRatio = DEFAULT_BOTTOM_PADDING_RATIO) {
  const scaledBottomPadding = size * Math.max(0, bottomPaddingRatio);
  const offset = Math.max(-GROUND_CONTACT_INSET_PX, Math.min(size * 0.24, scaledBottomPadding - GROUND_CONTACT_INSET_PX));
  element.style.setProperty("--exploration-ground-offset", `${Math.round(offset)}px`);
}

function measureBottomPaddingRatio(image) {
  if (!image.naturalWidth || !image.naturalHeight) return DEFAULT_BOTTOM_PADDING_RATIO;

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return DEFAULT_BOTTOM_PADDING_RATIO;

  try {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let bottomVisibleY = -1;

    for (let y = canvas.height - 1; y >= 0 && bottomVisibleY < 0; y -= 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const alpha = pixels[(y * canvas.width + x) * 4 + 3];
        if (alpha > 12) {
          bottomVisibleY = y;
          break;
        }
      }
    }

    if (bottomVisibleY < 0) return DEFAULT_BOTTOM_PADDING_RATIO;
    return Math.max(0, (canvas.height - 1 - bottomVisibleY) / canvas.height);
  } catch (error) {
    console.warn("Idle Jorneymon: não foi possível calibrar o contato da sprite com o chão.", error);
    return DEFAULT_BOTTOM_PADDING_RATIO;
  }
}

function calibrateSpriteGround(element, image, sprite, size) {
  const cachedRatio = groundPaddingCache.get(sprite);
  if (Number.isFinite(cachedRatio)) {
    applyGroundOffset(element, size, cachedRatio);
    return;
  }

  if (element.dataset.groundCalibrationSprite === sprite) return;
  element.dataset.groundCalibrationSprite = sprite;

  const calibrate = () => {
    requestAnimationFrame(() => {
      if (element.dataset.pokemonSprite !== sprite) return;
      const ratio = measureBottomPaddingRatio(image);
      groundPaddingCache.set(sprite, ratio);
      applyGroundOffset(element, getComputedStyle(element).getPropertyValue("--exploration-sprite-size")
        ? Number.parseFloat(getComputedStyle(element).getPropertyValue("--exploration-sprite-size")) || size
        : size, ratio);
    });
  };

  if (image.complete && image.naturalWidth) calibrate();
  else image.addEventListener("load", calibrate, { once: true });
}

function applyExplorationSpriteSize(element, pokemon, image, sprite) {
  const size = getExplorationSpriteSize(pokemon);
  element.style.setProperty("--exploration-sprite-size", `${size}px`);
  element.style.setProperty("--exploration-shadow-width", `${Math.max(30, Math.round(size * 0.66))}px`);
  applyGroundOffset(element, size, groundPaddingCache.get(sprite));
  calibrateSpriteGround(element, image, sprite, size);
}

function updateExplorationPokemon(element, pokemon, { facingLeft = false } = {}) {
  if (!element || !pokemon) return;
  const image = element.querySelector("img");
  const sprite = getExplorationSpriteUrl(pokemon);
  const spriteChanged = element.dataset.pokemonSprite !== sprite;

  if (spriteChanged) {
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = sprite;
    image.alt = `${pokemon.name} ${element.id === "walker" ? "caminhando" : "se aproximando"}`;
    element.dataset.pokemonSprite = sprite;
    element.dataset.pokemonId = String(pokemon.id);
    delete element.dataset.groundCalibrationSprite;
  }

  element.classList.toggle("shiny", Boolean(pokemon.isShiny));
  element.classList.toggle("facing-left", facingLeft);
  applyExplorationSpriteSize(element, pokemon, image, sprite);
  element.hidden = false;
}

function hideExplorationPokemon(element) {
  if (element) element.hidden = true;
}

function updateBattleCard(card, pokemon) {
  if (!card || !pokemon) return;
  const hpBar = card.querySelector(".bar.health i");
  hpBar.style.width = `${percent(pokemon.hp, pokemon.maxHp)}%`;
  hpBar.className = healthClass(pokemon.hp, pokemon.maxHp);
  card.querySelector(".pokemon-info small").textContent = `${pokemon.hp} / ${pokemon.maxHp} HP`;
  card.querySelector(".name-line strong").textContent = pokemon.name;
  card.querySelector(".name-line span").textContent = `NV. ${pokemon.level}`;
  const sprite = card.querySelector(".pokemon-sprite");
  const expectedSprite = card.classList.contains("enemy-card") ? pokemon.sprite : pokemon.backSprite;
  if (sprite.src !== expectedSprite) sprite.src = expectedSprite;
  sprite.alt = pokemon.name;
}

function updateSceneMode(scene, mode) {
  if (scene.dataset.renderMode === mode) return false;
  scene.classList.remove(...SCENE_MODE_CLASSES);
  scene.classList.add(mode);
  scene.dataset.renderMode = mode;
  return true;
}

function updateCaptureTimer(state) {
  const expiresAt = Number(state.captureOffer?.expiresAt) || Date.now() + CAPTURE_DECISION_MS;
  const remainingMs = Math.max(0, expiresAt - Date.now());
  const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  document.querySelector("#capture-time-copy").textContent = `Não capturar automaticamente em ${remainingSeconds}s`;
  document.querySelector("#capture-time-bar").style.width = `${Math.min(100, (remainingMs / CAPTURE_DECISION_MS) * 100)}%`;
}

function renderCaptureOptions(state) {
  const root = document.querySelector("#capture-ball-options");
  if (!root || !state.enemy) return;
  const baseChance = getCaptureChance(state.enemy);
  const ballButtons = getCaptureBallOptions(state, state.enemy).map((ball) => {
    const disabled = !ball.unlocked || ball.stock <= 0;
    const status = !ball.unlocked ? "BLOQUEADA" : `x${ball.stock}`;
    return `<button class="ball-capture" data-capture-ball="${ball.id}" ${disabled ? "disabled" : ""}>
      ${ball.shortName} — ${ball.chance}%
      <span>${status}${ball.stock > 0 && ball.unlocked ? ` · +${ball.bonus}%` : ""}</span>
    </button>`;
  }).join("");

  root.innerHTML = `
    <button id="try-capture" class="normal-capture">Captura normal — ${baseChance}%<span>GRÁTIS</span></button>
    ${ballButtons}
  `;
}

export function createAppMarkup() {
  return `
    <section id="welcome-screen" class="welcome-screen">
      <div id="splash-screen" class="splash-screen">
        <button id="start-image-button" class="start-image-button" aria-label="Toque para começar uma nova jornada">
          <img src="/assets/idlemon-jorney-start.webp" alt="Idlemon Jorney — toque para começar" />
        </button>
        <button id="continue-button" class="splash-continue" hidden>Continuar jornada</button>
      </div>
      <div id="starter-card" class="welcome-card starter-card" hidden>
        <div id="starter-selection" class="starter-selection">
          <button id="back-to-welcome" class="text-button">← Voltar à tela inicial</button>
          <h2>Escolha seu primeiro parceiro</h2>
          <p>Essa escolha ficará vinculada ao seu progresso.</p>
          <div class="starter-grid">
            ${STARTERS.map((starter) => `
              <button class="starter-option" data-starter-id="${starter.id}">
                <span class="starter-image"><img src="${starter.sprite}" alt="${starter.name}" /></span>
                <strong>${starter.name}</strong><small>${starter.type}</small>
              </button>`).join("")}
          </div>
        </div>
      </div>
    </section>
    <div class="app-shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">◆</span><div><strong>IDLE JORNEYMON</strong><small>Uma jornada automática</small></div></div>
        <div class="header-actions"><button id="menu-button" class="menu-button">VOLTAR AO MENU</button><button id="team-button" class="team-button">EQUIPE</button><button id="pokedex-button" class="pokedex-button">POKÉDEX</button><button id="reset-button" class="icon-button" aria-label="Reiniciar progresso" title="Reiniciar progresso">↻</button></div>
      </header>

      <main>
        <section class="journey-heading">
          <div><small>ÁREA ATUAL</small><h1 id="area-name">Rota 1</h1></div>
          <span id="mode-badge" class="mode-badge"></span>
        </section>

        <section id="scene" class="scene exploring" aria-live="polite">
          <div class="sky"><span class="cloud cloud-one"></span><span class="cloud cloud-two"></span></div>
          <div class="distant-hills"></div><div class="grass-line"></div><div class="path"></div>
          <div id="battle-stage" class="battle-stage"></div>
          <div id="walker" class="walker" hidden><img id="walker-sprite" alt="Pokémon caminhando" decoding="async" draggable="false" /><span class="shadow"></span></div>
          <div id="approaching-enemy" class="approaching-enemy" hidden><img id="approaching-enemy-sprite" alt="Pokémon se aproximando" decoding="async" draggable="false" /><span class="shadow"></span></div>
          <div id="capture-panel" class="capture-panel" hidden>
            <span id="shiny-label" class="shiny-label" hidden>✨ SHINY</span>
            <strong id="capture-title"></strong>
            <p>Escolha como tentar adicionar este Pokémon à sua equipe.</p>
            <div class="capture-time"><span id="capture-time-copy">Não capturar automaticamente em 5s</span><div class="capture-time-track"><i id="capture-time-bar"></i></div></div>
            <div id="capture-ball-options" class="capture-ball-options"></div>
            <div class="capture-decline-row"><button id="decline-capture" class="decline-button">Não capturar</button></div>
          </div>
        </section>

        <section class="dashboard-grid">
          <article class="partner-panel panel">
            <div class="section-title"><span>POKÉMON ATIVO</span><b id="level-chip"></b></div>
            <div class="partner-row"><img id="partner-sprite" alt="Pokémon parceiro" /><div class="partner-details"><h2 id="partner-name"></h2><div class="stat-line"><span>HP</span><span id="hp-copy"></span></div><div class="bar health"><i id="hp-bar"></i></div><div class="stat-line xp-copy"><span>XP</span><span id="xp-copy"></span></div><div class="bar xp"><i id="xp-bar"></i></div></div></div>
            <div id="team-mini" class="team-mini"></div>
          </article>

          <article class="panel activity-panel">
            <div class="section-title"><span>ATIVIDADE</span><b class="live-dot">AO VIVO</b></div>
            <ol id="activity-log" class="activity-log"></ol>
          </article>
        </section>

        <section class="stats-row">
          <div><small>ENCONTROS</small><strong id="encounters-stat">0</strong></div>
          <div><small>VITÓRIAS</small><strong id="wins-stat">0</strong></div>
        </section>
      </main>
      <footer><span id="save-status">● Progresso salvo</span><span>PROTÓTIPO v0.6.1</span></footer>
    </div>
    <dialog id="pokedex-dialog" class="pokedex-dialog">
      <div class="dialog-heading"><div><small>REGISTRO DA ROTA 1</small><h2>Pokédex</h2></div><button id="close-pokedex" class="icon-button" aria-label="Fechar Pokédex">×</button></div>
      <div class="pokedex-summary"><span id="seen-total">0 vistos</span><span id="caught-total">0 capturados</span></div>
      <div id="pokedex-grid" class="pokedex-grid"></div>
    </dialog>
    <dialog id="team-dialog" class="team-dialog">
      <div class="dialog-heading"><div><small>ORGANIZAÇÃO</small><h2>Equipe Pokémon</h2></div><button id="close-team" class="icon-button" aria-label="Fechar equipe">×</button></div>
      <p class="team-help">A ordem define quem entra primeiro nas batalhas. Sua equipe pode ter até ${MAX_TEAM_SIZE} Pokémon.</p>
      <h3>Equipe <span id="team-count"></span></h3>
      <div id="team-list" class="team-list"></div>
      <section class="storage-section">
        <h3>Depósito Pokémon <span id="storage-count"></span></h3>
        <p>Pokémon fora da equipe ficam guardados aqui e não recebem XP.</p>
        <div id="storage-list" class="storage-list"></div>
      </section>
    </dialog>`;
}

function megaEquipmentMarkup(state, pokemon, inStorage) {
  if (inStorage) return "";
  const owned = new Set(state.shop?.ownedMegaStones || []);
  const compatible = getMegaStonesForSpecies(pokemon.id).filter((stone) => owned.has(stone.id));
  if (!compatible.length) return "";

  const equippedStoneId = state.shop?.equippedMegaStoneId;
  const equippedPokemonUid = state.shop?.equippedMegaPokemonUid;
  return `<span class="mega-picker"><small>MEGA PEDRA</small>${compatible.map((stone) => {
    const selected = equippedStoneId === stone.id && equippedPokemonUid === pokemon.uid;
    return `<button class="mega-equip-button ${selected ? "selected" : ""}" data-equip-mega="${stone.id}" data-mega-pokemon="${pokemon.uid}">${selected ? "EQUIPADA" : stone.name}</button>`;
  }).join("")}</span>`;
}

function teamPokemonCard(state, pokemon, index, teamLength, inStorage = false, teamFull = false, activeIndex = 0) {
  const hpPercent = percent(pokemon.hp, pokemon.maxHp);
  const isActive = !inStorage && index === activeIndex;
  const isMegaEquipped = !inStorage && state.shop?.equippedMegaPokemonUid === pokemon.uid;
  const positionButtons = Array.from({ length: teamLength }, (_, position) => `<button class="position-button ${position === index ? "selected" : ""}" data-team-position="${pokemon.uid}" data-position="${position}" ${position === index ? "disabled" : ""}>${position + 1}</button>`).join("");
  return `<article class="team-card ${isActive ? "active-member" : ""}">
    <img src="${pokemon.sprite}" alt="${pokemon.name}" />
    <div class="team-card-info"><strong>${pokemon.isShiny ? "✨ " : ""}${pokemon.name}${isActive ? " · ATIVO" : ""}</strong><small>NV. ${pokemon.level} · ${pokemon.type}</small><div class="bar health"><i class="${healthClass(pokemon.hp, pokemon.maxHp)}" style="width:${hpPercent}%"></i></div><span>${pokemon.hp}/${pokemon.maxHp} HP · ${pokemon.xp}/${pokemon.xpToNext} XP</span>${isMegaEquipped ? `<span class="mega-ready-label">◇ MEGA EVOLUÇÃO EQUIPADA</span>` : ""}</div>
    <div class="team-card-actions">${inStorage
      ? `<button data-add-team="${pokemon.uid}" ${teamFull ? "disabled" : ""}>Adicionar</button>`
      : `<span class="position-picker"><small>Posição</small>${positionButtons}</span><button class="activate-button ${isActive ? "selected" : ""}" data-set-active="${pokemon.uid}" ${isActive || pokemon.hp <= 0 ? "disabled" : ""}>${isActive ? "Ativo" : "Ativar"}</button><button data-send-storage="${pokemon.uid}" ${teamLength === 1 ? "disabled" : ""}>Depósito</button>${megaEquipmentMarkup(state, pokemon, inStorage)}`}
    </div>
  </article>`;
}

export function renderTeam(state) {
  document.querySelector("#team-count").textContent = `${state.team.length}/${MAX_TEAM_SIZE}`;
  document.querySelector("#storage-count").textContent = state.storage.length;
  document.querySelector("#team-list").innerHTML = state.team.map((pokemon, index) => teamPokemonCard(state, pokemon, index, state.team.length, false, false, state.activeTeamIndex)).join("");
  document.querySelector("#storage-list").innerHTML = state.storage.length
    ? state.storage.map((pokemon, index) => teamPokemonCard(state, pokemon, index, state.storage.length, true, state.team.length >= MAX_TEAM_SIZE)).join("")
    : `<div class="empty-storage">O depósito está vazio. Capturas excedentes aparecerão aqui.</div>`;
}

export function renderPokedex(state) {
  let seenTotal = 0;
  let caughtTotal = 0;
  const html = POKEDEX_SPECIES.map((pokemon) => {
    const entry = state.pokedex[pokemon.id] || { seen: 0, caught: 0 };
    if (entry.seen) seenTotal += 1;
    if (entry.caught) caughtTotal += 1;
    const status = entry.caught ? "captured" : entry.seen ? "seen" : "unknown";
    const shinyCopy = entry.shinyCaught ? ` · ✨ ${entry.shinyCaught}` : "";
    const label = entry.caught ? `${entry.caught} capturado${entry.caught > 1 ? "s" : ""}${shinyCopy}` : entry.seen ? "Visto" : "Não encontrado";
    return `<article class="dex-card ${status}"><span class="dex-number">#${String(pokemon.id).padStart(3, "0")}</span><img src="${pokemon.sprite}" alt="${status === "unknown" ? "Pokémon desconhecido" : pokemon.name}" /><strong>${status === "unknown" ? "???" : pokemon.name}</strong><small>${label}</small></article>`;
  }).join("");
  document.querySelector("#pokedex-grid").innerHTML = html;
  document.querySelector("#seen-total").textContent = `${seenTotal} de ${POKEDEX_SPECIES.length} vistos`;
  document.querySelector("#caught-total").textContent = `${caughtTotal} espécies capturadas`;
}

export function render(state) {
  const player = getActivePokemon(state);
  const [modeLabel] = modeCopy[state.mode];
  const scene = document.querySelector("#scene");
  const modeChanged = updateSceneMode(scene, state.mode);
  document.querySelector("#mode-badge").textContent = modeLabel;
  document.querySelector("#area-name").textContent = state.area.name;

  const walker = document.querySelector("#walker");
  const approachingEnemy = document.querySelector("#approaching-enemy");
  const battleStage = document.querySelector("#battle-stage");
  const capturePanel = document.querySelector("#capture-panel");

  if (state.mode === "battle") {
    capturePanel.hidden = true;
    hideExplorationPokemon(walker);
    hideExplorationPokemon(approachingEnemy);
    const playerForm = String(player.megaFormId || player.id);
    if (modeChanged || battleStage.dataset.enemyId !== String(state.enemy.id) || battleStage.dataset.playerUid !== player.uid || battleStage.dataset.playerForm !== playerForm) {
      battleStage.innerHTML = `${pokemonCard(state.enemy, true)}${pokemonCard(player)}`;
      battleStage.dataset.enemyId = String(state.enemy.id);
      battleStage.dataset.playerUid = player.uid;
      battleStage.dataset.playerForm = playerForm;
    }
    updateBattleCard(battleStage.querySelector(".enemy-card"), state.enemy);
    updateBattleCard(battleStage.querySelector(".player-card"), player);
  } else if (state.mode === "capture") {
    hideExplorationPokemon(walker);
    hideExplorationPokemon(approachingEnemy);
    if (modeChanged || battleStage.dataset.enemyId !== String(state.enemy.id)) {
      battleStage.innerHTML = `<div class="capture-pokemon ${state.enemy.isShiny ? "shiny" : ""}"><img src="${state.enemy.sprite}" alt="${state.enemy.name}${state.enemy.isShiny ? " shiny" : ""}" /></div>`;
      battleStage.dataset.enemyId = String(state.enemy.id);
      delete battleStage.dataset.playerForm;
    }
    capturePanel.hidden = false;
    document.querySelector("#capture-title").textContent = `${state.enemy.name} foi derrotado!`;
    document.querySelector("#shiny-label").hidden = !state.enemy.isShiny;
    renderCaptureOptions(state);
    updateCaptureTimer(state);
  } else if (state.mode === "approach") {
    capturePanel.hidden = true;
    if (modeChanged) {
      battleStage.replaceChildren();
      delete battleStage.dataset.enemyId;
      delete battleStage.dataset.playerUid;
      delete battleStage.dataset.playerForm;
    }
    updateExplorationPokemon(walker, player, { facingLeft: true });
    updateExplorationPokemon(approachingEnemy, state.enemy);
  } else {
    capturePanel.hidden = true;
    hideExplorationPokemon(approachingEnemy);
    if (modeChanged) {
      battleStage.replaceChildren();
      delete battleStage.dataset.enemyId;
      delete battleStage.dataset.playerUid;
      delete battleStage.dataset.playerForm;
    }
    updateExplorationPokemon(walker, player, { facingLeft: true });
  }

  document.querySelector("#partner-sprite").src = player.sprite;
  document.querySelector("#partner-name").textContent = player.name;
  document.querySelector("#level-chip").textContent = `NV. ${player.level}`;
  document.querySelector("#hp-copy").textContent = `${player.hp} / ${player.maxHp}`;
  document.querySelector("#hp-bar").style.width = `${percent(player.hp, player.maxHp)}%`;
  document.querySelector("#hp-bar").className = healthClass(player.hp, player.maxHp);
  document.querySelector("#xp-copy").textContent = `${player.xp} / ${player.xpToNext}`;
  document.querySelector("#xp-bar").style.width = `${percent(player.xp, player.xpToNext)}%`;
  document.querySelector("#team-mini").innerHTML = state.team.map((pokemon, index) => `<span class="mini-member ${index === state.activeTeamIndex ? "active" : ""} ${pokemon.hp <= 0 ? "fainted" : ""} ${pokemon.isShiny ? "shiny" : ""}"><img src="${pokemon.sprite}" alt="${pokemon.name}" /><i></i></span>`).join("");
  document.querySelector("#encounters-stat").textContent = state.area.encounters;
  document.querySelector("#wins-stat").textContent = state.area.victories;
  document.querySelector("#activity-log").innerHTML = state.log.map((entry, index) => `<li class="${index === 0 ? "latest" : ""}"><i></i><span>${entry}</span></li>`).join("");
  document.querySelector("footer span:last-child").textContent = "PROTÓTIPO v0.6.1";
}
