import "../styles/form-items.css";
import { FORM_ITEMS, getFormItem } from "../data/form-items-data.js";
import { BALL_DEFINITIONS } from "../data/shop-data.js";
import {
  getOwnedFormItemsForSpecies,
  getVisibleFormItems,
  isFormItemShopUnlocked
} from "../systems/form-items.js";

const ITEM_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";
let selectedFormItemId = null;
let listenersInstalled = false;

function formatCoins(value) {
  return Math.max(0, Math.floor(Number(value) || 0)).toLocaleString("pt-BR");
}

function itemSpriteUrl(itemId) {
  return `${ITEM_SPRITE_BASE}/${itemId}.png`;
}

function formItemSprite(item) {
  return `<img class="item-sprite" src="${itemSpriteUrl(item?.id || "reveal-glass")}" data-fallback-src="${itemSpriteUrl("mega-stone")}" alt="${item?.name || "Item de Forma"}" loading="lazy" decoding="async" />`;
}

function compatibleNames(item) {
  return item.forms.map((form) => form.baseName).join(", ");
}

function selectFormItemsTab() {
  document.querySelectorAll("[data-shop-tab]").forEach((button) => {
    button.classList.toggle("selected", button.dataset.shopTab === "forms");
  });
  document.querySelectorAll("[data-shop-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.shopPanel !== "forms";
  });
}

function clearFormTeamSelection() {
  selectedFormItemId = null;
  document.querySelector("#form-item-selection-banner")?.remove();
  const teamList = document.querySelector("#team-list");
  teamList?.classList.remove("mega-selection-active");
  teamList?.querySelectorAll(".team-card").forEach((card) => {
    card.classList.remove("mega-selection-compatible", "mega-selection-blocked");
  });
}

function decorateFormTeamSelection(itemId) {
  const item = getFormItem(itemId);
  const teamDialog = document.querySelector("#team-dialog");
  const teamList = document.querySelector("#team-list");
  if (!item || !teamDialog?.open || !teamList) return;

  document.querySelector("#form-item-selection-banner")?.remove();
  const banner = document.createElement("div");
  banner.id = "form-item-selection-banner";
  banner.className = "mega-selection-banner";

  teamList.classList.add("mega-selection-active");
  let compatibleCount = 0;
  teamList.querySelectorAll(".team-card").forEach((card) => {
    const compatibleButton = [...card.querySelectorAll("[data-equip-form-item]")]
      .find((button) => button.dataset.equipFormItem === item.id);
    const compatible = Boolean(compatibleButton);
    card.classList.toggle("mega-selection-compatible", compatible);
    card.classList.toggle("mega-selection-blocked", !compatible);
    if (!compatibleButton) return;
    compatibleCount += 1;
    compatibleButton.classList.add("mega-selection-action");
    if (!compatibleButton.classList.contains("selected")) {
      compatibleButton.textContent = `EQUIPAR ${item.name.toUpperCase()}`;
    }
  });

  banner.innerHTML = compatibleCount
    ? `Você está usando <strong>${item.name}</strong>. Escolha um Pokémon compatível abaixo.`
    : `<strong>${compatibleNames(item)}</strong> não está na equipe. Adicione o Pokémon pelo depósito para usar este item.`;
  const teamHelp = teamDialog.querySelector(".team-help");
  if (teamHelp) teamHelp.insertAdjacentElement("afterend", banner);
  else teamDialog.querySelector(".dialog-heading")?.insertAdjacentElement("afterend", banner);
}

function openFormItemTeamSelection(itemId) {
  const item = getFormItem(itemId);
  if (!item) return;
  selectedFormItemId = item.id;
  const itemsDialog = document.querySelector("#items-dialog");
  if (itemsDialog?.open) itemsDialog.close();
  document.querySelector("#team-button")?.click();
  requestAnimationFrame(() => decorateFormTeamSelection(item.id));
}

function installListeners() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  const shopDialog = document.querySelector("#shop-dialog");
  const itemsDialog = document.querySelector("#items-dialog");
  const teamDialog = document.querySelector("#team-dialog");

  shopDialog?.addEventListener("click", (event) => {
    const formTab = event.target.closest('[data-shop-tab="forms"]');
    if (!formTab) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    selectFormItemsTab();
  }, true);

  itemsDialog?.addEventListener("click", (event) => {
    const useButton = event.target.closest("[data-use-form-item]");
    if (!useButton || useButton.disabled) return;
    openFormItemTeamSelection(useButton.dataset.useFormItem);
  });

  teamDialog?.addEventListener("click", (event) => {
    if (!selectedFormItemId) return;
    const actionButton = event.target.closest("button");
    if (!actionButton) return;
    const selectedItem = selectedFormItemId;
    window.setTimeout(() => {
      if (actionButton.dataset.equipFormItem === selectedItem) {
        clearFormTeamSelection();
        return;
      }
      decorateFormTeamSelection(selectedItem);
    }, 0);
  });
  teamDialog?.addEventListener("close", clearFormTeamSelection);
}

export function enhanceFormItemsMarkup() {
  const tabs = document.querySelector(".shop-tabs");
  if (tabs && !tabs.querySelector('[data-shop-tab="forms"]')) {
    tabs.insertAdjacentHTML("beforeend", '<button data-shop-tab="forms">ITENS DE FORMA</button>');
  }

  const megaPanel = document.querySelector('[data-shop-panel="mega"]');
  if (megaPanel && !document.querySelector('[data-shop-panel="forms"]')) {
    megaPanel.insertAdjacentHTML("afterend", `
      <section class="shop-panel" data-shop-panel="forms" hidden>
        <div class="shop-panel-heading"><div><small>FORMAS LENDÁRIAS</small><h3>Itens de Forma</h3></div><p>Itens permanentes que mudam sprite, tipo, golpes e atributos oficiais enquanto estiverem equipados.</p></div>
        <div id="shop-form-item-grid" class="shop-grid mega-shop-grid"></div>
      </section>
    `);
  }

  const summary = document.querySelector(".inventory-summary");
  if (summary && !document.querySelector("#inventory-form-item-total")) {
    summary.insertAdjacentHTML("beforeend", '<div><small>ITENS DE FORMA</small><strong id="inventory-form-item-total">0</strong></div>');
  }

  const inventoryScroll = document.querySelector(".inventory-scroll");
  if (inventoryScroll && !document.querySelector("#inventory-form-item-grid")) {
    inventoryScroll.insertAdjacentHTML("beforeend", `
      <section class="inventory-section">
        <div class="inventory-heading"><span class="inventory-icon mega">${formItemSprite()}</span><div><small>FORMAS ESPECIAIS</small><h3>Itens de Forma</h3></div></div>
        <div id="inventory-form-item-grid" class="inventory-grid"></div>
      </section>
    `);
  }
  installListeners();
}

export function decorateFormItemTeam(state) {
  const cards = [...document.querySelectorAll("#team-list .team-card")];
  const equipped = state.shop?.equippedFormItems || {};
  cards.forEach((card, index) => {
    card.querySelector(".form-item-picker")?.remove();
    card.querySelector(".form-item-ready-label")?.remove();
    const pokemon = state.team?.[index];
    if (!pokemon) return;
    const compatible = getOwnedFormItemsForSpecies(state, pokemon.id);
    if (!compatible.length) return;
    const actions = card.querySelector(".team-card-actions");
    const info = card.querySelector(".team-card-info");
    if (!actions) return;
    const buttons = compatible.map((item) => {
      const selected = equipped[item.id] === pokemon.uid;
      return `<button class="mega-equip-button form-item-equip-button ${selected ? "selected" : ""}" data-equip-form-item="${item.id}" data-form-item-pokemon="${pokemon.uid}">${selected ? "EQUIPADO" : item.name}</button>`;
    }).join("");
    actions.insertAdjacentHTML("beforeend", `<span class="mega-picker form-item-picker"><small>ITEM DE FORMA</small>${buttons}</span>`);
    if (pokemon.isFormItemActive && info) {
      info.insertAdjacentHTML("beforeend", '<span class="mega-ready-label form-item-ready-label">◆ FORMA ESPECIAL ATIVA</span>');
    }
  });
}

function renderFormItemShop(state) {
  const root = document.querySelector("#shop-form-item-grid");
  if (!root) return;
  const visible = getVisibleFormItems(state);
  if (!visible.length) {
    root.innerHTML = `<div class="shop-empty"><span>${formItemSprite()}</span><strong>Nenhum item de forma descoberto</strong><p>Capture Groudon, Kyogre, Giratina, Tornadus, Thundurus, Landorus, Zacian, Zamazenta, Dialga ou Palkia para revelar o item correspondente.</p></div>`;
    return;
  }
  const unlocked = isFormItemShopUnlocked(state);
  const coins = Number(state.shop?.coins) || 0;
  const owned = new Set(state.shop?.ownedFormItems || []);
  root.innerHTML = visible.map((item) => {
    const purchased = owned.has(item.id);
    const disabled = purchased || !unlocked || coins < item.price;
    const status = purchased ? "COMPRADO" : unlocked ? "DISPONÍVEL" : "LIBERA NA ELITE 4";
    return `<article class="shop-item mega-item ${purchased ? "purchased" : ""} ${unlocked ? "unlocked" : "locked"}">
      <span class="shop-item-icon mega-icon">${formItemSprite(item)}</span>
      <div class="shop-item-copy"><small>${status}</small><h4>${item.name}</h4><p>${item.description}</p><em>Compatível com: ${compatibleNames(item)}</em></div>
      ${purchased
        ? '<button disabled><span>ADQUIRIDO</span><b>✓</b></button>'
        : `<button data-buy-form-item="${item.id}" ${disabled ? "disabled" : ""}><span>COMPRAR</span><b>◉ ${formatCoins(item.price)}</b></button>`}
    </article>`;
  }).join("");
}

function renderFormItemInventory(state) {
  const root = document.querySelector("#inventory-form-item-grid");
  if (!root) return;
  const ownedIds = new Set(state.shop?.ownedFormItems || []);
  const owned = FORM_ITEMS.filter((item) => ownedIds.has(item.id));
  const equipped = state.shop?.equippedFormItems || {};
  root.innerHTML = owned.length
    ? owned.map((item) => {
        const pokemon = (state.team || []).find((member) => member.uid === equipped[item.id]);
        const active = Boolean(pokemon);
        return `<article class="inventory-item has-action ${active ? "featured" : ""}">
          <span class="inventory-item-icon mega">${formItemSprite(item)}</span>
          <div><small>${active ? "EQUIPADO" : "DESBLOQUEIO PERMANENTE"}</small><strong>${item.name}</strong><p>${compatibleNames(item)}${active ? ` · equipado em <b>${pokemon.name}</b>` : ""}.</p></div>
          <em>${active ? "ATIVO" : "GUARDADO"}</em>
          <button class="inventory-use-button" data-use-form-item="${item.id}" ${active ? "disabled" : ""}>${active ? "EQUIPADO" : "USAR"}</button>
        </article>`;
      }).join("")
    : '<div class="inventory-empty"><span>□</span><strong>Nenhum item de forma comprado</strong><p>Os itens adquiridos na loja aparecerão aqui.</p></div>';
}

export function renderFormItems(state) {
  const ownedTotal = Array.isArray(state.shop?.ownedFormItems) ? state.shop.ownedFormItems.length : 0;
  const summary = document.querySelector("#inventory-form-item-total");
  if (summary) summary.textContent = String(ownedTotal);

  const ballTotal = BALL_DEFINITIONS.reduce((total, ball) => total + Math.max(0, Number(state.shop?.balls?.[ball.id]) || 0), 0);
  const inventoryCount = ballTotal
    + (Number(state.shop?.expShareLevel) > 0 ? 1 : 0)
    + (Array.isArray(state.shop?.ownedMegaStones) ? state.shop.ownedMegaStones.length : 0)
    + ownedTotal;
  const itemsCount = document.querySelector("#items-count");
  if (itemsCount) itemsCount.textContent = String(inventoryCount);
  renderFormItemShop(state);
  renderFormItemInventory(state);
}
