import "../styles/pokedex-search.css";
import { COMPLETE_POKEDEX_SPECIES } from "../data/pokedex-data.js";

const pokemonNames = new Map(
  COMPLETE_POKEDEX_SPECIES.map((pokemon) => [Number(pokemon.id), pokemon.name])
);

function normalize(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function cardPokemonId(card) {
  const copy = card.querySelector(".dex-number")?.textContent || "";
  const value = Number(copy.replace(/\D/g, ""));
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function decorateCards(grid) {
  grid.querySelectorAll(":scope > .dex-card").forEach((card) => {
    const id = cardPokemonId(card);
    const name = pokemonNames.get(id) || card.querySelector("strong")?.textContent || "";
    card.dataset.pokemonName = normalize(name);
    card.dataset.pokemonNumber = String(id);
    card.dataset.pokemonDisplayName = name;
  });
}

function applyFilter(dialog) {
  const input = dialog.querySelector("#pokedex-search-input");
  const grid = dialog.querySelector("#pokedex-grid");
  const empty = dialog.querySelector("#pokedex-search-empty");
  const clearButton = dialog.querySelector("#clear-pokedex-search");
  if (!input || !grid || !empty) return;

  decorateCards(grid);
  const query = normalize(input.value);
  let visible = 0;

  grid.querySelectorAll(":scope > .dex-card").forEach((card) => {
    const matches = !query
      || card.dataset.pokemonName.includes(query)
      || card.dataset.pokemonNumber === query.replace(/^#/, "");
    card.hidden = !matches;
    if (matches) visible += 1;
  });

  empty.hidden = !query || visible > 0;
  if (clearButton) clearButton.hidden = !input.value;
}

function installPokedexSearch(dialog) {
  if (dialog.dataset.searchInstalled === "true") return;
  const summary = dialog.querySelector(".pokedex-summary");
  const grid = dialog.querySelector("#pokedex-grid");
  if (!summary || !grid) return;

  summary.insertAdjacentHTML("afterend", `
    <div class="pokedex-search-wrap">
      <label class="pokedex-search-box" for="pokedex-search-input">
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <circle cx="11" cy="11" r="6.5"></circle>
          <path d="m16 16 4.25 4.25"></path>
        </svg>
        <input id="pokedex-search-input" type="search" placeholder="Pesquisar Pokémon" aria-label="Pesquisar Pokémon pelo nome" autocomplete="off" autocapitalize="off" spellcheck="false" />
        <button id="clear-pokedex-search" type="button" aria-label="Limpar pesquisa" hidden>×</button>
      </label>
      <p id="pokedex-search-empty" class="pokedex-search-empty" role="status" hidden>Nenhum Pokémon encontrado.</p>
    </div>`);

  const input = dialog.querySelector("#pokedex-search-input");
  const clearButton = dialog.querySelector("#clear-pokedex-search");

  input.addEventListener("input", () => applyFilter(dialog));
  clearButton.addEventListener("click", () => {
    input.value = "";
    applyFilter(dialog);
    input.focus();
  });

  dialog.addEventListener("close", () => {
    input.value = "";
    applyFilter(dialog);
  });

  const gridObserver = new MutationObserver(() => applyFilter(dialog));
  gridObserver.observe(grid, { childList: true });

  dialog.dataset.searchInstalled = "true";
  applyFilter(dialog);
}

function start() {
  const install = () => {
    const dialog = document.querySelector("#pokedex-dialog");
    if (!dialog) return false;
    installPokedexSearch(dialog);
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
