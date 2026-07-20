import "../styles/shop-repair.css";
import "../styles/item-sprites.css";
import { MEGA_STONES } from "../data/mega-data.js";
import { BALL_DEFINITIONS, EXP_SHARE_UPGRADES, getExpShareMultiplier } from "../data/shop-data.js";
import {
  getVisibleMegaStones,
  isBallUnlocked,
  isExpShareUnlocked,
  isLegendaryMegaUnlocked,
  isMegaShopUnlocked
} from "../systems/shop.js";

const ITEM_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";
const GENERIC_MEGA_STONE_ID = "mega-stone";
let selectedMegaStoneId = null;
let megaSelectionListenersInstalled = false;

function formatCoins(value) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("pt-BR");
}

function itemSpriteUrl(itemId) {
  return `${ITEM_SPRITE_BASE}/${itemId}.png`;
}

function itemSprite(itemId, alt, fallbackId = "poke-ball") {
  return `<img class="item-sprite" src="${itemSpriteUrl(itemId)}" data-fallback-src="${itemSpriteUrl(fallbackId)}" alt="${alt}" loading="lazy" decoding="async" />`;
}

function ballSprite(ball) {
  return itemSprite(ball.id, ball.name, "poke-ball");
}

function expShareSprite() {
  return itemSprite("exp-share", "Exp. Share", "exp-share");
}

function megaStoneSprite(stone) {
  return itemSprite(stone?.id || GENERIC_MEGA_STONE_ID, stone?.name || "Mega Stone", GENERIC_MEGA_STONE_ID);
}

function priceButton(label, price, disabled, dataAttribute, dataValue) {
  return `<button ${dataAttribute}="${dataValue}" ${disabled ? "disabled" : ""}><span>${label}</span><b>◉ ${formatCoins(price)}</b></button>`;
}

function inventoryEmpty(title, copy) {
  return `<div class="inventory-empty"><span>□</span><strong>${title}</strong><p>${copy}</p></div>`;
}

function clearMegaTeamSelection() {
  selectedMegaStoneId = null;
  document.querySelector("#mega-selection-banner")?.remove();
  const teamList = document.querySelector("#team-list");
  teamList?.classList.remove("mega-selection-active");
  teamList?.querySelectorAll(".team-card").forEach((card) => {
    card.classList.remove("mega-selection-compatible", "mega-selection-blocked");
  });
}

function decorateMegaTeamSelection(stoneId) {
  const stone = MEGA_STONES.find((entry) => entry.id === stoneId);
  const teamDialog = document.querySelector("#team-dialog");
  const teamList = document.querySelector("#team-list");
  if (!stone || !teamDialog?.open || !teamList) return;

  document.querySelector("#mega-selection-banner")?.remove();
  const banner = document.createElement("div");
  banner.id = "mega-selection-banner";
  banner.className = "mega-selection-banner";

  teamList.classList.add("mega-selection-active");
  let compatibleCount = 0;
  teamList.querySelectorAll(".team-card").forEach((card) => {
    const compatibleButton = [...card.querySelectorAll("[data-equip-mega]")]
      .find((button) => button.dataset.equipMega === stone.id);
    const compatible = Boolean(compatibleButton);
    card.classList.toggle("mega-selection-compatible", compatible);
    card.classList.toggle("mega-selection-blocked", !compatible);

    if (compatibleButton) {
      compatibleCount += 1;
      compatibleButton.classList.add("mega-selection-action");
      if (!compatibleButton.classList.contains("selected")) {
        compatibleButton.textContent = `EQUIPAR ${stone.name.toUpperCase()}`;
      }
    }
  });

  banner.innerHTML = compatibleCount
    ? `Você está usando <strong>${stone.name}</strong>. Escolha o ${stone.baseName} correto abaixo para equipar a Mega Stone.`
    : `<strong>${stone.baseName}</strong> não está na equipe. Adicione-o pelo depósito e então equipe a ${stone.name}.`;

  const teamHelp = teamDialog.querySelector(".team-help");
  if (teamHelp) teamHelp.insertAdjacentElement("afterend", banner);
  else teamDialog.querySelector(".dialog-heading")?.insertAdjacentElement("afterend", banner);
}

function openMegaStoneTeamSelection(stoneId) {
  const stone = MEGA_STONES.find((entry) => entry.id === stoneId);
  if (!stone) return;

  selectedMegaStoneId = stone.id;
  const itemsDialog = document.querySelector("#items-dialog");
  if (itemsDialog?.open) itemsDialog.close();

  const teamButton = document.querySelector("#team-button");
  teamButton?.click();
  requestAnimationFrame(() => decorateMegaTeamSelection(stone.id));
}

function installMegaStoneUseFlow() {
  if (megaSelectionListenersInstalled) return;
  megaSelectionListenersInstalled = true;

  const itemsDialog = document.querySelector("#items-dialog");
  const teamDialog = document.querySelector("#team-dialog");

  itemsDialog?.addEventListener("click", (event) => {
    const useButton = event.target.closest("[data-use-mega-stone]");
    if (!useButton || useButton.disabled) return;
    openMegaStoneTeamSelection(useButton.dataset.useMegaStone);
  });

  teamDialog?.addEventListener("click", (event) => {
    if (!selectedMegaStoneId) return;
    const actionButton = event.target.closest("button");
    if (!actionButton) return;

    const selectedStone = selectedMegaStoneId;
    window.setTimeout(() => {
      if (actionButton.dataset.equipMega === selectedStone) {
        clearMegaTeamSelection();
        return;
      }
      decorateMegaTeamSelection(selectedStone);
    }, 0);
  });

  teamDialog?.addEventListener("close", clearMegaTeamSelection);
}

export function enhanceShopMarkup() {
  const headerActions = document.querySelector(".header-actions");
  if (headerActions && !document.querySelector("#shop-button")) {
    const teamButton = document.querySelector("#team-button");
    teamButton?.insertAdjacentHTML("beforebegin", `
      <div id="coin-balance" class="coin-balance" title="PokéCoins disponíveis"><span>◉</span><strong id="coin-count">0</strong></div>
      <button id="shop-button" class="shop-button">LOJA</button>
      <button id="items-button" class="items-button">ITENS <span id="items-count">0</span></button>
    `);
  }

  if (!document.querySelector("#shop-dialog")) {
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
        <div id="shop-feedback" class="shop-feedback" role="status" hidden></div>
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

  if (!document.querySelector("#items-dialog")) {
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="items-dialog" class="shop-dialog items-dialog">
        <div class="dialog-heading shop-heading">
          <div><small>INVENTÁRIO DA JORNADA</small><h2>Itens</h2></div>
          <button id="close-items" class="icon-button" aria-label="Fechar itens">×</button>
        </div>
        <div class="inventory-summary">
          <div><small>POKÉ BOLAS</small><strong id="inventory-ball-total">0</strong></div>
          <div><small>EXP. SHARE</small><strong id="inventory-exp-status">NENHUM</strong></div>
          <div><small>MEGA PEDRAS</small><strong id="inventory-mega-total">0</strong></div>
        </div>
        <div class="inventory-scroll">
          <section class="inventory-section">
            <div class="inventory-heading"><span class="inventory-icon ball">${itemSprite("poke-ball", "Poké Bola")}</span><div><small>CONSUMÍVEIS</small><h3>Poké Bolas</h3></div></div>
            <div id="inventory-ball-grid" class="inventory-grid"></div>
          </section>
          <section class="inventory-section">
            <div class="inventory-heading"><span class="inventory-icon exp">${expShareSprite()}</span><div><small>MELHORIA PERMANENTE</small><h3>Exp. Share</h3></div></div>
            <div id="inventory-exp-grid" class="inventory-grid"></div>
          </section>
          <section class="inventory-section">
            <div class="inventory-heading"><span class="inventory-icon mega">${megaStoneSprite()}</span><div><small>MEGA EVOLUÇÃO</small><h3>Mega Pedras</h3></div></div>
            <div id="inventory-mega-grid" class="inventory-grid"></div>
          </section>
        </div>
      </dialog>
    `);
  }

  installMegaStoneUseFlow();
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

export function showShopFeedback(message) {
  const feedback = document.querySelector("#shop-feedback");
  if (!feedback) return;
  feedback.textContent = message || "";
  feedback.hidden = !message;
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
      <span class="shop-item-icon ball-icon ${ball.id}">${ballSprite(ball)}</span>
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
      <span class="shop-item-icon exp-icon">${expShareSprite()}</span>
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
    root.innerHTML = `<div class="shop-empty"><span>${megaStoneSprite()}</span><strong>Mega Pedras ainda bloqueadas</strong><p>Chegue ao Planalto Índigo para liberar esta categoria.</p></div>`;
    return;
  }

  const visible = getVisibleMegaStones(state);
  if (!visible.length) {
    root.innerHTML = `<div class="shop-empty"><span>${megaStoneSprite()}</span><strong>Nenhuma Mega Pedra descoberta</strong><p>Capture ou evolua um Pokémon que possua Mega Evolução. A pedra correspondente aparecerá aqui.</p></div>`;
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
      <span class="shop-item-icon mega-icon">${megaStoneSprite(stone)}</span>
      <div class="shop-item-copy"><small>${status}</small><h4>${stone.name}</h4><p>${stone.baseName} poderá se transformar em ${stone.megaName} durante as batalhas.</p><em>${stone.legendary ? "Mega Pedra lendária" : "Desbloqueio permanente"}</em></div>
      ${purchased
        ? `<button disabled><span>ADQUIRIDA</span><b>✓</b></button>`
        : priceButton("COMPRAR", stone.price, disabled, "data-buy-mega-stone", stone.id)}
    </article>`;
  }).join("");
}

function renderBallInventory(state) {
  const root = document.querySelector("#inventory-ball-grid");
  if (!root) return;
  const owned = BALL_DEFINITIONS
    .map((ball) => ({ ...ball, stock: Math.max(0, Number(state.shop?.balls?.[ball.id]) || 0) }))
    .filter((ball) => ball.stock > 0);

  root.innerHTML = owned.length
    ? owned.map((ball) => `<article class="inventory-item"><span class="inventory-item-icon ball ${ball.id}">${ballSprite(ball)}</span><div><small>QUANTIDADE</small><strong>${ball.name}</strong><p>Você possui <b>${ball.stock}</b>. Cada uso acrescenta ${ball.guaranteed ? "captura garantida" : `+${ball.bonus}% à chance`}.</p></div><em>x${ball.stock}</em></article>`).join("")
    : inventoryEmpty("Nenhuma Poké Bola comprada", "As Poké Bolas adquiridas na loja aparecerão aqui.");
}

function renderExpInventory(state) {
  const root = document.querySelector("#inventory-exp-grid");
  if (!root) return;
  const currentLevel = Math.max(0, Number(state.shop?.expShareLevel) || 0);
  const upgrade = EXP_SHARE_UPGRADES.find((entry) => entry.level === currentLevel);

  root.innerHTML = upgrade
    ? `<article class="inventory-item featured"><span class="inventory-item-icon exp">${expShareSprite()}</span><div><small>ATIVO AUTOMATICAMENTE</small><strong>${upgrade.name}</strong><p>Pokémon conscientes que não participaram recebem <b>${Math.round(upgrade.multiplier * 100)}% do XP</b>. Esta melhoria é permanente.</p></div><em>NÍVEL ${upgrade.level}</em></article>`
    : inventoryEmpty("Exp. Share não adquirido", "Compre o Exp. Share na aba Treinamento da loja.");
}

function renderMegaInventory(state) {
  const root = document.querySelector("#inventory-mega-grid");
  if (!root) return;
  const ownedIds = new Set(state.shop?.ownedMegaStones || []);
  const owned = MEGA_STONES.filter((stone) => ownedIds.has(stone.id));
  const equippedStoneId = state.shop?.equippedMegaStoneId;
  const equippedPokemon = (state.team || []).find((pokemon) => pokemon.uid === state.shop?.equippedMegaPokemonUid);

  root.innerHTML = owned.length
    ? owned.map((stone) => {
        const equipped = stone.id === equippedStoneId && equippedPokemon;
        return `<article class="inventory-item has-action ${equipped ? "featured" : ""}">
          <span class="inventory-item-icon mega">${megaStoneSprite(stone)}</span>
          <div><small>${equipped ? "EQUIPADA" : "DESBLOQUEIO PERMANENTE"}</small><strong>${stone.name}</strong><p>${stone.baseName} → ${stone.megaName}${equipped ? ` · equipada em <b>${equippedPokemon.name}</b>` : ""}.</p></div>
          <em>${equipped ? "ATIVA" : "GUARDADA"}</em>
          <button class="inventory-use-button" data-use-mega-stone="${stone.id}" ${equipped ? "disabled" : ""}>${equipped ? "EQUIPADA" : "USAR"}</button>
        </article>`;
      }).join("")
    : inventoryEmpty("Nenhuma Mega Pedra comprada", "As Mega Pedras adquiridas na loja aparecerão aqui.");
}

export function renderItems(state) {
  const ballTotal = BALL_DEFINITIONS.reduce((total, ball) => total + Math.max(0, Number(state.shop?.balls?.[ball.id]) || 0), 0);
  const expLevel = Math.max(0, Number(state.shop?.expShareLevel) || 0);
  const megaTotal = Array.isArray(state.shop?.ownedMegaStones) ? state.shop.ownedMegaStones.length : 0;
  const ballTotalElement = document.querySelector("#inventory-ball-total");
  const expStatusElement = document.querySelector("#inventory-exp-status");
  const megaTotalElement = document.querySelector("#inventory-mega-total");

  if (ballTotalElement) ballTotalElement.textContent = String(ballTotal);
  if (expStatusElement) expStatusElement.textContent = expLevel ? `NÍVEL ${expLevel}` : "NENHUM";
  if (megaTotalElement) megaTotalElement.textContent = String(megaTotal);
  renderBallInventory(state);
  renderExpInventory(state);
  renderMegaInventory(state);
}

export function renderShopHud(state) {
  const coins = formatCoins(state.shop?.coins);
  const coinCount = document.querySelector("#coin-count");
  const shopCoinCount = document.querySelector("#shop-coin-count");
  const shopButton = document.querySelector("#shop-button");
  const itemsButton = document.querySelector("#items-button");
  const itemsCount = document.querySelector("#items-count");
  const disabled = !state.hasStarted || state.mode !== "exploring" || Boolean(state.pendingEvolutionChoices?.length);
  const inventoryCount = BALL_DEFINITIONS.reduce((total, ball) => total + Math.max(0, Number(state.shop?.balls?.[ball.id]) || 0), 0)
    + (Number(state.shop?.expShareLevel) > 0 ? 1 : 0)
    + (Array.isArray(state.shop?.ownedMegaStones) ? state.shop.ownedMegaStones.length : 0);

  if (coinCount) coinCount.textContent = coins;
  if (shopCoinCount) shopCoinCount.textContent = coins;
  if (itemsCount) itemsCount.textContent = String(inventoryCount);
  if (shopButton) {
    shopButton.disabled = disabled;
    shopButton.title = disabled ? "Disponível enquanto a equipe estiver explorando" : "Abrir Loja Pokémon";
  }
  if (itemsButton) {
    itemsButton.disabled = disabled;
    itemsButton.title = disabled ? "Disponível enquanto a equipe estiver explorando" : "Abrir inventário de itens";
  }
}

export function renderShop(state) {
  renderShopHud(state);
  renderBallShop(state);
  renderExpShareShop(state);
  renderMegaShop(state);
  renderItems(state);
}

export function getMegaCatalogSize() {
  return MEGA_STONES.length;
}
