import { MEGA_STONES } from "../data/mega-data.js";
import { BALL_DEFINITIONS, EXP_SHARE_UPGRADES, getExpShareMultiplier } from "../data/shop-data.js";
import {
  getVisibleMegaStones,
  isBallUnlocked,
  isExpShareUnlocked,
  isLegendaryMegaUnlocked,
  isMegaShopUnlocked
} from "../systems/shop.js";

function formatCoins(value) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("pt-BR");
}

function priceButton(label, price, disabled, dataAttribute, dataValue) {
  return `<button ${dataAttribute}="${dataValue}" ${disabled ? "disabled" : ""}><span>${label}</span><b>◉ ${formatCoins(price)}</b></button>`;
}

export function enhanceShopMarkup() {
  const headerActions = document.querySelector(".header-actions");
  if (headerActions && !document.querySelector("#shop-button")) {
    const teamButton = document.querySelector("#team-button");
    teamButton?.insertAdjacentHTML("beforebegin", `
      <div id="coin-balance" class="coin-balance" title="PokéCoins disponíveis"><span>◉</span><strong id="coin-count">0</strong></div>
      <button id="shop-button" class="shop-button">LOJA</button>
    `);
  }

  if (document.querySelector("#shop-dialog")) return;
  document.body.insertAdjacentHTML("beforeend", `
    <dialog id="shop-dialog" class="shop-dialog">
      <div class="dialog-heading shop-heading">
        <div><small>CENTRO COMERCIAL DA JORNADA</small><h2>Loja Pokémon</h2></div>
        <button id="close-shop" class="icon-button" aria-label="Fechar loja">×</button>
      </div>
      <div class="shop-wallet">
        <span>SEU SALDO</span>
        <strong><i>◉</i> <b id="shop-coin-count">0</b> PokéCoins</strong>
        <small>Ganhe moedas vencendo Pokémon, minibosses, bosses e concluindo rotas pela primeira vez.</small>
      </div>
      <nav class="shop-tabs" aria-label="Categorias da loja">
        <button class="selected" data-shop-tab="balls">POKÉ BOLAS</button>
        <button data-shop-tab="training">TREINAMENTO</button>
        <button data-shop-tab="mega">MEGA PEDRAS</button>
      </nav>
      <section class="shop-panel" data-shop-panel="balls">
        <div class="shop-panel-heading"><div><small>CAPTURA</small><h3>Poké Bolas</h3></div><p>As bolas são consumidas ao tentar uma captura. A tentativa normal continua gratuita.</p></div>
        <div id="shop-ball-grid" class="shop-grid"></div>
      </section>
      <section class="shop-panel" data-shop-panel="training" hidden>
        <div class="shop-panel-heading"><div><small>PROGRESSÃO PERMANENTE</small><h3>Exp. Share</h3></div><p>Aumenta o XP recebido por membros conscientes da equipe que não participaram da batalha.</p></div>
        <div id="shop-exp-grid" class="shop-grid"></div>
      </section>
      <section class="shop-panel" data-shop-panel="mega" hidden>
        <div class="shop-panel-heading"><div><small>PODER DE BATALHA</small><h3>Mega Pedras</h3></div><p>Desbloqueios permanentes. Equipe uma pedra na tela da equipe; somente um Pokémon pode Mega Evoluir por vez.</p></div>
        <div id="shop-mega-grid" class="shop-grid mega-shop-grid"></div>
      </section>
    </dialog>
  `);
}

export function selectShopTab(tabId) {
  const selected = ["balls", "training", "mega"].includes(tabId) ? tabId : "balls";
  document.querySelectorAll("[data-shop-tab]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.shopTab === selected);
  });
  document.querySelectorAll("[data-shop-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.shopPanel !== selected;
  });
}

function renderBallShop(state) {
  const root = document.querySelector("#shop-ball-grid");
  if (!root) return;
  const coins = Number(state.shop?.coins) || 0;

  root.innerHTML = BALL_DEFINITIONS.map((ball) => {
    const stock = Math.max(0, Number(state.shop?.balls?.[ball.id]) || 0);
    const unlocked = isBallUnlocked(state, ball.id);
    const comingSoon = ball.available === false;
    const maxed = Boolean(ball.maxStock && stock >= ball.maxStock);
    const disabled = comingSoon || !unlocked || maxed || coins < ball.price;
    const effect = ball.guaranteed ? "Captura garantida" : `+${ball.bonus} pontos de chance`;
    const status = comingSoon
      ? "EM BREVE"
      : maxed
        ? "LIMITE NO INVENTÁRIO"
        : unlocked
          ? `NO INVENTÁRIO: ${stock}`
          : "BLOQUEADA";

    return `<article class="shop-item ${unlocked && !comingSoon ? "unlocked" : "locked"}">
      <span class="shop-item-icon ball-icon ${ball.id}">◓</span>
      <div class="shop-item-copy"><small>${status}</small><h4>${ball.name}</h4><p>${effect}. Chance máxima de 95%, exceto captura garantida.</p><em>${ball.unlockLabel}</em></div>
      ${comingSoon
        ? `<button disabled><span>ATUALIZAÇÃO FUTURA</span><b>—</b></button>`
        : priceButton(maxed ? "LIMITE ATINGIDO" : "COMPRAR", ball.price, disabled, "data-buy-ball", ball.id)}
    </article>`;
  }).join("");
}

function renderExpShareShop(state) {
  const root = document.querySelector("#shop-exp-grid");
  if (!root) return;
  const coins = Number(state.shop?.coins) || 0;
  const currentLevel = Math.max(0, Number(state.shop?.expShareLevel) || 0);

  root.innerHTML = EXP_SHARE_UPGRADES.map((upgrade) => {
    const purchased = currentLevel >= upgrade.level;
    const next = upgrade.level === currentLevel + 1;
    const unlocked = isExpShareUnlocked(state, upgrade.level);
    const disabled = purchased || !next || !unlocked || coins < upgrade.price;
    const status = purchased ? "COMPRADO" : unlocked ? (next ? "DISPONÍVEL" : "COMPRE O NÍVEL ANTERIOR") : "BLOQUEADO";

    return `<article class="shop-item ${unlocked ? "unlocked" : "locked"} ${purchased ? "purchased" : ""}">
      <span class="shop-item-icon exp-icon">XP</span>
      <div class="shop-item-copy"><small>${status}</small><h4>${upgrade.name}</h4><p>Pokémon que não lutaram recebem ${Math.round(upgrade.multiplier * 100)}% do XP da batalha.</p><em>${upgrade.unlockLabel}</em></div>
      ${purchased
        ? `<button disabled><span>ADQUIRIDO</span><b>✓</b></button>`
        : priceButton("MELHORAR", upgrade.price, disabled, "data-buy-exp-share", upgrade.level)}
    </article>`;
  }).join("") + `<div class="shop-current-bonus">Bônus passivo atual: <strong>${Math.round(getExpShareMultiplier(currentLevel) * 100)}% do XP</strong></div>`;
}

function renderMegaShop(state) {
  const root = document.querySelector("#shop-mega-grid");
  if (!root) return;

  if (!isMegaShopUnlocked(state)) {
    root.innerHTML = `<div class="shop-empty"><span>◇</span><strong>Mega Pedras ainda bloqueadas</strong><p>Chegue ao Planalto Índigo para liberar esta categoria.</p></div>`;
    return;
  }

  const visible = getVisibleMegaStones(state);
  if (!visible.length) {
    root.innerHTML = `<div class="shop-empty"><span>◇</span><strong>Nenhuma Mega Pedra descoberta</strong><p>Capture ou evolua um Pokémon que possua Mega Evolução. A pedra correspondente aparecerá aqui.</p></div>`;
    return;
  }

  const coins = Number(state.shop?.coins) || 0;
  const owned = new Set(state.shop?.ownedMegaStones || []);
  root.innerHTML = visible.map((stone) => {
    const purchased = owned.has(stone.id);
    const legendaryLocked = stone.legendary && !isLegendaryMegaUnlocked(state);
    const disabled = purchased || legendaryLocked || coins < stone.price;
    const status = purchased ? "COMPRADA" : legendaryLocked ? "LIBERA NA ELITE 4" : "DISPONÍVEL";

    return `<article class="shop-item mega-item ${purchased ? "purchased" : ""} ${legendaryLocked ? "locked" : "unlocked"}">
      <span class="shop-item-icon mega-icon">◇</span>
      <div class="shop-item-copy"><small>${status}</small><h4>${stone.name}</h4><p>${stone.baseName} poderá se transformar em ${stone.megaName} durante as batalhas.</p><em>${stone.legendary ? "Mega Pedra lendária" : "Desbloqueio permanente"}</em></div>
      ${purchased
        ? `<button disabled><span>ADQUIRIDA</span><b>✓</b></button>`
        : priceButton("COMPRAR", stone.price, disabled, "data-buy-mega-stone", stone.id)}
    </article>`;
  }).join("");
}

export function renderShopHud(state) {
  const coins = formatCoins(state.shop?.coins);
  const coinCount = document.querySelector("#coin-count");
  const shopCoinCount = document.querySelector("#shop-coin-count");
  const shopButton = document.querySelector("#shop-button");
  if (coinCount) coinCount.textContent = coins;
  if (shopCoinCount) shopCoinCount.textContent = coins;
  if (shopButton) {
    shopButton.disabled = !state.hasStarted || state.mode !== "exploring" || Boolean(state.pendingEvolutionChoices?.length);
    shopButton.title = shopButton.disabled ? "Disponível enquanto a equipe estiver explorando" : "Abrir Loja Pokémon";
  }
}

export function renderShop(state) {
  renderShopHud(state);
  renderBallShop(state);
  renderExpShareShop(state);
  renderMegaShop(state);
}

export function getMegaCatalogSize() {
  return MEGA_STONES.length;
}
