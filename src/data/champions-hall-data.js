import { species, uniqueSpecies } from "./worlds-core.js";

export const CHAMPIONS_HALL_CAPTURE_CHANCE = 5;
export const CHAMPIONS_HALL_LEVEL = 100;
export const CHAMPIONS_HALL_XP_MULTIPLIER = 0.25;
export const CHAMPIONS_HALL_BACKGROUND = "/assets/champions-hall.webp";

export function createInitialChampionsHallState() {
  return {
    active: false,
    unlocked: false,
    unlockCelebrationPending: false,
    unlockAcknowledged: false,
    originRuntime: null,
    encounters: 0,
    victories: 0,
    captures: 0
  };
}

export function normalizeChampionsHallState(value = {}) {
  const base = createInitialChampionsHallState();
  return {
    ...base,
    ...value,
    active: Boolean(value.active),
    unlocked: Boolean(value.unlocked),
    unlockCelebrationPending: Boolean(value.unlockCelebrationPending),
    unlockAcknowledged: Boolean(value.unlockAcknowledged),
    originRuntime: value.originRuntime && typeof value.originRuntime === "object" ? value.originRuntime : null,
    encounters: Math.max(0, Number(value.encounters) || 0),
    victories: Math.max(0, Number(value.victories) || 0),
    captures: Math.max(0, Number(value.captures) || 0)
  };
}

const championSpecies = (id, name, type, rarity = "legendary") => ({
  ...species(id, name, type, 3, rarity),
  championsHallExclusive: true,
  championsHallTier: rarity
});

export const CHAMPIONS_HALL_SPECIES = uniqueSpecies([
  championSpecies(144, "Articuno", "Gelo/Voador"),
  championSpecies(145, "Zapdos", "Elétrico/Voador"),
  championSpecies(146, "Moltres", "Fogo/Voador"),
  championSpecies(150, "Mewtwo", "Psíquico"),
  championSpecies(151, "Mew", "Psíquico", "mythical"),

  championSpecies(243, "Raikou", "Elétrico"),
  championSpecies(244, "Entei", "Fogo"),
  championSpecies(245, "Suicune", "Água"),
  championSpecies(249, "Lugia", "Psíquico/Voador"),
  championSpecies(250, "Ho-Oh", "Fogo/Voador"),
  championSpecies(251, "Celebi", "Psíquico/Planta", "mythical"),

  championSpecies(377, "Regirock", "Pedra"),
  championSpecies(378, "Regice", "Gelo"),
  championSpecies(379, "Registeel", "Aço"),
  championSpecies(380, "Latias", "Dragão/Psíquico"),
  championSpecies(381, "Latios", "Dragão/Psíquico"),
  championSpecies(382, "Kyogre", "Água"),
  championSpecies(383, "Groudon", "Terra"),
  championSpecies(384, "Rayquaza", "Dragão/Voador"),
  championSpecies(385, "Jirachi", "Aço/Psíquico", "mythical"),
  championSpecies(386, "Deoxys", "Psíquico", "mythical"),

  championSpecies(480, "Uxie", "Psíquico"),
  championSpecies(481, "Mesprit", "Psíquico"),
  championSpecies(482, "Azelf", "Psíquico"),
  championSpecies(483, "Dialga", "Aço/Dragão"),
  championSpecies(484, "Palkia", "Água/Dragão"),
  championSpecies(485, "Heatran", "Fogo/Aço"),
  championSpecies(486, "Regigigas", "Normal"),
  championSpecies(487, "Giratina", "Fantasma/Dragão"),
  championSpecies(488, "Cresselia", "Psíquico"),
  championSpecies(489, "Phione", "Água", "mythical"),
  championSpecies(490, "Manaphy", "Água", "mythical"),
  championSpecies(491, "Darkrai", "Sombrio", "mythical"),
  championSpecies(492, "Shaymin", "Planta", "mythical"),
  championSpecies(493, "Arceus", "Normal", "mythical"),

  championSpecies(494, "Victini", "Psíquico/Fogo", "mythical"),
  championSpecies(638, "Cobalion", "Aço/Lutador"),
  championSpecies(639, "Terrakion", "Pedra/Lutador"),
  championSpecies(640, "Virizion", "Planta/Lutador"),
  championSpecies(641, "Tornadus", "Voador"),
  championSpecies(642, "Thundurus", "Elétrico/Voador"),
  championSpecies(643, "Reshiram", "Dragão/Fogo"),
  championSpecies(644, "Zekrom", "Dragão/Elétrico"),
  championSpecies(645, "Landorus", "Terra/Voador"),
  championSpecies(646, "Kyurem", "Dragão/Gelo"),
  championSpecies(647, "Keldeo", "Água/Lutador", "mythical"),
  championSpecies(648, "Meloetta", "Normal/Psíquico", "mythical"),
  championSpecies(649, "Genesect", "Inseto/Aço", "mythical"),

  championSpecies(716, "Xerneas", "Fada"),
  championSpecies(717, "Yveltal", "Sombrio/Voador"),
  championSpecies(718, "Zygarde", "Dragão/Terra"),
  championSpecies(719, "Diancie", "Pedra/Fada", "mythical"),
  championSpecies(720, "Hoopa", "Psíquico/Fantasma", "mythical"),
  championSpecies(721, "Volcanion", "Fogo/Água", "mythical"),

  championSpecies(772, "Type: Null", "Normal"),
  championSpecies(773, "Silvally", "Normal"),
  championSpecies(785, "Tapu Koko", "Elétrico/Fada"),
  championSpecies(786, "Tapu Lele", "Psíquico/Fada"),
  championSpecies(787, "Tapu Bulu", "Planta/Fada"),
  championSpecies(788, "Tapu Fini", "Água/Fada"),
  championSpecies(789, "Cosmog", "Psíquico"),
  championSpecies(790, "Cosmoem", "Psíquico"),
  championSpecies(791, "Solgaleo", "Psíquico/Aço"),
  championSpecies(792, "Lunala", "Psíquico/Fantasma"),
  championSpecies(800, "Necrozma", "Psíquico"),
  championSpecies(801, "Magearna", "Aço/Fada", "mythical"),
  championSpecies(802, "Marshadow", "Lutador/Fantasma", "mythical"),
  championSpecies(807, "Zeraora", "Elétrico", "mythical"),
  championSpecies(808, "Meltan", "Aço", "mythical"),
  championSpecies(809, "Melmetal", "Aço", "mythical"),

  championSpecies(888, "Zacian", "Fada"),
  championSpecies(889, "Zamazenta", "Lutador"),
  championSpecies(890, "Eternatus", "Veneno/Dragão"),
  championSpecies(891, "Kubfu", "Lutador"),
  championSpecies(892, "Urshifu", "Lutador/Sombrio"),
  championSpecies(893, "Zarude", "Sombrio/Planta", "mythical"),
  championSpecies(894, "Regieleki", "Elétrico"),
  championSpecies(895, "Regidrago", "Dragão"),
  championSpecies(896, "Glastrier", "Gelo"),
  championSpecies(897, "Spectrier", "Fantasma"),
  championSpecies(898, "Calyrex", "Psíquico/Planta"),
  championSpecies(905, "Enamorus", "Fada/Voador"),

  championSpecies(1001, "Wo-Chien", "Sombrio/Planta"),
  championSpecies(1002, "Chien-Pao", "Sombrio/Gelo"),
  championSpecies(1003, "Ting-Lu", "Sombrio/Terra"),
  championSpecies(1004, "Chi-Yu", "Sombrio/Fogo"),
  championSpecies(1007, "Koraidon", "Lutador/Dragão"),
  championSpecies(1008, "Miraidon", "Elétrico/Dragão"),
  championSpecies(1014, "Okidogi", "Veneno/Lutador"),
  championSpecies(1015, "Munkidori", "Veneno/Psíquico"),
  championSpecies(1016, "Fezandipiti", "Veneno/Fada"),
  championSpecies(1017, "Ogerpon", "Planta"),
  championSpecies(1024, "Terapagos", "Normal"),
  championSpecies(1025, "Pecharunt", "Veneno/Fantasma", "mythical")
]);

export function chooseChampionsHallEncounter(random = Math.random) {
  const index = Math.min(CHAMPIONS_HALL_SPECIES.length - 1, Math.floor(random() * CHAMPIONS_HALL_SPECIES.length));
  return CHAMPIONS_HALL_SPECIES[Math.max(0, index)];
}
