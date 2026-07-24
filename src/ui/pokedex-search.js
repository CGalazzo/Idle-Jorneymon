import "../styles/pokedex-search.css";
import { CHAMPIONS_HALL_SPECIES } from "../data/champions-hall-data.js";
import { HARD_MODE_SPECIES } from "../data/hard-mode-data.js";
import { COMPLETE_POKEDEX_SPECIES } from "../data/pokedex-data.js";
import { POKEDEX_SPECIES, STARTERS } from "../data/pokemon.js";
import { SAFARI_SPECIES } from "../data/safari-data.js";
import { ALL_SPECIES } from "../data/worlds.js";

const SAVE_KEY = "idle-jorneymon-save";
const SHINY_HISTORY_KEY = "idle-jorneymon-shiny-seen";
const FAVORITES_KEY = "idle-jorneymon-pokedex-favorites";

const RARITY_ORDER = {
  starter: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythical: 6
};

const TYPE_OPTIONS = [
  ["normal", "Normal"], ["fire", "Fogo"], ["water", "Água"], ["grass", "Planta"],
  ["electric", "Elétrico"], ["ice", "Gelo"], ["fighting", "Lutador"], ["poison", "Veneno"],
  ["ground", "Terra"], ["flying", "Voador"], ["psychic", "Psíquico"], ["bug", "Inseto"],
  ["rock", "Pedra"], ["ghost", "Fantasma"], ["dragon", "Dragão"], ["dark", "Sombrio"],
  ["steel", "Aço"], ["fairy", "Fada"]
];

const TYPE_ALIASES = {
  normal: "normal",
  fogo: "fire", fire: "fire",
  agua: "water", water: "water",
  planta: "grass", grass: "grass",
  eletrico: "electric", electric: "electric",
  gelo: "ice", ice: "ice",
  lutador: "fighting", fighting: "fighting",
  veneno: "poison", poison: "poison",
  terra: "ground", ground: "ground",
  voador: "flying", flying: "flying",
  psiquico: "psychic", psychic: "psychic",
  inseto: "bug", bug: "bug",
  pedra: "rock", rock: "rock",
  fantasma: "ghost", ghost: "ghost",
  dragao: "dragon", dragon: "dragon",
  sombrio: "dark", dark: "dark",
  aco: "steel", steel: "steel",
  fada: "fairy", fairy: "fairy"
};

const speciesById = new Map(COMPLETE_POKEDEX_SPECIES.map((pokemon) => [Number(pokemon.id), pokemon]));
const safariIds = new Set(SAFARI_SPECIES.map((pokemon) => Number(pokemon.id)));
const championsIds = new Set(CHAMPIONS_HALL_SPECIES.map((pokemon) => Number(pokemon.id)));
const hardIds = new Set(HARD_MODE_SPECIES.map((pokemon) => Number(pokemon.id)));
const journeyIds = new Set([
  ...ALL_SPECIES.map((pokemon) => Number(pokemon.id)),
  ...STARTERS.map((pokemon) => Number(pokemon.id)),
  ...POKEDEX_SPECIES.filter((pokemon) => !pokemon.hardExclusive).map((pokemon) => Number(pokemon.id))
]);

let gridObserver = null;
let applyScheduled = false;

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeType(value) {
  const normalized = normalizeText(value);
  return TYPE_ALIASES[normalized] || normalized;
}

function readSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || "null") || {};
  } catch {
    return {};
  }
}

function readSet(key) {
  try {
    const values = JSON.parse(localStorage.getItem(key) || "[]");
    return new Set(Array.isArray(values) ? values.map(Number).filter((value) => Number.isFinite(value) && value > 0) : []);
  } catch {
    return new Set();
  }
}

function writeFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites].sort((a, b) => a - b)));
}

function cardPokemonId(card) {
  const copy = card.querySelector(".dex-number")?.textContent || "";
  const value = Number(copy.replace(/\D/g, ""));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function pokemonTypes(pokemon) {
  const types = Array.isArray(pokemon?.types) && pokemon.types.length
    ? pokemon.types
    : String(pokemon?.type || "Normal").split("/");
  return [...new Set(types.map(normalizeType).filter(Boolean))];
}

function pokemonOrigins(speciesId) {
  const id = Number(speciesId);
  const origins = [];
  if (journeyIds.has(id)) origins.push("journey");
  if (hardIds.has(id)) origins.push("hard");
  if (safariIds.has(id)) origins.push("safari");
  if (championsIds.has(id)) origins.push("champions");
  return origins.length ? origins : ["journey"];
}

function toolbarMarkup() {
  const typeOptions = TYPE_OPTIONS.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  return `
    <div id="pokedex-tools" class="pokedex-tools">
      <label class="pokedex-search-field">
        <span>Buscar Pokémon</span>
        <input id="pokedex-search-input" type="search" placeholder="Digite o nome ou número do Pokémon..." autocomplete="off" autocapitalize="off" spellcheck="false" />
      </label>
      <div class="pokedex-filter-grid">
        <label><span>Tipo</span><select id="pokedex-type-filter"><option value="all">Todos os tipos</option>${typeOptions}</select></label>
        <label><span>Raridade</span><select id="pokedex-rarity-filter">
          <option value="all">Todas as raridades</option>
          <option value="common">Comum</option>
          <option value="uncommon">Incomum</option>
          <option value="rare">Raro</option>
          <option value="epic">Épico</option>
          <option value="legendary">Lendário</option>
          <option value="mythical">Mítico</option>
          <option value="starter">Inicial</option>
        </select></label>
        <label><span>Origem</span><select id="pokedex-origin-filter">
          <option value="all">Todas as origens</option>
          <option value="journey">Jornada</option>
          <option value="hard">Modo Hard</option>
          <option value="safari">Zona Safari</option>
          <option value="champions">Salão dos Campeões</option>
        </select></label>
        <label><span>Ordenar</span><select id="pokedex-sort">
          <option value="number">Número da Pokédex</option>
          <option value="favorites">Favoritos primeiro</option>
          <option value="name">Nome de A a Z</option>
          <option value="caught">Mais capturados</option>
          <option value="rarity">Maior raridade</option>
          <option value="shiny">Shiny encontrados primeiro</option>
        </select></label>
      </div>
      <div class="pokedex-filter-actions">
        <label class="pokedex-check"><input id="pokedex-shiny-only" type="checkbox" /><span>Apenas Shiny encontrados</span></label>
        <label class="pokedex-check"><input id="pokedex-favorites-only" type="checkbox" /><span>Apenas favoritos</span></label>
        <button id="pokedex-clear-filters" type="button">Limpar filtros</button>
      </div>
      <div id="pokedex-result-count" class="pokedex-result-count">Exibindo 0 de 0 Pokémon</div>
      <p id="pokedex-filter-empty" class="pokedex-filter-empty" role="status" hidden>Nenhum Pokémon corresponde aos filtros escolhidos.</p>
    </div>`;
}

function ensureToolbar(dialog) {
  const summary = dialog.querySelector(".pokedex-summary");
  const grid = dialog.querySelector("#pokedex-grid");
  if (!summary || !grid) return false;

  dialog.querySelector(".pokedex-search-wrap")?.remove();
  if (!dialog.querySelector("#pokedex-tools")) {
    summary.insertAdjacentHTML("afterend", toolbarMarkup());
    installToolbarListeners(dialog);
  }
  return true;
}

function currentFilters(dialog) {
  return {
    search: normalizeText(dialog.querySelector("#pokedex-search-input")?.value),
    type: dialog.querySelector("#pokedex-type-filter")?.value || "all",
    rarity: dialog.querySelector("#pokedex-rarity-filter")?.value || "all",
    origin: dialog.querySelector("#pokedex-origin-filter")?.value || "all",
    sort: dialog.querySelector("#pokedex-sort")?.value || "number",
    shinyOnly: Boolean(dialog.querySelector("#pokedex-shiny-only")?.checked),
    favoritesOnly: Boolean(dialog.querySelector("#pokedex-favorites-only")?.checked)
  };
}

function decorateCard(card, metadata, favorite) {
  card.dataset.pokemonId = String(metadata.id);
  card.dataset.pokemonName = normalizeText(metadata.pokemon.name);
  card.classList.toggle("pokedex-favorite", favorite);

  let button = card.querySelector(":scope > .pokedex-favorite-button");
  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "pokedex-favorite-button";
    card.appendChild(button);
  }
  button.dataset.pokedexFavorite = String(metadata.id);
  button.classList.toggle("selected", favorite);
  button.setAttribute("aria-pressed", String(favorite));
  button.setAttribute("aria-label", favorite ? `Remover ${metadata.pokemon.name} dos favoritos` : `Adicionar ${metadata.pokemon.name} aos favoritos`);
  button.title = favorite ? "Remover dos favoritos" : "Adicionar aos favoritos";
  button.textContent = favorite ? "★" : "☆";
}

function buildMetadata(card, save, shinyHistory) {
  const id = cardPokemonId(card);
  const pokemon = speciesById.get(id) || { id, name: `Pokémon #${id}`, type: "Normal", rarity: "common" };
  const entry = save.pokedex?.[id] || {};
  const shinyKnown = Number(entry.shinySeen) > 0 || Number(entry.shinyCaught) > 0 || shinyHistory.has(id);
  return {
    id,
    card,
    pokemon,
    entry,
    types: pokemonTypes(pokemon),
    origins: pokemonOrigins(id),
    rarity: String(pokemon.rarity || "common"),
    shinyKnown,
    caught: Math.max(0, Number(entry.caught) || 0),
    seen: Math.max(0, Number(entry.seen) || 0)
  };
}

function matchesFilters(metadata, filters, favorites) {
  const numberQuery = filters.search.replace(/^#/, "");
  if (filters.search
    && !normalizeText(metadata.pokemon.name).includes(filters.search)
    && String(metadata.id) !== numberQuery
    && String(metadata.id).padStart(3, "0") !== numberQuery) return false;
  if (filters.type !== "all" && !metadata.types.includes(filters.type)) return false;
  if (filters.rarity !== "all" && metadata.rarity !== filters.rarity) return false;
  if (filters.origin !== "all" && !metadata.origins.includes(filters.origin)) return false;
  if (filters.shinyOnly && !metadata.shinyKnown) return false;
  if (filters.favoritesOnly && !favorites.has(metadata.id)) return false;
  return true;
}

function sortEntries(entries, filters, favorites) {
  return entries.sort((a, b) => {
    const favoriteDifference = Number(favorites.has(b.id)) - Number(favorites.has(a.id));
    if (filters.sort === "favorites" && favoriteDifference) return favoriteDifference;
    if (filters.sort === "name") return String(a.pokemon.name).localeCompare(String(b.pokemon.name), "pt-BR");
    if (filters.sort === "caught") return b.caught - a.caught || b.seen - a.seen || a.id - b.id;
    if (filters.sort === "rarity") return (RARITY_ORDER[b.rarity] || 0) - (RARITY_ORDER[a.rarity] || 0) || a.id - b.id;
    if (filters.sort === "shiny") return Number(b.shinyKnown) - Number(a.shinyKnown) || a.id - b.id;
    return a.id - b.id;
  });
}

function observeGrid(grid, dialog) {
  if (!gridObserver) gridObserver = new MutationObserver(() => scheduleApply(dialog));
  gridObserver.disconnect();
  gridObserver.observe(grid, { childList: true });
}

function applyPokedexView(dialog) {
  applyScheduled = false;
  if (!ensureToolbar(dialog)) return;

  const grid = dialog.querySelector("#pokedex-grid");
  if (!grid) return;

  const save = readSave();
  const shinyHistory = readSet(SHINY_HISTORY_KEY);
  const favorites = readSet(FAVORITES_KEY);
  const filters = currentFilters(dialog);
  const cards = [...grid.querySelectorAll(":scope > .dex-card")];
  const entries = cards.map((card) => buildMetadata(card, save, shinyHistory)).filter((entry) => entry.id > 0);

  entries.forEach((entry) => decorateCard(entry.card, entry, favorites.has(entry.id)));
  const visibleEntries = sortEntries(entries.filter((entry) => matchesFilters(entry, filters, favorites)), filters, favorites);
  const visibleCards = new Set(visibleEntries.map((entry) => entry.card));

  gridObserver?.disconnect();
  entries.forEach(({ card }) => { card.hidden = !visibleCards.has(card); });
  visibleEntries.forEach(({ card }) => grid.appendChild(card));

  const empty = dialog.querySelector("#pokedex-filter-empty");
  if (empty) empty.hidden = visibleEntries.length > 0 || entries.length === 0;
  const result = dialog.querySelector("#pokedex-result-count");
  if (result) result.textContent = `Exibindo ${visibleEntries.length} de ${entries.length} Pokémon`;

  observeGrid(grid, dialog);
}

function scheduleApply(dialog) {
  if (applyScheduled) return;
  applyScheduled = true;
  requestAnimationFrame(() => applyPokedexView(dialog));
}

function clearFilters(dialog) {
  const defaults = {
    "#pokedex-search-input": "",
    "#pokedex-type-filter": "all",
    "#pokedex-rarity-filter": "all",
    "#pokedex-origin-filter": "all",
    "#pokedex-sort": "number"
  };
  Object.entries(defaults).forEach(([selector, value]) => {
    const element = dialog.querySelector(selector);
    if (element) element.value = value;
  });
  const shiny = dialog.querySelector("#pokedex-shiny-only");
  const favorites = dialog.querySelector("#pokedex-favorites-only");
  if (shiny) shiny.checked = false;
  if (favorites) favorites.checked = false;
  scheduleApply(dialog);
}

function installToolbarListeners(dialog) {
  dialog.querySelector("#pokedex-search-input")?.addEventListener("input", () => scheduleApply(dialog));
  ["#pokedex-type-filter", "#pokedex-rarity-filter", "#pokedex-origin-filter", "#pokedex-sort", "#pokedex-shiny-only", "#pokedex-favorites-only"]
    .forEach((selector) => dialog.querySelector(selector)?.addEventListener("change", () => scheduleApply(dialog)));
  dialog.querySelector("#pokedex-clear-filters")?.addEventListener("click", () => clearFilters(dialog));
}

function toggleFavorite(dialog, speciesId) {
  const id = Number(speciesId);
  if (!Number.isFinite(id) || id <= 0) return;
  const favorites = readSet(FAVORITES_KEY);
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  writeFavorites(favorites);
  scheduleApply(dialog);
}

function installPokedexTools(dialog) {
  if (dialog.dataset.searchInstalled === "complete") return;
  if (!ensureToolbar(dialog)) return;

  dialog.addEventListener("click", (event) => {
    const favoriteButton = event.target.closest("[data-pokedex-favorite]");
    if (!favoriteButton) return;
    event.preventDefault();
    event.stopPropagation();
    toggleFavorite(dialog, favoriteButton.dataset.pokedexFavorite);
  });

  dialog.dataset.searchInstalled = "complete";
  scheduleApply(dialog);
}

function start() {
  const install = () => {
    const dialog = document.querySelector("#pokedex-dialog");
    if (!dialog) return false;
    installPokedexTools(dialog);
    document.querySelector("#pokedex-button")?.addEventListener("click", () => scheduleApply(dialog));
    return true;
  };

  if (install()) return;

  const observer = new MutationObserver(() => {
    if (!install()) return;
    observer.disconnect();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
