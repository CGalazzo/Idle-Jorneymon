import { addLog } from "../core/game-state.js";
import {
  buildMoveSet,
  calculatePokemonStats,
  getOfficialBaseStats,
  parseTypes
} from "../data/battle-data.js";
import {
  FORM_ITEMS,
  getFormItem,
  getFormItemForm,
  getFormItemsForSpecies
} from "../data/form-items-data.js";
import {
  SHINY_STAT_MULTIPLIER,
  getPokemonSpriteUrls,
  recalculatePokemonForLevel
} from "../data/pokemon.js";
import { normalizeShopState } from "../data/shop-data.js";
import { isLegendaryMegaUnlocked, isSpeciesOwned } from "./shop.js";

const FORM_SNAPSHOT_KEYS = [
  "name",
  "type",
  "types",
  "baseStats",
  "maxHp",
  "attack",
  "defense",
  "specialAttack",
  "specialDefense",
  "speed",
  "sprite",
  "backSprite",
  "moves",
  "heightDm"
];

function ensureShopState(state) {
  state.shop = normalizeShopState(state.shop);
  return state.shop;
}

function applyShinyBonus(stats, isShiny) {
  if (!isShiny) return stats;
  return Object.fromEntries(
    Object.entries(stats).map(([key, value]) => [
      key,
      Math.max(1, Math.round((Number(value) || 1) * SHINY_STAT_MULTIPLIER))
    ])
  );
}

function createFormSnapshot(pokemon) {
  return Object.fromEntries(FORM_SNAPSHOT_KEYS.map((key) => [key, pokemon[key]]));
}

function fallbackFormTemplate(pokemon) {
  const base = pokemon.baseStats || {};
  return {
    rarity: "legendary",
    baseHp: Math.max(20, Math.round((Number(base.hp) || 100) / 2)),
    attack: Math.max(8, Math.round((Number(base.attack) || 100) / 5)),
    defense: Math.max(8, Math.round((Number(base.defense) || 100) / 5))
  };
}

function findRosterPokemon(state, pokemonUid) {
  return [...(state.team || []), ...(state.storage || [])]
    .find((pokemon) => pokemon.uid === String(pokemonUid || "")) || null;
}

function applyFormDefinition(pokemon, item, form, { preserveHpRatio = true } = {}) {
  const previousHp = Math.max(0, Number(pokemon.hp) || 0);
  const previousMaxHp = Math.max(1, Number(pokemon.maxHp) || 1);
  const hpRatio = previousHp / previousMaxHp;
  const formBaseStats = getOfficialBaseStats(form.formId, fallbackFormTemplate(pokemon));
  const calculated = applyShinyBonus(
    calculatePokemonStats(formBaseStats, pokemon.level, pokemon.iv),
    Boolean(pokemon.isShiny)
  );
  const sprites = getPokemonSpriteUrls(form.formId, Boolean(pokemon.isShiny));

  pokemon.formItemOriginal = createFormSnapshot(pokemon);
  Object.assign(pokemon, {
    name: form.formName,
    type: form.type,
    types: parseTypes(form.type),
    baseStats: formBaseStats,
    ...calculated,
    hp: preserveHpRatio
      ? Math.max(previousHp > 0 ? 1 : 0, Math.min(calculated.maxHp, Math.round(calculated.maxHp * hpRatio)))
      : Math.min(previousHp, calculated.maxHp),
    sprite: sprites.sprite,
    backSprite: sprites.backSprite,
    moves: buildMoveSet(form.type, formBaseStats),
    isFormItemActive: true,
    formItemFormId: form.formId,
    activeFormItemId: item.id
  });
  return true;
}

export function deactivateFormItem(pokemon) {
  if (!pokemon?.isFormItemActive || !pokemon.formItemOriginal) return false;
  const currentHp = Math.max(0, Number(pokemon.hp) || 0);
  const currentMaxHp = Math.max(1, Number(pokemon.maxHp) || 1);
  const hpRatio = currentHp / currentMaxHp;
  const snapshot = pokemon.formItemOriginal;
  Object.assign(pokemon, snapshot);
  pokemon.hp = Math.max(
    currentHp > 0 ? 1 : 0,
    Math.min(Number(pokemon.maxHp) || 1, Math.round((Number(pokemon.maxHp) || 1) * hpRatio))
  );
  delete pokemon.isFormItemActive;
  delete pokemon.formItemFormId;
  delete pokemon.activeFormItemId;
  delete pokemon.formItemOriginal;
  return true;
}

export function isFormItemShopUnlocked(state) {
  return isLegendaryMegaUnlocked(state);
}

export function getVisibleFormItems(state) {
  return FORM_ITEMS.filter((item) => item.forms.some((form) => isSpeciesOwned(state, form.baseSpeciesId)));
}

export function buyFormItem(state, itemId) {
  const shop = ensureShopState(state);
  const item = getFormItem(itemId);
  if (!item || !isFormItemShopUnlocked(state)) return false;
  if (!item.forms.some((form) => isSpeciesOwned(state, form.baseSpeciesId))) return false;
  if (shop.ownedFormItems.includes(item.id)) return false;
  if (shop.coins < item.price) return false;

  shop.coins -= item.price;
  shop.totalCoinsSpent += item.price;
  shop.ownedFormItems.push(item.id);
  addLog(state, `${item.name} foi comprado e adicionado aos Itens.`);
  return true;
}

export function equipFormItem(state, itemId, pokemonUid) {
  if (state.mode === "battle") return false;
  const shop = ensureShopState(state);
  const item = getFormItem(itemId);
  const pokemon = (state.team || []).find((member) => member.uid === String(pokemonUid || ""));
  const form = item && pokemon ? getFormItemForm(item.id, pokemon.id) : null;
  if (!item || !pokemon || !form || !shop.ownedFormItems.includes(item.id)) return false;

  const currentUid = shop.equippedFormItems[item.id];
  if (currentUid === pokemon.uid && pokemon.activeFormItemId === item.id) {
    deactivateFormItem(pokemon);
    delete shop.equippedFormItems[item.id];
    addLog(state, `${item.name} foi retirado de ${form.baseName}. A forma normal foi restaurada.`);
    return true;
  }

  if (pokemon.activeFormItemId) {
    delete shop.equippedFormItems[pokemon.activeFormItemId];
    deactivateFormItem(pokemon);
  }

  if (currentUid && currentUid !== pokemon.uid) {
    const previousPokemon = findRosterPokemon(state, currentUid);
    if (previousPokemon) deactivateFormItem(previousPokemon);
    delete shop.equippedFormItems[item.id];
  }

  applyFormDefinition(pokemon, item, form, { preserveHpRatio: true });
  shop.equippedFormItems[item.id] = pokemon.uid;
  addLog(state, `${item.name} foi usado em ${form.baseName}. ${form.formName} foi ativado!`);
  return true;
}

export function clearFormEquipmentForPokemon(state, pokemonUid) {
  const shop = ensureShopState(state);
  const uid = String(pokemonUid || "");
  const pokemon = findRosterPokemon(state, uid);
  let changed = false;

  Object.entries(shop.equippedFormItems).forEach(([itemId, equippedUid]) => {
    if (equippedUid !== uid) return;
    delete shop.equippedFormItems[itemId];
    changed = true;
  });
  if (pokemon && deactivateFormItem(pokemon)) changed = true;
  return changed;
}

export function restorePersistedFormPokemon(pokemon) {
  if (!pokemon?.isFormItemActive || !pokemon.formItemOriginal) return pokemon;
  const currentHp = Math.max(0, Number(pokemon.hp) || 0);
  const currentMaxHp = Math.max(1, Number(pokemon.maxHp) || 1);
  const hpRatio = currentHp / currentMaxHp;
  const restored = { ...pokemon, ...pokemon.formItemOriginal };
  restored.hp = Math.max(
    currentHp > 0 ? 1 : 0,
    Math.min(Number(restored.maxHp) || 1, Math.round((Number(restored.maxHp) || 1) * hpRatio))
  );
  delete restored.isFormItemActive;
  delete restored.formItemFormId;
  delete restored.activeFormItemId;
  delete restored.formItemOriginal;
  return restored;
}

export function restoreEquippedFormItems(shop, team) {
  const clean = {};
  const assignedPokemon = new Set();
  Object.entries(shop.equippedFormItems || {}).forEach(([itemId, pokemonUid]) => {
    const item = getFormItem(itemId);
    const pokemon = (team || []).find((member) => member.uid === pokemonUid);
    const form = item && pokemon ? getFormItemForm(item.id, pokemon.id) : null;
    const valid = item
      && pokemon
      && form
      && shop.ownedFormItems.includes(item.id)
      && !assignedPokemon.has(pokemon.uid);
    if (!valid) return;
    applyFormDefinition(pokemon, item, form, { preserveHpRatio: true });
    clean[item.id] = pokemon.uid;
    assignedPokemon.add(pokemon.uid);
  });
  shop.equippedFormItems = clean;
  return shop;
}

export function recalculateActiveFormItemForLevel(pokemon, heal = true) {
  const itemId = pokemon?.activeFormItemId;
  const item = getFormItem(itemId);
  const form = item ? getFormItemForm(item.id, pokemon.id) : null;
  if (!item || !form || !pokemon.formItemOriginal) return recalculatePokemonForLevel(pokemon, heal);

  deactivateFormItem(pokemon);
  recalculatePokemonForLevel(pokemon, heal);
  applyFormDefinition(pokemon, item, form, { preserveHpRatio: true });
  return pokemon;
}

export function getOwnedFormItemsForSpecies(state, speciesId) {
  const owned = new Set(state.shop?.ownedFormItems || []);
  return getFormItemsForSpecies(speciesId).filter((item) => owned.has(item.id));
}
