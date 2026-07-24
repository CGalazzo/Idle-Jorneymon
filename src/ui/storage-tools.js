import "../styles/storage-tools.css";

const SAVE_KEY = "idle-jorneymon-save";
const FAVORITES_KEY = "idle-jorneymon-storage-favorites";

const RARITY_ORDER = {
  starter: 0,
  common: 1,
  uncommon: 2,
  rare: 3,
  epic: 4,
  legendary: 5,
  mythical: 6
};

const RARITY_LABELS = {
  starter: "Inicial",
  common: "Comum",
  uncommon: "Incomum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythical: "Mítico"
};

const TYPE_OPTIONS = [
  ["normal", "Normal"], ["fire", "Fogo"], ["water", "Água"], ["grass", "Planta"],
  ["electric", "Elétrico"], ["ice", "Gelo"], ["fighting", "Lutador"], ["poison", "Veneno"],
  ["ground", "Terra"], ["flying", "Voador"], ["psychic", "Psíquico"], ["bug", "Inseto"],
  ["rock", "Pedra"], ["ghost", "Fantasma"], ["dragon", "Dragão"], ["dark", "Sombrio"],
  ["steel", "Aço"], ["fairy", "Fada"]
];

let storageObserver = null;
let applyScheduled = false;

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function readSave() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || "null") || {};
  } catch (error) {
    console.warn("Idle Jorneymon: não foi possível ler o depósito para aplicar os filtros.", error);
    return {};
  }
}

function readFavorites() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
    return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
  } catch {
    return new Set();
  }
}

function writeFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
}

function pokemonTypes(pokemon) {
  const types = Array.isArray(pokemon?.types) && pokemon.types.length
    ? pokemon.types
    : String(pokemon?.type || "Normal").split("/");
  return types.map((type) => normalizeText(type)).filter(Boolean);
}

function pokemonOrigin(pokemon) {
  if (pokemon?.capturedInChampionsHall) return "champions";
  if (pokemon?.capturedInSafari) return "safari";
  if (pokemon?.capturedInHard) return "hard";
  return "journey";
}

function originLabel(origin) {
  if (origin === "champions") return "Salão dos Campeões";
  if (origin === "safari") return "Zona Safari";
  if (origin === "hard") return "Modo Hard";
  return "Jornada";
}

function pokemonPower(pokemon) {
  return ["maxHp", "attack", "defense", "specialAttack", "specialDefense", "speed"]
    .reduce((total, key) => total + Math.max(0, Number(pokemon?.[key]) || 0), 0);
}

function toolbarMarkup() {
  const typeOptions = TYPE_OPTIONS.map(([value, label]) => `<option value="${value}">${label}</option>`).join("");
  return `
    <div id="storage-tools" class="storage-tools">
      <label class="storage-search-field">
        <span>Buscar Pokémon</span>
        <input id="storage-search" type="search" placeholder="Digite o nome do Pokémon..." autocomplete="off" />
      </label>
      <div class="storage-filter-grid">
        <label><span>Tipo</span><select id="storage-type-filter"><option value="all">Todos os tipos</option>${typeOptions}</select></label>
        <label><span>Raridade</span><select id="storage-rarity-filter">
          <option value="all">Todas as raridades</option>
          <option value="common">Comum</option>
          <option value="uncommon">Incomum</option>
          <option value="rare">Raro</option>
          <option value="epic">Épico</option>
          <option value="legendary">Lendário</option>
          <option value="mythical">Mítico</option>
          <option value="starter">Inicial</option>
        </select></label>
        <label><span>Origem</span><select id="storage-origin-filter">
          <option value="all">Todas as origens</option>
          <option value="journey">Jornada</option>
          <option value="hard">Modo Hard</option>
          <option value="safari">Zona Safari</option>
          <option value="champions">Salão dos Campeões</option>
        </select></label>
        <label><span>Ordenar</span><select id="storage-sort">
          <option value="recent">Capturados recentemente</option>
          <option value="favorites">Favoritos primeiro</option>
          <option value="name">Nome de A a Z</option>
          <option value="level">Maior nível</option>
          <option value="rarity">Maior raridade</option>
          <option value="power">Maior poder total</option>
        </select></label>
      </div>
      <div class="storage-filter-actions">
        <label class="storage-check"><input id="storage-shiny-only" type="checkbox" /><span>Apenas Shiny</span></label>
        <label class="storage-check"><input id="storage-favorites-only" type="checkbox" /><span>Apenas favoritos</span></label>
        <button id="storage-clear-filters" type="button">Limpar filtros</button>
      </div>
      <div id="storage-result-count" class="storage-result-count">Exibindo 0 de 0 Pokémon</div>
    </div>`;
}

function ensureToolbar() {
  const storageSection = document.querySelector("#team-dialog .storage-section");
  const storageList = document.querySelector("#storage-list");
  if (!storageSection || !storageList) return false;

  if (!document.querySelector("#storage-tools")) {
    storageList.insertAdjacentHTML("beforebegin", toolbarMarkup());
    installToolbarListeners();
  }
  return true;
}

function currentFilters() {
  return {
    search: normalizeText(document.querySelector("#storage-search")?.value),
    type: document.querySelector("#storage-type-filter")?.value || "all",
    rarity: document.querySelector("#storage-rarity-filter")?.value || "all",
    origin: document.querySelector("#storage-origin-filter")?.value || "all",
    sort: document.querySelector("#storage-sort")?.value || "recent",
    shinyOnly: Boolean(document.querySelector("#storage-shiny-only")?.checked),
    favoritesOnly: Boolean(document.querySelector("#storage-favorites-only")?.checked)
  };
}

function decorateCard(card, pokemon, favorite) {
  if (!pokemon) return;
  card.dataset.storageUid = String(pokemon.uid || "");
  card.classList.toggle("storage-favorite", favorite);

  const info = card.querySelector(".team-card-info");
  if (info) {
    let tags = info.querySelector(".storage-card-tags");
    if (!tags) {
      tags = document.createElement("div");
      tags.className = "storage-card-tags";
      info.appendChild(tags);
    }
    const rarity = RARITY_LABELS[pokemon.rarity] || "Comum";
    const origin = originLabel(pokemonOrigin(pokemon));
    tags.innerHTML = `<span>${rarity}</span><span>${origin}</span>${pokemon.isShiny ? "<span>✨ Shiny</span>" : ""}`;
  }

  const actions = card.querySelector(".team-card-actions");
  if (actions) {
    let favoriteButton = actions.querySelector("[data-storage-favorite]");
    if (!favoriteButton) {
      favoriteButton = document.createElement("button");
      favoriteButton.type = "button";
      favoriteButton.className = "storage-favorite-button";
      favoriteButton.dataset.storageFavorite = String(pokemon.uid || "");
      actions.prepend(favoriteButton);
    }
    favoriteButton.classList.toggle("selected", favorite);
    favoriteButton.setAttribute("aria-pressed", String(favorite));
    favoriteButton.title = favorite ? "Remover dos favoritos" : "Adicionar aos favoritos";
    favoriteButton.textContent = favorite ? "★ Favorito" : "☆ Favoritar";
  }
}

function matchesFilters(entry, filters, favorites) {
  const { pokemon } = entry;
  const uid = String(pokemon.uid || "");
  if (filters.search && !normalizeText(pokemon.name).includes(filters.search)) return false;
  if (filters.type !== "all" && !pokemonTypes(pokemon).includes(filters.type)) return false;
  if (filters.rarity !== "all" && String(pokemon.rarity || "common") !== filters.rarity) return false;
  if (filters.origin !== "all" && pokemonOrigin(pokemon) !== filters.origin) return false;
  if (filters.shinyOnly && !pokemon.isShiny) return false;
  if (filters.favoritesOnly && !favorites.has(uid)) return false;
  return true;
}

function sortEntries(entries, filters, favorites) {
  return entries.sort((a, b) => {
    const favoriteDifference = Number(favorites.has(String(b.pokemon.uid || ""))) - Number(favorites.has(String(a.pokemon.uid || "")));
    if (filters.sort === "favorites" && favoriteDifference) return favoriteDifference;
    if (filters.sort === "name") return String(a.pokemon.name || "").localeCompare(String(b.pokemon.name || ""), "pt-BR");
    if (filters.sort === "level") return (Number(b.pokemon.level) || 0) - (Number(a.pokemon.level) || 0) || a.originalIndex - b.originalIndex;
    if (filters.sort === "rarity") return (RARITY_ORDER[b.pokemon.rarity] || 0) - (RARITY_ORDER[a.pokemon.rarity] || 0) || (Number(b.pokemon.level) || 0) - (Number(a.pokemon.level) || 0);
    if (filters.sort === "power") return pokemonPower(b.pokemon) - pokemonPower(a.pokemon) || (Number(b.pokemon.level) || 0) - (Number(a.pokemon.level) || 0);
    return b.originalIndex - a.originalIndex;
  });
}

function observeStorageList(storageList) {
  if (!storageObserver) storageObserver = new MutationObserver(() => scheduleApply());
  storageObserver.disconnect();
  storageObserver.observe(storageList, { childList: true });
}

function applyStorageView() {
  applyScheduled = false;
  if (!ensureToolbar()) return;

  const storageList = document.querySelector("#storage-list");
  if (!storageList) return;
  const save = readSave();
  const savedStorage = Array.isArray(save.storage) ? save.storage : [];
  const favorites = readFavorites();
  const filters = currentFilters();
  const pokemonByUid = new Map(savedStorage.map((pokemon, index) => [String(pokemon.uid || ""), { pokemon, originalIndex: index }]));

  const cards = [...storageList.querySelectorAll(":scope > .team-card")];
  const entries = cards.map((card, fallbackIndex) => {
    const uid = String(card.querySelector("[data-add-team]")?.dataset.addTeam || card.dataset.storageUid || "");
    const savedEntry = pokemonByUid.get(uid);
    const pokemon = savedEntry?.pokemon || { uid, name: card.querySelector(".team-card-info strong")?.textContent || "", level: 0, rarity: "common", type: "Normal" };
    return { card, pokemon, originalIndex: savedEntry?.originalIndex ?? fallbackIndex };
  });

  entries.forEach(({ card, pokemon }) => decorateCard(card, pokemon, favorites.has(String(pokemon.uid || ""))));
  const visibleEntries = sortEntries(entries.filter((entry) => matchesFilters(entry, filters, favorites)), filters, favorites);
  const visibleCards = new Set(visibleEntries.map((entry) => entry.card));

  storageObserver?.disconnect();
  storageList.querySelector(".storage-filter-empty")?.remove();
  entries.forEach(({ card }) => { card.hidden = !visibleCards.has(card); });
  visibleEntries.forEach(({ card }) => storageList.appendChild(card));

  if (savedStorage.length > 0 && visibleEntries.length === 0) {
    storageList.insertAdjacentHTML("beforeend", '<div class="storage-filter-empty">Nenhum Pokémon corresponde aos filtros escolhidos.</div>');
  }

  const result = document.querySelector("#storage-result-count");
  if (result) result.textContent = `Exibindo ${visibleEntries.length} de ${savedStorage.length} Pokémon`;
  observeStorageList(storageList);
}

function scheduleApply() {
  if (applyScheduled) return;
  applyScheduled = true;
  requestAnimationFrame(applyStorageView);
}

function clearFilters() {
  const search = document.querySelector("#storage-search");
  const type = document.querySelector("#storage-type-filter");
  const rarity = document.querySelector("#storage-rarity-filter");
  const origin = document.querySelector("#storage-origin-filter");
  const sort = document.querySelector("#storage-sort");
  const shiny = document.querySelector("#storage-shiny-only");
  const favorites = document.querySelector("#storage-favorites-only");
  if (search) search.value = "";
  if (type) type.value = "all";
  if (rarity) rarity.value = "all";
  if (origin) origin.value = "all";
  if (sort) sort.value = "recent";
  if (shiny) shiny.checked = false;
  if (favorites) favorites.checked = false;
  scheduleApply();
}

function installToolbarListeners() {
  document.querySelector("#storage-search")?.addEventListener("input", scheduleApply);
  ["#storage-type-filter", "#storage-rarity-filter", "#storage-origin-filter", "#storage-sort", "#storage-shiny-only", "#storage-favorites-only"]
    .forEach((selector) => document.querySelector(selector)?.addEventListener("change", scheduleApply));
  document.querySelector("#storage-clear-filters")?.addEventListener("click", clearFilters);
}

function toggleFavorite(uid) {
  if (!uid) return;
  const favorites = readFavorites();
  if (favorites.has(uid)) favorites.delete(uid);
  else favorites.add(uid);
  writeFavorites(favorites);
  scheduleApply();
}

function installGlobalListeners() {
  document.addEventListener("click", (event) => {
    const favoriteButton = event.target.closest("[data-storage-favorite]");
    if (favoriteButton) {
      event.preventDefault();
      event.stopPropagation();
      toggleFavorite(String(favoriteButton.dataset.storageFavorite || ""));
      return;
    }
    if (event.target.closest("#team-button")) window.setTimeout(scheduleApply, 0);
  }, true);
}

function bootStorageTools() {
  installGlobalListeners();
  if (ensureToolbar()) {
    scheduleApply();
    return;
  }

  const appObserver = new MutationObserver(() => {
    if (!ensureToolbar()) return;
    appObserver.disconnect();
    scheduleApply();
  });
  appObserver.observe(document.documentElement, { childList: true, subtree: true });
}

bootStorageTools();
