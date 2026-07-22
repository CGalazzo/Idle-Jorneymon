import "../styles/pokedex-variants.css";
import { COMPLETE_POKEDEX_SPECIES } from "../data/pokedex-data.js";

const SAVE_KEY = "idle-jorneymon-save";
const SHINY_HISTORY_KEY = "idle-jorneymon-shiny-seen";
const SEEN_EVENT = "idle-jorneymon-pokedex-seen";
const ANIMATED_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";
const SHOWDOWN_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown";
const LAST_GENERATION_FIVE_SPECIES_ID = 649;

const liveEntries = new Map();
const speciesByName = new Map(COMPLETE_POKEDEX_SPECIES.map((pokemon) => [normalize(pokemon.name), Number(pokemon.id)]));
let shinyHistory = readShinyHistory();
let decorateScheduled = false;
let shinyScanScheduled = false;
let observedGrid = null;
let gridObserver = null;
let observedScene = null;
let sceneObserver = null;

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function spriteUrl(speciesId, shiny = false) {
  const id = Math.max(1, Number(speciesId) || 1);
  const shinyPath = shiny ? "shiny/" : "";
  const base = id <= LAST_GENERATION_FIVE_SPECIES_ID
    ? ANIMATED_SPRITE_BASE
    : SHOWDOWN_SPRITE_BASE;
  return `${base}/${shinyPath}${id}.gif`;
}

function readShinyHistory() {
  try {
    const values = JSON.parse(localStorage.getItem(SHINY_HISTORY_KEY) || "[]");
    return new Set(Array.isArray(values) ? values.map(Number).filter((id) => Number.isFinite(id) && id > 0) : []);
  } catch {
    return new Set();
  }
}

function saveShinyHistory() {
  try {
    localStorage.setItem(SHINY_HISTORY_KEY, JSON.stringify([...shinyHistory].sort((a, b) => a - b)));
  } catch {
    // Falha de armazenamento não deve impedir a Pokédex de abrir.
  }
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
    shinySeen: Math.max(Number(current.shinySeen) || 0, Number(entry.shinySeen) || 0, shinyHistory.has(id) ? 1 : 0),
    shinyCaught: Math.max(Number(current.shinyCaught) || 0, Number(entry.shinyCaught) || 0)
  });
}

function mergeSavedEntry(saved, id, entry = {}) {
  if (!saved || !id) return false;
  if (!saved.pokedex || typeof saved.pokedex !== "object") saved.pokedex = {};
  const current = saved.pokedex[id] || {};
  const next = {
    ...current,
    ...entry,
    seen: Math.max(Number(current.seen) || 0, Number(entry.seen) || 0),
    caught: Math.max(Number(current.caught) || 0, Number(entry.caught) || 0),
    shinySeen: Math.max(Number(current.shinySeen) || 0, Number(entry.shinySeen) || 0, shinyHistory.has(id) ? 1 : 0),
    shinyCaught: Math.max(Number(current.shinyCaught) || 0, Number(entry.shinyCaught) || 0)
  };
  const changed = JSON.stringify(current) !== JSON.stringify(next);
  if (changed) saved.pokedex[id] = next;
  return changed;
}

function persistEntryToSave(id, entry = {}) {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!saved || !mergeSavedEntry(saved, id, entry)) return;
    saved.lastSavedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
  } catch {
    // Um save inválido não deve impedir o registro visual.
  }
}

function rememberShiny(id, entry = {}) {
  const pokemonId = Number(id);
  if (!Number.isFinite(pokemonId) || pokemonId <= 0) return false;
  const wasKnown = shinyHistory.has(pokemonId);
  shinyHistory.add(pokemonId);
  if (!wasKnown) saveShinyHistory();
  const shinyEntry = {
    ...entry,
    seen: Math.max(1, Number(entry.seen) || 0),
    shinySeen: Math.max(1, Number(entry.shinySeen) || 0)
  };
  mergeEntry(pokemonId, shinyEntry);
  persistEntryToSave(pokemonId, shinyEntry);
  scheduleDecorate();
  return !wasKnown;
}

function speciesIdFromImage(image) {
  const alt = normalize(image?.alt)
    .replace(/\s+(shiny|normal|caminhando|se aproximando).*$/, "")
    .trim();
  if (speciesByName.has(alt)) return speciesByName.get(alt);
  for (const [name, id] of speciesByName) {
    if (alt === name || alt.startsWith(`${name} `)) return id;
  }
  const source = image?.getAttribute("src") || image?.currentSrc || image?.src || "";
  const match = source.match(/\/(?:shiny\/)?(\d+)\.(?:gif|png|webp)(?:\?|$)/i);
  return match ? Number(match[1]) : 0;
}

function scanDisplayedShinies() {
  shinyScanScheduled = false;
  const selectors = [
    "#approaching-enemy-sprite",
    "#battle-stage .enemy-card .pokemon-sprite",
    "#battle-stage .capture-pokemon img"
  ];
  document.querySelectorAll(selectors.join(",")).forEach((image) => {
    const source = image.getAttribute("src") || image.currentSrc || image.src || "";
    const containerShiny = Boolean(image.closest(".shiny"));
    if (!containerShiny && !/\/shiny\//i.test(source)) return;
    const id = speciesIdFromImage(image);
    if (id) rememberShiny(id);
  });
}

function scheduleShinyScan() {
  if (shinyScanScheduled) return;
  shinyScanScheduled = true;
  window.requestAnimationFrame(scanDisplayedShinies);
}

function backfillSavedHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    if (!saved) return;
    let changed = false;

    if (saved.enemy?.isShiny && Number(saved.enemy.id) > 0) {
      const id = Number(saved.enemy.id);
      if (!shinyHistory.has(id)) {
        shinyHistory.add(id);
        changed = true;
      }
    }

    const logText = normalize(Array.isArray(saved.log) ? saved.log.join("\n") : "");
    if (logText) {
      COMPLETE_POKEDEX_SPECIES.forEach((pokemon) => {
        if (!logText.includes(`${normalize(pokemon.name)} shiny`)) return;
        const id = Number(pokemon.id);
        if (!shinyHistory.has(id)) {
          shinyHistory.add(id);
          changed = true;
        }
      });
    }

    shinyHistory.forEach((id) => {
      if (mergeSavedEntry(saved, id, { seen: 1, shinySeen: 1 })) changed = true;
    });

    if (changed) {
      saveShinyHistory();
      saved.lastSavedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(saved));
    }
  } catch {
    // Saves antigos ou inválidos são ignorados com segurança.
  }
}

function refreshEntriesFromSave() {
  backfillSavedHistory();
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    Object.entries(saved?.pokedex || {}).forEach(([id, entry]) => mergeEntry(Number(id), entry));
    shinyHistory.forEach((id) => mergeEntry(id, { seen: 1, shinySeen: 1 }));
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
    || shinyHistory.has(pokemonId)
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

function observeScene() {
  const scene = document.querySelector("#scene");
  if (!scene || scene === observedScene) return Boolean(scene);
  sceneObserver?.disconnect();
  observedScene = scene;
  sceneObserver = new MutationObserver(scheduleShinyScan);
  sceneObserver.observe(scene, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src", "class", "hidden"]
  });
  scheduleShinyScan();
  return true;
}

function start() {
  refreshEntriesFromSave();
  observeGrid();
  observeScene();

  document.querySelector("#pokedex-button")?.addEventListener("click", scheduleDecorate);
  window.addEventListener(SEEN_EVENT, (event) => {
    const id = Number(event.detail?.pokemonId);
    const entry = event.detail?.entry || {};
    if (id) {
      mergeEntry(id, entry);
      persistEntryToSave(id, entry);
      if (event.detail?.isShiny || Number(entry.shinySeen) > 0) rememberShiny(id, entry);
    }
    scheduleDecorate();
  });
  window.addEventListener("storage", (event) => {
    if (event.key !== SAVE_KEY && event.key !== SHINY_HISTORY_KEY) return;
    shinyHistory = readShinyHistory();
    refreshEntriesFromSave();
    scheduleDecorate();
  });

  const pageObserver = new MutationObserver(() => {
    observeGrid();
    observeScene();
  });
  pageObserver.observe(document.body, { childList: true, subtree: true });
}

backfillSavedHistory();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
