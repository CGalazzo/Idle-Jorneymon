import "../styles/pokedex-variants.css";

const SAVE_KEY = "idle-jorneymon-save";
const SEEN_EVENT = "idle-jorneymon-pokedex-seen";
const ANIMATED_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";
const SHOWDOWN_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown";
const LAST_GENERATION_FIVE_SPECIES_ID = 649;

const liveEntries = new Map();
let decorateScheduled = false;
let observedGrid = null;
let gridObserver = null;

function spriteUrl(speciesId, shiny = false) {
  const id = Math.max(1, Number(speciesId) || 1);
  const shinyPath = shiny ? "shiny/" : "";
  const base = id <= LAST_GENERATION_FIVE_SPECIES_ID
    ? ANIMATED_SPRITE_BASE
    : SHOWDOWN_SPRITE_BASE;
  return `${base}/${shinyPath}${id}.gif`;
}

function cardPokemonId(card) {
  const copy = card.querySelector(".dex-number")?.textContent || "";
  const id = Number(copy.replace(/\D/g, ""));
  return Number.isFinite(id) && id > 0 ? id : 0;
}

function mergeEntry(id, entry = {}) {
  if (!id) return;
  const current = liveEntries.get(id) || {};
  liveEntries.set(id, {
    ...current,
    ...entry,
    seen: Math.max(Number(current.seen) || 0, Number(entry.seen) || 0),
    caught: Math.max(Number(current.caught) || 0, Number(entry.caught) || 0),
    shinySeen: Math.max(Number(current.shinySeen) || 0, Number(entry.shinySeen) || 0),
    shinyCaught: Math.max(Number(current.shinyCaught) || 0, Number(entry.shinyCaught) || 0)
  });
}

function refreshEntriesFromSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    Object.entries(saved?.pokedex || {}).forEach(([id, entry]) => mergeEntry(Number(id), entry));
  } catch {
    // Um save inválido não deve impedir a Pokédex de abrir.
  }
}

function ensureSpritePair(card, pokemonId) {
  let pair = card.querySelector(":scope > .dex-sprite-pair");
  if (!pair) {
    pair = document.createElement("span");
    pair.className = "dex-sprite-pair";
    pair.innerHTML = `
      <span class="dex-sprite-slot normal"><img loading="lazy" decoding="async" draggable="false" /></span>
      <span class="dex-sprite-slot shiny"><img loading="lazy" decoding="async" draggable="false" /></span>`;

    const originalImage = Array.from(card.children).find((child) => child.tagName === "IMG");
    const name = card.querySelector(":scope > strong");
    card.insertBefore(pair, originalImage || name || card.firstChild);
    originalImage?.remove();
  }
  pair.dataset.pokemonId = String(pokemonId);
  return pair;
}

function decorateCard(card) {
  const pokemonId = cardPokemonId(card);
  if (!pokemonId) return;

  const entry = liveEntries.get(pokemonId) || {};
  const normalSeen = Number(entry.seen) > 0 || !card.classList.contains("unknown");
  const shinySeen = Number(entry.shinySeen) > 0
    || Number(entry.shinyCaught) > 0
    || /✨\s*\d+/.test(card.textContent || "");
  const displayName = card.dataset.pokemonDisplayName
    || (card.querySelector(":scope > strong")?.textContent !== "???"
      ? card.querySelector(":scope > strong")?.textContent
      : `Pokémon #${String(pokemonId).padStart(3, "0")}`);

  const pair = ensureSpritePair(card, pokemonId);
  const normalSlot = pair.querySelector(".dex-sprite-slot.normal");
  const shinySlot = pair.querySelector(".dex-sprite-slot.shiny");
  const normalImage = normalSlot.querySelector("img");
  const shinyImage = shinySlot.querySelector("img");
  const normalSource = spriteUrl(pokemonId, false);
  const shinySource = shinySeen ? spriteUrl(pokemonId, true) : normalSource;

  normalSlot.classList.toggle("locked", !normalSeen);
  shinySlot.classList.toggle("locked", !shinySeen);
  normalSlot.dataset.variantState = normalSeen ? "seen" : "unknown";
  shinySlot.dataset.variantState = shinySeen ? "seen" : "unknown";

  if (normalImage.getAttribute("src") !== normalSource) normalImage.src = normalSource;
  if (shinyImage.getAttribute("src") !== shinySource) shinyImage.src = shinySource;

  normalImage.alt = normalSeen ? `${displayName} normal` : "Versão normal ainda não encontrada";
  shinyImage.alt = shinySeen ? `${displayName} shiny` : "Versão shiny ainda não encontrada";
  pair.setAttribute("aria-label", `${normalSeen ? "Forma normal encontrada" : "Forma normal desconhecida"}; ${shinySeen ? "forma shiny encontrada" : "forma shiny desconhecida"}`);
}

function decoratePokedex() {
  decorateScheduled = false;
  refreshEntriesFromSave();
  const grid = document.querySelector("#pokedex-grid");
  if (!grid) return;
  grid.querySelectorAll(":scope > .dex-card").forEach(decorateCard);
}

function scheduleDecorate() {
  if (decorateScheduled) return;
  decorateScheduled = true;
  window.requestAnimationFrame(() => window.requestAnimationFrame(decoratePokedex));
}

function observeGrid() {
  const grid = document.querySelector("#pokedex-grid");
  if (!grid || grid === observedGrid) return Boolean(grid);
  gridObserver?.disconnect();
  observedGrid = grid;
  gridObserver = new MutationObserver(scheduleDecorate);
  gridObserver.observe(grid, { childList: true });
  scheduleDecorate();
  return true;
}

function start() {
  refreshEntriesFromSave();
  observeGrid();

  document.querySelector("#pokedex-button")?.addEventListener("click", scheduleDecorate);
  window.addEventListener(SEEN_EVENT, (event) => {
    const id = Number(event.detail?.pokemonId);
    if (id) mergeEntry(id, event.detail?.entry || {});
    scheduleDecorate();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== SAVE_KEY) return;
    refreshEntriesFromSave();
    scheduleDecorate();
  });

  const pageObserver = new MutationObserver(() => observeGrid());
  pageObserver.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
