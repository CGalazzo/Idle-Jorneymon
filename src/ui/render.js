import { POKEDEX_SPECIES, STARTERS } from "../data/pokemon.js";
import { getActivePokemon, MAX_TEAM_SIZE } from "../core/game-state.js";

const modeCopy = {
  exploring: ["EXPLORANDO", "Próximo encontro"],
  approach: ["ENCONTRO!", "Pokémon se aproximando"],
  battle: ["BATALHA AUTOMÁTICA", "Batalha em andamento"],
  capture: ["DECISÃO DE CAPTURA", "Pokémon derrotado"],
  recovering: ["RECUPERANDO", "Retornando à jornada"]
};

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

function ensureWalker(walker, pokemon) {
  if (walker.dataset.pokemonUid === pokemon.uid && walker.querySelector("img")) return;
  walker.innerHTML = `<img src="${pokemon.sprite}" alt="${pokemon.name} caminhando" /><span class="shadow"></span>`;
  walker.dataset.pokemonUid = pokemon.uid;
}

function clearWalker(walker) {
  if (!walker.childElementCount) return;
  walker.replaceChildren();
  delete walker.dataset.pokemonUid;
}

function updateBattleCard(card, pokemon) {
  if (!card || !pokemon) return;
  const hpBar = card.querySelector(".bar.health i");
  hpBar.style.width = `${percent(pokemon.hp, pokemon.maxHp)}%`;
  hpBar.className = healthClass(pokemon.hp, pokemon.maxHp);
  card.querySelector(".pokemon-info small").textContent = `${pokemon.hp} / ${pokemon.maxHp} HP`;
  card.querySelector(".name-line span").textContent = `NV. ${pokemon.level}`;
}

export function createAppMarkup() {
  return `
    <section id="welcome-screen" class="welcome-screen">
      <div class="welcome-card">
        <div class="welcome-logo"><span>◆</span></div>
        <small>UMA NOVA AVENTURA</small>
        <h1>IDLE JORNEYMON</h1>
        <p>Escolha seu parceiro e acompanhe uma jornada que continua automaticamente.</p>
        <div id="welcome-actions" class="welcome-actions">
          <button id="new-journey-button" class="primary-button">Nova jornada</button>
          <button id="continue-button" class="secondary-button">Continuar</button>
        </div>
        <div id="starter-selection" class="starter-selection" hidden>
          <button id="back-to-welcome" class="text-button">← Voltar</button>
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
          <div id="walker" class="walker"></div>
          <div id="capture-panel" class="capture-panel" hidden>
            <span id="shiny-label" class="shiny-label" hidden>✨ SHINY</span>
            <strong id="capture-title"></strong>
            <p>Deseja tentar adicionar este Pokémon à sua equipe?</p>
            <div><button id="try-capture" class="capture-button"></button><button id="decline-capture" class="decline-button">Não capturar</button></div>
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
      <footer><span id="save-status">● Progresso salvo</span><span>PROTÓTIPO v0.2.0</span></footer>
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

function teamPokemonCard(pokemon, index, teamLength, inStorage = false, teamFull = false, activeIndex = 0) {
  const hpPercent = percent(pokemon.hp, pokemon.maxHp);
  const isActive = !inStorage && index === activeIndex;
  const positionButtons = Array.from({ length: teamLength }, (_, position) => `<button class="position-button ${position === index ? "selected" : ""}" data-team-position="${pokemon.uid}" data-position="${position}" ${position === index ? "disabled" : ""}>${position + 1}</button>`).join("");
  return `<article class="team-card ${isActive ? "active-member" : ""}">
    <img src="${pokemon.sprite}" alt="${pokemon.name}" />
    <div class="team-card-info"><strong>${pokemon.isShiny ? "✨ " : ""}${pokemon.name}${isActive ? " · ATIVO" : ""}</strong><small>NV. ${pokemon.level} · ${pokemon.type}</small><div class="bar health"><i class="${healthClass(pokemon.hp, pokemon.maxHp)}" style="width:${hpPercent}%"></i></div><span>${pokemon.hp}/${pokemon.maxHp} HP · ${pokemon.xp}/${pokemon.xpToNext} XP</span></div>
    <div class="team-card-actions">${inStorage
      ? `<button data-add-team="${pokemon.uid}" ${teamFull ? "disabled" : ""}>Adicionar</button>`
      : `<span class="position-picker"><small>Posição</small>${positionButtons}</span><button class="activate-button ${isActive ? "selected" : ""}" data-set-active="${pokemon.uid}" ${isActive || pokemon.hp <= 0 ? "disabled" : ""}>${isActive ? "Ativo" : "Ativar"}</button><button data-send-storage="${pokemon.uid}" ${teamLength === 1 ? "disabled" : ""}>Depósito</button>`}
    </div>
  </article>`;
}

export function renderTeam(state) {
  document.querySelector("#team-count").textContent = `${state.team.length}/${MAX_TEAM_SIZE}`;
  document.querySelector("#storage-count").textContent = state.storage.length;
  document.querySelector("#team-list").innerHTML = state.team.map((pokemon, index) => teamPokemonCard(pokemon, index, state.team.length, false, false, state.activeTeamIndex)).join("");
  document.querySelector("#storage-list").innerHTML = state.storage.length
    ? state.storage.map((pokemon, index) => teamPokemonCard(pokemon, index, state.storage.length, true, state.team.length >= MAX_TEAM_SIZE)).join("")
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
  const modeChanged = scene.dataset.renderMode !== state.mode;
  scene.className = `scene ${state.mode}`;
  scene.dataset.renderMode = state.mode;
  document.querySelector("#mode-badge").textContent = modeLabel;
  document.querySelector("#area-name").textContent = state.area.name;

  const walker = document.querySelector("#walker");
  const battleStage = document.querySelector("#battle-stage");
  const capturePanel = document.querySelector("#capture-panel");
  if (state.mode === "battle") {
    capturePanel.hidden = true;
    clearWalker(walker);
    if (modeChanged || battleStage.dataset.enemyId !== String(state.enemy.id) || battleStage.dataset.playerUid !== player.uid) {
      battleStage.innerHTML = `${pokemonCard(state.enemy, true)}${pokemonCard(player)}`;
      battleStage.dataset.enemyId = String(state.enemy.id);
      battleStage.dataset.playerUid = player.uid;
    }
    updateBattleCard(battleStage.querySelector(".enemy-card"), state.enemy);
    updateBattleCard(battleStage.querySelector(".player-card"), player);
  } else if (state.mode === "capture") {
    clearWalker(walker);
    if (modeChanged) battleStage.innerHTML = `<div class="capture-pokemon ${state.enemy.isShiny ? "shiny" : ""}"><img src="${state.enemy.sprite}" alt="${state.enemy.name}${state.enemy.isShiny ? " shiny" : ""}" /></div>`;
    capturePanel.hidden = false;
    document.querySelector("#capture-title").textContent = `${state.enemy.name} foi derrotado!`;
    document.querySelector("#try-capture").textContent = `Tentar capturar — ${state.captureOffer.chance}% de chance`;
    document.querySelector("#shiny-label").hidden = !state.enemy.isShiny;
  } else if (state.mode === "approach") {
    capturePanel.hidden = true;
    ensureWalker(walker, player);
    if (modeChanged || battleStage.dataset.enemyId !== String(state.enemy.id)) {
      battleStage.innerHTML = `<div class="approaching-enemy ${state.enemy.isShiny ? "shiny" : ""}"><img src="${state.enemy.sprite}" alt="${state.enemy.name} se aproximando" /><span class="shadow"></span></div>`;
      battleStage.dataset.enemyId = String(state.enemy.id);
    }
    const approachingEnemy = battleStage.querySelector(".approaching-enemy");
    approachingEnemy.style.left = `${88 - state.approachProgress * 42}%`;
  } else {
    capturePanel.hidden = true;
    if (modeChanged) {
      battleStage.replaceChildren();
      delete battleStage.dataset.enemyId;
      delete battleStage.dataset.playerUid;
    }
    ensureWalker(walker, player);
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
  document.querySelector("footer span:last-child").textContent = "PROTÓTIPO v0.3.2";
  renderPokedex(state);
  renderTeam(state);
}
