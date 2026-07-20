import { addLog } from "../core/game-state.js";
import {
  buildMoveSet,
  calculatePokemonStats,
  getOfficialBaseStats,
  parseTypes
} from "../data/battle-data.js";
import { getMegaStone } from "../data/mega-data.js";
import { SHINY_STAT_MULTIPLIER, getPokemonSpriteUrls } from "../data/pokemon.js";
import { normalizeShopState } from "../data/shop-data.js";

const MEGA_SNAPSHOT_KEYS = [
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
    Object.entries(stats).map(([key, value]) => [key, Math.max(1, Math.round(value * SHINY_STAT_MULTIPLIER))])
  );
}

function createMegaSnapshot(pokemon) {
  return Object.fromEntries(MEGA_SNAPSHOT_KEYS.map((key) => [key, pokemon[key]]));
}

function fallbackMegaTemplate(pokemon) {
  const base = pokemon.baseStats || {};
  return {
    rarity: "epic",
    baseHp: Math.max(20, Math.round((Number(base.hp) || 50) / 2)),
    attack: Math.max(8, Math.round((Number(base.attack) || 60) * 1.2 / 5)),
    defense: Math.max(8, Math.round((Number(base.defense) || 60) * 1.2 / 5))
  };
}

export function equipMegaStone(state, stoneId, pokemonUid) {
  if (state.mode === "battle") return false;
  const shop = ensureShopState(state);
  const stone = getMegaStone(stoneId);
  const pokemon = (state.team || []).find((member) => member.uid === String(pokemonUid || ""));
  if (!stone || !pokemon || Number(pokemon.id) !== stone.baseSpeciesId) return false;
  if (!shop.ownedMegaStones.includes(stone.id)) return false;

  if (shop.equippedMegaStoneId === stone.id && shop.equippedMegaPokemonUid === pokemon.uid) {
    shop.equippedMegaStoneId = null;
    shop.equippedMegaPokemonUid = null;
    addLog(state, `${stone.name} foi desequipada de ${pokemon.name}.`);
    return true;
  }

  shop.equippedMegaStoneId = stone.id;
  shop.equippedMegaPokemonUid = pokemon.uid;
  addLog(state, `${stone.name} foi equipada em ${pokemon.name}. Apenas este Pokémon poderá Mega Evoluir.`);
  return true;
}

export function clearMegaEquipmentForPokemon(state, pokemonUid) {
  const shop = ensureShopState(state);
  if (shop.equippedMegaPokemonUid !== String(pokemonUid || "")) return false;
  shop.equippedMegaStoneId = null;
  shop.equippedMegaPokemonUid = null;
  return true;
}

export function activateEquippedMega(state, pokemon) {
  if (!pokemon || pokemon.isMega) return false;
  const shop = ensureShopState(state);
  if (shop.equippedMegaPokemonUid !== pokemon.uid) return false;

  const stone = getMegaStone(shop.equippedMegaStoneId);
  if (!stone || !shop.ownedMegaStones.includes(stone.id) || Number(pokemon.id) !== stone.baseSpeciesId) return false;

  const previousHp = Math.max(0, Number(pokemon.hp) || 0);
  const megaBaseStats = getOfficialBaseStats(stone.formId, fallbackMegaTemplate(pokemon));
  const calculated = applyShinyBonus(
    calculatePokemonStats(megaBaseStats, pokemon.level, pokemon.iv),
    Boolean(pokemon.isShiny)
  );
  const sprites = getPokemonSpriteUrls(stone.formId, Boolean(pokemon.isShiny));

  pokemon.megaOriginal = createMegaSnapshot(pokemon);
  Object.assign(pokemon, {
    name: stone.megaName,
    type: stone.type,
    types: parseTypes(stone.type),
    baseStats: megaBaseStats,
    ...calculated,
    hp: Math.min(previousHp, calculated.maxHp),
    sprite: sprites.sprite,
    backSprite: sprites.backSprite,
    moves: buildMoveSet(stone.type, megaBaseStats),
    isMega: true,
    megaFormId: stone.formId,
    activeMegaStoneId: stone.id
  });

  addLog(state, `${stone.name} reagiu! ${stone.baseName} Mega Evoluiu!`);
  return true;
}

export function deactivateMegaEvolution(pokemon) {
  if (!pokemon?.isMega || !pokemon.megaOriginal) return false;
  const remainingHp = Math.max(0, Number(pokemon.hp) || 0);
  const snapshot = pokemon.megaOriginal;
  Object.assign(pokemon, snapshot);
  pokemon.hp = Math.min(remainingHp, pokemon.maxHp);
  delete pokemon.isMega;
  delete pokemon.megaFormId;
  delete pokemon.activeMegaStoneId;
  delete pokemon.megaOriginal;
  return true;
}

export function deactivateAllMegaEvolutions(state) {
  let changed = false;
  [...(state.team || []), ...(state.storage || [])].forEach((pokemon) => {
    if (deactivateMegaEvolution(pokemon)) changed = true;
  });
  return changed;
}

export function restorePersistedMegaPokemon(pokemon) {
  if (!pokemon?.isMega || !pokemon.megaOriginal) return pokemon;
  const remainingHp = Math.max(0, Number(pokemon.hp) || 0);
  const restored = { ...pokemon, ...pokemon.megaOriginal };
  restored.hp = Math.min(remainingHp, Number(restored.maxHp) || remainingHp);
  delete restored.isMega;
  delete restored.megaFormId;
  delete restored.activeMegaStoneId;
  delete restored.megaOriginal;
  return restored;
}
