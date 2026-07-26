(() => {
  "use strict";

  const SAVE_KEY = "idle-jorneymon-save";
  const FEEDBACK_KEY = "idleJorneymonHardShopPurchaseFeedback";
  const PRICES = Object.freeze({
    goldBottleCap: 120,
    shinyIncense: 100,
    championFrame: 75
  });
  const INCENSE_ENCOUNTERS = 100;
  const ITEM_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";
  let renderScheduled = false;

  function readSave() {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(SAVE_KEY) || "null");
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeSave(save, message) {
    save.lastSavedAt = Date.now();
    save.hardEndgame = save.hardEndgame && typeof save.hardEndgame === "object" ? save.hardEndgame : {};
    save.log = Array.isArray(save.log) ? save.log : [];
    if (message) save.log = [message, ...save.log].slice(0, 7);
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }

  function refreshCurrentSave() {
    try {
      window.dispatchEvent(new Event("beforeunload"));
    } catch {
      // A cópia já persistida continua sendo usada quando o navegador bloqueia o evento sintético.
    }
    return readSave();
  }

  function emblems(save) {
    return Math.max(0, Math.floor(Number(save?.hardEndgame?.emblems) || 0));
  }

  function spend(save, amount) {
    const price = Math.max(0, Math.floor(Number(amount) || 0));
    if (emblems(save) < price) return false;
    save.hardEndgame.emblems = emblems(save) - price;
    save.hardEndgame.totalEmblemsSpent = Math.max(0, Math.floor(Number(save.hardEndgame.totalEmblemsSpent) || 0)) + price;
    return true;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function purchaseAndReload(save, message, feedback) {
    writeSave(save, message);
    const preservedSave = JSON.stringify(save);
    window.addEventListener("beforeunload", () => {
      try {
        window.localStorage.setItem(SAVE_KEY, preservedSave);
      } catch {
        // A gravação principal já foi concluída antes da atualização da página.
      }
    }, { once: true });
    try {
      window.sessionStorage.setItem(FEEDBACK_KEY, feedback);
    } catch {
      // O alerta abaixo ainda confirma a compra quando o sessionStorage estiver indisponível.
    }
    window.alert(feedback);
    window.location.reload();
  }

  function purchaseGoldBottleCap(button) {
    const save = refreshCurrentSave();
    if (!save?.hardModeUnlocked) return window.alert("A Loja Hard ainda não está liberada neste save.");
    const selector = button.closest(".hard-shop-card")?.querySelector("[data-hard-gold-cap-target]");
    const pokemonUid = String(selector?.value || "");
    const pokemon = (save.team || []).find((member) => String(member.uid) === pokemonUid);
    if (!pokemon) return window.alert("Escolha um Pokémon da equipe para receber a Cápsula Dourada.");
    if (Math.max(0, Number(pokemon.iv) || 0) >= 31) return window.alert(`${pokemon.name} já possui IV 31, o máximo possível.`);
    if (emblems(save) < PRICES.goldBottleCap) return window.alert(`São necessários ${PRICES.goldBottleCap} Emblemas Hard.`);

    const confirmed = window.confirm(
      `Usar uma Cápsula Dourada em ${pokemon.name}?\n\n` +
      "Somente este Pokémon terá o IV alterado permanentemente para 31. " +
      "Nível, XP, shiny, golpes, Mega Evolução e itens equipados serão preservados."
    );
    if (!confirmed) return;
    if (!spend(save, PRICES.goldBottleCap)) return;

    pokemon.iv = 31;
    purchaseAndReload(
      save,
      `Cápsula Dourada usada em ${pokemon.name}. O IV desse Pokémon agora é 31.`,
      `Cápsula Dourada aplicada em ${pokemon.name}. O IV agora é 31 e os atributos foram recalculados.`
    );
  }

  function purchaseShinyIncense() {
    const save = refreshCurrentSave();
    if (!save?.hardModeUnlocked) return window.alert("A Loja Hard ainda não está liberada neste save.");
    if (emblems(save) < PRICES.shinyIncense) return window.alert(`São necessários ${PRICES.shinyIncense} Emblemas Hard.`);
    const previous = Math.max(0, Math.floor(Number(save.hardEndgame?.shinyIncenseEncountersRemaining) || 0));
    const confirmed = window.confirm(
      `${previous > 0 ? `O Incenso atual ainda possui ${previous} encontros. A nova compra substituirá esse contador por 100; os valores não se acumulam.\n\n` : ""}` +
      "Ativar o Incenso Shiny Hard?\n\n" +
      "A chance shiny será 1/64 nos próximos 100 encontros selvagens normais do Modo Hard. " +
      "Bosses, Modo Normal, Zona Safari, Salão dos Campeões e Desafios Hard não consomem o contador e não recebem esse bônus."
    );
    if (!confirmed) return;
    if (!spend(save, PRICES.shinyIncense)) return;

    save.hardEndgame.shinyIncenseEncountersRemaining = INCENSE_ENCOUNTERS;
    purchaseAndReload(
      save,
      "Incenso Shiny Hard ativado: chance 1/64 durante os próximos 100 encontros normais do Modo Hard.",
      "Incenso Shiny Hard ativado. Restam 100 encontros normais com chance shiny de 1/64."
    );
  }

  function purchaseChampionFrame() {
    const save = refreshCurrentSave();
    if (!save?.hardModeUnlocked) return window.alert("A Loja Hard ainda não está liberada neste save.");
    if (save.hardEndgame?.championFrameOwned) return window.alert("A Moldura do Campeão já foi adquirida.");
    if (emblems(save) < PRICES.championFrame) return window.alert(`São necessários ${PRICES.championFrame} Emblemas Hard.`);
    const confirmed = window.confirm(
      "Comprar a Moldura do Campeão?\n\n" +
      "É uma recompensa cosmética permanente: adiciona moldura dourada ao Pokémon ativo, " +
      "o título CAMPEÃO HARD e um símbolo de campeão. Não altera atributos ou chances."
    );
    if (!confirmed) return;
    if (!spend(save, PRICES.championFrame)) return;

    save.hardEndgame.championFrameOwned = true;
    purchaseAndReload(
      save,
      "Moldura do Campeão adquirida e equipada no perfil da jornada.",
      "Moldura do Campeão adquirida. O visual CAMPEÃO HARD foi equipado permanentemente."
    );
  }

  function teamOptions(save) {
    const team = Array.isArray(save?.team) ? save.team : [];
    const eligible = team.filter((pokemon) => Math.max(0, Number(pokemon.iv) || 0) < 31);
    if (!eligible.length) return '<option value="">Toda a equipe já possui IV 31</option>';
    return [
      '<option value="">Escolha o Pokémon</option>',
      ...eligible.map((pokemon) => `<option value="${escapeHtml(pokemon.uid)}">${escapeHtml(pokemon.name)} · IV ${Math.max(0, Number(pokemon.iv) || 0)}</option>`)
    ].join("");
  }

  function customCards(save) {
    const remaining = Math.max(0, Math.floor(Number(save?.hardEndgame?.shinyIncenseEncountersRemaining) || 0));
    const frameOwned = Boolean(save?.hardEndgame?.championFrameOwned);
    const available = emblems(save);
    return `
      <article id="hard-gold-bottle-cap-card" class="hard-shop-card hard-expanded-card">
        <span class="hard-item-sprite"><img src="${ITEM_SPRITE_BASE}/gold-bottle-cap.png" alt="Cápsula Dourada" loading="lazy" decoding="async" /></span>
        <small>CONSUMÍVEL · UM POKÉMON POR COMPRA</small>
        <h3>Cápsula Dourada</h3>
        <p><strong>Escolha um Pokémon da equipe.</strong> Esta compra transforma permanentemente o IV somente do Pokémon escolhido em <b>31, o máximo</b>. Não muda nível, XP, shiny, golpes, forma, Mega Evolução ou itens equipados. Pokémon que já possuem IV 31 não podem receber outra cápsula.</p>
        <label class="hard-item-selector"><span>POKÉMON QUE RECEBERÁ O IV 31</span><select data-hard-gold-cap-target>${teamOptions(save)}</select></label>
        <button data-hard-expansion-buy="gold-bottle-cap" ${available < PRICES.goldBottleCap ? "disabled" : ""}>USAR EM UM POKÉMON · ◆ ${PRICES.goldBottleCap}</button>
      </article>
      <article id="hard-shiny-incense-card" class="hard-shop-card hard-expanded-card ${remaining > 0 ? "purchased active-consumable" : ""}">
        <span class="hard-item-sprite"><img src="${ITEM_SPRITE_BASE}/luck-incense.png" alt="Incenso Shiny Hard" loading="lazy" decoding="async" /></span>
        <small>${remaining > 0 ? `ATIVO · ${remaining} ENCONTROS RESTANTES` : "CONSUMÍVEL · NÃO ACUMULA"}</small>
        <h3>Incenso Shiny Hard</h3>
        <p><strong>Chance shiny de 1/64 durante 100 encontros selvagens normais do Modo Hard.</strong> O contador diminui somente nesses encontros. Bosses, Modo Normal, Zona Safari, Salão dos Campeões e Desafios Hard não usam o bônus e não gastam encontros. Comprar novamente renova para 100, sem somar ao contador atual.</p>
        <button data-hard-expansion-buy="shiny-incense" ${available < PRICES.shinyIncense ? "disabled" : ""}>${remaining > 0 ? "RENOVAR PARA 100" : "ATIVAR 100 ENCONTROS"} · ◆ ${PRICES.shinyIncense}</button>
      </article>
      <article id="hard-champion-frame-card" class="hard-shop-card hard-expanded-card ${frameOwned ? "purchased" : ""}">
        <span class="hard-item-sprite"><img src="${ITEM_SPRITE_BASE}/contest-pass.png" alt="Moldura do Campeão" loading="lazy" decoding="async" /></span>
        <small>${frameOwned ? "EQUIPADA PERMANENTEMENTE" : "RECOMPENSA COSMÉTICA"}</small>
        <h3>Moldura do Campeão</h3>
        <p>Adiciona permanentemente uma moldura dourada ao Pokémon ativo, o título <strong>CAMPEÃO HARD</strong> e um símbolo de campeão próximo ao nome. É somente visual e não altera atributos, XP ou chances.</p>
        <button data-hard-expansion-buy="champion-frame" ${frameOwned || available < PRICES.championFrame ? "disabled" : ""}>${frameOwned ? "ADQUIRIDA" : `COMPRAR · ◆ ${PRICES.championFrame}`}</button>
      </article>`;
  }

  function decorateChampionBadge(save) {
    const button = document.querySelector('[data-buy-hard-item="hard-champion-badge"]');
    const card = button?.closest(".hard-shop-card");
    if (!card) return;
    card.classList.add("hard-champion-medal-card");
    const image = card.querySelector(".hard-item-sprite img");
    if (image && !image.src.includes("hard-champion-medal.svg")) {
      image.src = "/assets/hard-champion-medal.svg?v=20260726-1";
      image.alt = "Medalha da Insígnia do Campeão Hard";
      image.removeAttribute("data-fallback-src");
    }
    const description = card.querySelector("p");
    if (description && description.dataset.hardChampionXpCopy !== "1") {
      description.innerHTML = "Medalha permanente que funciona como <strong>Amuleto de Experiência Hard</strong>: concede <b>+10% de XP</b> nas rotas do Modo Hard e nos Desafios Hard. Não aumenta o XP no Modo Normal, Zona Safari ou Salão dos Campeões.";
      description.dataset.hardChampionXpCopy = "1";
    }
    const status = card.querySelector("small");
    if (status && save?.hardEndgame?.championBadgeOwned && status.textContent !== "ATIVA · +10% XP NO HARD") {
      status.textContent = "ATIVA · +10% XP NO HARD";
    }
  }

  function renderHardShopExpansion() {
    const grid = document.querySelector("#hard-shop-grid");
    if (!grid) return;
    const save = readSave();
    if (!save) return;
    decorateChampionBadge(save);
    if (!grid.querySelector("#hard-gold-bottle-cap-card")) grid.insertAdjacentHTML("beforeend", customCards(save));
  }

  function applyChampionFrame() {
    const save = readSave();
    const owned = Boolean(save?.hardEndgame?.championFrameOwned);
    document.body.classList.toggle("hard-champion-frame-owned", owned);
    const partnerPanel = document.querySelector(".partner-panel");
    const partnerRow = document.querySelector(".partner-row");
    partnerPanel?.classList.toggle("hard-champion-frame", owned);
    partnerRow?.classList.toggle("hard-champion-frame-inner", owned);
    document.querySelectorAll("#battle-stage .player-card").forEach((card) => card.classList.toggle("hard-champion-frame-battle", owned));

    const partnerDetails = document.querySelector(".partner-details");
    let title = document.querySelector("#hard-champion-title");
    if (!owned) {
      title?.remove();
      return;
    }
    if (!title && partnerDetails) {
      title = document.createElement("span");
      title.id = "hard-champion-title";
      title.className = "hard-champion-title";
      title.innerHTML = '<img src="/assets/hard-champion-medal.svg?v=20260726-1" alt="" aria-hidden="true" /> CAMPEÃO HARD';
      partnerDetails.insertBefore(title, partnerDetails.firstChild);
    }
  }

  function showPendingFeedback() {
    try {
      const feedback = window.sessionStorage.getItem(FEEDBACK_KEY);
      if (!feedback) return;
      window.sessionStorage.removeItem(FEEDBACK_KEY);
      window.setTimeout(() => {
        const box = document.querySelector("#hard-shop-feedback");
        if (box) {
          box.textContent = feedback;
          box.hidden = false;
        }
      }, 500);
    } catch {
      // A confirmação já foi exibida no momento da compra.
    }
  }

  function scheduleRender() {
    if (renderScheduled) return;
    renderScheduled = true;
    window.requestAnimationFrame(() => {
      renderScheduled = false;
      renderHardShopExpansion();
      applyChampionFrame();
    });
  }

  function install() {
    document.addEventListener("click", (event) => {
      const button = event.target.closest?.("[data-hard-expansion-buy]");
      if (!button || button.disabled) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      const action = button.dataset.hardExpansionBuy;
      if (action === "gold-bottle-cap") purchaseGoldBottleCap(button);
      if (action === "shiny-incense") purchaseShinyIncense();
      if (action === "champion-frame") purchaseChampionFrame();
    }, true);

    new MutationObserver(scheduleRender).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "hidden", "open"]
    });
    window.addEventListener("storage", scheduleRender);
    window.addEventListener("pageshow", scheduleRender);
    showPendingFeedback();
    scheduleRender();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
