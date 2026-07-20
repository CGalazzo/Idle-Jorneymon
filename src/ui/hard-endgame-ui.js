import "../styles/hard-endgame.css";
import { HARD_CHALLENGES, HARD_SHOP_ITEMS } from "../data/hard-endgame-data.js";
import { getPokemonSpriteUrls } from "../data/pokemon.js";
import { getHardEndgameStatus } from "../systems/hard-endgame.js";

const ITEM_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";

function itemSprite(item) {
  const source = `${ITEM_SPRITE_BASE}/${item.spriteId}.png`;
  const fallback = `${ITEM_SPRITE_BASE}/master-ball.png`;
  return `<img src="${source}" data-fallback-src="${fallback}" alt="${item.name}" loading="lazy" decoding="async" />`;
}

function challengeSprite(challenge) {
  const sprites = getPokemonSpriteUrls(challenge.speciesId, Boolean(challenge.shiny));
  return `<img src="${sprites.sprite}" alt="${challenge.subtitle}" loading="lazy" decoding="async" />`;
}

export function enhanceHardEndgameMarkup() {
  const headerActions = document.querySelector(".header-actions");
  const shopButton = document.querySelector("#shop-button");
  if (headerActions && shopButton && !document.querySelector("#hard-shop-button")) {
    shopButton.insertAdjacentHTML("beforebegin", `<button id="hard-shop-button" class="hard-endgame-button" hidden>LOJA HARD</button>`);
  }

  const journeyActions = document.querySelector(".journey-menu-actions");
  if (journeyActions && !document.querySelector("#hard-menu-actions")) {
    journeyActions.insertAdjacentHTML("beforebegin", `
      <div id="hard-menu-actions" class="hard-menu-actions" hidden>
        <button id="hard-menu-shop-button" class="hard-menu-action">LOJA HARD</button>
        <button id="hard-challenges-button" class="hard-menu-action" hidden>DESAFIOS HARD</button>
      </div>
    `);
  }

  if (!document.querySelector("#hard-shop-dialog")) {
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="hard-shop-dialog" class="hard-endgame-dialog">
        <div class="hard-endgame-heading">
          <div><small>RECOMPENSAS DO MODO HARD</small><h2>Loja de Emblemas</h2></div>
          <button id="close-hard-shop" class="icon-button" aria-label="Fechar Loja Hard">×</button>
        </div>
        <div class="hard-emblem-wallet"><span>◆</span><strong><b id="hard-emblem-count">0</b> Emblemas Hard</strong><small>Ganhos na primeira conclusão das rotas Hard e nos desafios de campeão.</small></div>
        <div id="hard-shop-feedback" class="hard-shop-feedback" hidden></div>
        <div id="hard-shop-grid" class="hard-shop-grid"></div>
      </dialog>
    `);
  }

  if (!document.querySelector("#hard-challenges-dialog")) {
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="hard-challenges-dialog" class="hard-endgame-dialog">
        <div class="hard-endgame-heading">
          <div><small>CONTEÚDO PÓS-ROTA 150</small><h2>Desafios Hard</h2></div>
          <button id="close-hard-challenges" class="icon-button" aria-label="Fechar desafios">×</button>
        </div>
        <div class="hard-emblem-wallet"><span>◆</span><strong><b id="challenge-emblem-count">0</b> Emblemas Hard</strong><small>Primeiras vitórias concedem recompensas maiores. Os desafios podem ser repetidos.</small></div>
        <div id="hard-challenge-grid" class="hard-challenge-grid"></div>
      </dialog>
    `);
  }

  if (!document.querySelector("#hard-challenge-result-dialog")) {
    document.body.insertAdjacentHTML("beforeend", `
      <dialog id="hard-challenge-result-dialog" class="hard-endgame-dialog hard-result-dialog">
        <div class="hard-result-trophy">🏆</div>
        <small>DESAFIO HARD CONCLUÍDO</small>
        <h2 id="hard-result-title">Vitória!</h2>
        <p id="hard-result-copy"></p>
        <strong id="hard-result-reward" class="hard-result-reward"></strong>
        <button id="hard-result-menu-button">VOLTAR AO MENU</button>
      </dialog>
    `);
  }
}

function renderHardShop(state, status) {
  const root = document.querySelector("#hard-shop-grid");
  if (!root) return;
  const masterStock = Math.max(0, Number(state.shop?.balls?.["master-ball"]) || 0);

  root.innerHTML = HARD_SHOP_ITEMS.map((item) => {
    let purchased = false;
    let unavailable = false;
    let stateCopy = "DISPONÍVEL";

    if (item.id === "master-ball") {
      purchased = masterStock >= 1;
      unavailable = purchased;
      stateCopy = purchased ? "INVENTÁRIO CHEIO · x1" : "CONSUMÍVEL";
    }
    if (item.id === "hard-shiny-charm") {
      purchased = status.shinyCharmOwned;
      unavailable = purchased;
      stateCopy = purchased ? "ATIVO · CHANCE 1/128" : "MELHORIA PERMANENTE";
    }
    if (item.id === "hard-champion-badge") {
      purchased = status.championBadgeOwned;
      unavailable = purchased;
      stateCopy = purchased ? "EQUIPADA" : "RECOMPENSA COSMÉTICA";
    }

    const disabled = unavailable || status.emblems < item.emblemPrice;
    return `<article class="hard-shop-card ${purchased ? "purchased" : ""}">
      <span class="hard-item-sprite">${itemSprite(item)}</span>
      <small>${stateCopy}</small>
      <h3>${item.name}</h3>
      <p>${item.description}</p>
      <button data-buy-hard-item="${item.id}" ${disabled ? "disabled" : ""}>${purchased ? "ADQUIRIDO" : `COMPRAR · ◆ ${item.emblemPrice}`}</button>
    </article>`;
  }).join("");
}

function renderChallenges(status) {
  const root = document.querySelector("#hard-challenge-grid");
  if (!root) return;
  root.innerHTML = HARD_CHALLENGES.map((challenge) => {
    const completed = status.completedChallengeIds.includes(challenge.id);
    const reward = completed ? challenge.repeatReward : challenge.firstReward;
    return `<article class="hard-challenge-card ${completed ? "completed" : ""}">
      <span class="hard-challenge-sprite">${challengeSprite(challenge)}</span>
      <small>${completed ? "CONCLUÍDO · REPETÍVEL" : challenge.subtitle}</small>
      <h3>${challenge.name}</h3>
      <p>${challenge.description}</p>
      <button data-start-hard-challenge="${challenge.id}">ENFRENTAR · ◆ ${reward}</button>
    </article>`;
  }).join("");
}

function renderChallengeResult(status) {
  const dialog = document.querySelector("#hard-challenge-result-dialog");
  const result = status.challengeResult;
  if (!dialog) return;

  if (!result) {
    if (dialog.open) dialog.close();
    return;
  }

  const title = document.querySelector("#hard-result-title");
  const copy = document.querySelector("#hard-result-copy");
  const reward = document.querySelector("#hard-result-reward");
  if (title) title.textContent = result.name;
  if (copy) copy.textContent = result.firstCompletion
    ? "Primeira vitória registrada! O desafio agora pode ser repetido por uma recompensa menor."
    : "Você derrotou novamente este campeão do pós-jogo.";
  if (reward) reward.textContent = `+${result.reward} Emblemas Hard`;
  if (!dialog.open) dialog.showModal();
}

export function showHardShopFeedback(message = "") {
  const feedback = document.querySelector("#hard-shop-feedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.hidden = !message;
}

export function renderHardEndgame(state) {
  const status = getHardEndgameStatus(state);
  const hardShopButton = document.querySelector("#hard-shop-button");
  const hardMenuActions = document.querySelector("#hard-menu-actions");
  const hardChallengesButton = document.querySelector("#hard-challenges-button");
  const disabled = !state.hasStarted || state.mode !== "exploring" || Boolean(state.pendingEvolutionChoices?.length) || Boolean(status.activeChallengeId);

  if (hardShopButton) {
    hardShopButton.hidden = !state.hardModeUnlocked;
    hardShopButton.disabled = disabled;
    hardShopButton.title = `Loja Hard · ${status.emblems} Emblemas`;
  }
  if (hardMenuActions) hardMenuActions.hidden = !state.hardModeUnlocked;
  if (hardChallengesButton) hardChallengesButton.hidden = !status.hardCampaignComplete;

  const emblemCount = document.querySelector("#hard-emblem-count");
  const challengeEmblemCount = document.querySelector("#challenge-emblem-count");
  if (emblemCount) emblemCount.textContent = String(status.emblems);
  if (challengeEmblemCount) challengeEmblemCount.textContent = String(status.emblems);

  renderHardShop(state, status);
  renderChallenges(status);
  renderChallengeResult(status);
}

export function isHardEndgameScreenOpen() {
  return ["#hard-shop-dialog", "#hard-challenges-dialog", "#hard-challenge-result-dialog"]
    .some((selector) => Boolean(document.querySelector(selector)?.open));
}
