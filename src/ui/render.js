const modeCopy = {
  exploring: ["EXPLORANDO", "Próximo encontro"],
  battle: ["BATALHA AUTOMÁTICA", "Batalha em andamento"],
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

export function createAppMarkup() {
  return `
    <div class="app-shell">
      <header class="topbar">
        <div class="brand"><span class="brand-mark">◆</span><div><strong>IDLE JORNEYMON</strong><small>Uma jornada automática</small></div></div>
        <button id="reset-button" class="icon-button" aria-label="Reiniciar progresso" title="Reiniciar progresso">↻</button>
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
        </section>

        <section class="progress-panel">
          <div class="progress-copy"><strong id="progress-title"></strong><span id="progress-value"></span></div>
          <div class="bar journey"><i id="journey-bar"></i></div>
        </section>

        <section class="dashboard-grid">
          <article class="partner-panel panel">
            <div class="section-title"><span>SEU PARCEIRO</span><b id="level-chip"></b></div>
            <div class="partner-row"><img id="partner-sprite" alt="Pokémon parceiro" /><div class="partner-details"><h2 id="partner-name"></h2><div class="stat-line"><span>HP</span><span id="hp-copy"></span></div><div class="bar health"><i id="hp-bar"></i></div><div class="stat-line xp-copy"><span>XP</span><span id="xp-copy"></span></div><div class="bar xp"><i id="xp-bar"></i></div></div></div>
          </article>

          <article class="panel activity-panel">
            <div class="section-title"><span>ATIVIDADE</span><b class="live-dot">AO VIVO</b></div>
            <ol id="activity-log" class="activity-log"></ol>
          </article>
        </section>

        <section class="stats-row">
          <div><small>PASSOS</small><strong id="steps-stat">0</strong></div>
          <div><small>ENCONTROS</small><strong id="encounters-stat">0</strong></div>
          <div><small>VITÓRIAS</small><strong id="wins-stat">0</strong></div>
        </section>
      </main>
      <footer><span id="save-status">● Progresso salvo</span><span>PROTÓTIPO v0.1.0</span></footer>
    </div>`;
}

export function render(state) {
  const [modeLabel, progressTitle] = modeCopy[state.mode];
  const scene = document.querySelector("#scene");
  scene.className = `scene ${state.mode}`;
  document.querySelector("#mode-badge").textContent = modeLabel;
  document.querySelector("#area-name").textContent = state.area.name;
  document.querySelector("#progress-title").textContent = progressTitle;

  let progress = percent(state.exploration, state.nextEncounterAt);
  if (state.mode === "battle") progress = state.enemy ? percent(state.enemy.maxHp - state.enemy.hp, state.enemy.maxHp) : 0;
  if (state.mode === "recovering") progress = percent(5 - state.recoveryCooldown, 5);
  document.querySelector("#progress-value").textContent = `${Math.round(progress)}%`;
  document.querySelector("#journey-bar").style.width = `${progress}%`;

  const walker = document.querySelector("#walker");
  const battleStage = document.querySelector("#battle-stage");
  if (state.mode === "battle") {
    walker.innerHTML = "";
    battleStage.innerHTML = `${pokemonCard(state.enemy, true)}${pokemonCard(state.player)}`;
  } else {
    battleStage.innerHTML = "";
    walker.innerHTML = `<img src="${state.player.sprite}" alt="${state.player.name} caminhando" /><span class="shadow"></span>`;
  }

  document.querySelector("#partner-sprite").src = state.player.sprite;
  document.querySelector("#partner-name").textContent = state.player.name;
  document.querySelector("#level-chip").textContent = `NV. ${state.player.level}`;
  document.querySelector("#hp-copy").textContent = `${state.player.hp} / ${state.player.maxHp}`;
  document.querySelector("#hp-bar").style.width = `${percent(state.player.hp, state.player.maxHp)}%`;
  document.querySelector("#hp-bar").className = healthClass(state.player.hp, state.player.maxHp);
  document.querySelector("#xp-copy").textContent = `${state.player.xp} / ${state.player.xpToNext}`;
  document.querySelector("#xp-bar").style.width = `${percent(state.player.xp, state.player.xpToNext)}%`;
  document.querySelector("#steps-stat").textContent = state.totalSteps.toLocaleString("pt-BR");
  document.querySelector("#encounters-stat").textContent = state.area.encounters;
  document.querySelector("#wins-stat").textContent = state.area.victories;
  document.querySelector("#activity-log").innerHTML = state.log.map((entry, index) => `<li class="${index === 0 ? "latest" : ""}"><i></i><span>${entry}</span></li>`).join("");
}
