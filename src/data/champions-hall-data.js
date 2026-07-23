import { species, uniqueSpecies } from "./worlds-core.js";

export const CHAMPIONS_HALL_CAPTURE_CHANCE = 5;
export const CHAMPIONS_HALL_LEVEL = 100;
export const CHAMPIONS_HALL_IV = 31;

const legendary = (id, name, type, rarity = "legendary") => ({
  ...species(id, name, type, 3, rarity),
  rarity,
  championsHallExclusive: true
});

export const CHAMPIONS_HALL_SPECIES = uniqueSpecies([
  legendary(144, "Articuno", "Gelo/Voador"), legendary(145, "Zapdos", "Elétrico/Voador"), legendary(146, "Moltres", "Fogo/Voador"), legendary(150, "Mewtwo", "Psíquico"), legendary(151, "Mew", "Psíquico", "mythical"),
  legendary(243, "Raikou", "Elétrico"), legendary(244, "Entei", "Fogo"), legendary(245, "Suicune", "Água"), legendary(249, "Lugia", "Psíquico/Voador"), legendary(250, "Ho-Oh", "Fogo/Voador"), legendary(251, "Celebi", "Psíquico/Planta", "mythical"),
  legendary(377, "Regirock", "Pedra"), legendary(378, "Regice", "Gelo"), legendary(379, "Registeel", "Aço"), legendary(380, "Latias", "Dragão/Psíquico"), legendary(381, "Latios", "Dragão/Psíquico"), legendary(382, "Kyogre", "Água"), legendary(383, "Groudon", "Terra"), legendary(384, "Rayquaza", "Dragão/Voador"), legendary(385, "Jirachi", "Aço/Psíquico", "mythical"), legendary(386, "Deoxys", "Psíquico", "mythical"),
  legendary(480, "Uxie", "Psíquico"), legendary(481, "Mesprit", "Psíquico"), legendary(482, "Azelf", "Psíquico"), legendary(483, "Dialga", "Aço/Dragão"), legendary(484, "Palkia", "Água/Dragão"), legendary(485, "Heatran", "Fogo/Aço"), legendary(486, "Regigigas", "Normal"), legendary(487, "Giratina", "Fantasma/Dragão"), legendary(488, "Cresselia", "Psíquico"), legendary(489, "Phione", "Água", "mythical"), legendary(490, "Manaphy", "Água", "mythical"), legendary(491, "Darkrai", "Sombrio", "mythical"), legendary(492, "Shaymin", "Planta", "mythical"), legendary(493, "Arceus", "Normal", "mythical"),
  legendary(638, "Cobalion", "Aço/Lutador"), legendary(639, "Terrakion", "Pedra/Lutador"), legendary(640, "Virizion", "Planta/Lutador"), legendary(641, "Tornadus", "Voador"), legendary(642, "Thundurus", "Elétrico/Voador"), legendary(643, "Reshiram", "Dragão/Fogo"), legendary(644, "Zekrom", "Dragão/Elétrico"), legendary(645, "Landorus", "Terra/Voador"), legendary(646, "Kyurem", "Dragão/Gelo"), legendary(647, "Keldeo", "Água/Lutador", "mythical"), legendary(648, "Meloetta", "Normal/Psíquico", "mythical"), legendary(649, "Genesect", "Inseto/Aço", "mythical"),
  legendary(716, "Xerneas", "Fada"), legendary(717, "Yveltal", "Sombrio/Voador"), legendary(718, "Zygarde", "Dragão/Terra"), legendary(719, "Diancie", "Pedra/Fada", "mythical"), legendary(720, "Hoopa", "Psíquico/Fantasma", "mythical"), legendary(721, "Volcanion", "Fogo/Água", "mythical"),
  legendary(772, "Type: Null", "Normal"), legendary(773, "Silvally", "Normal"), legendary(785, "Tapu Koko", "Elétrico/Fada"), legendary(786, "Tapu Lele", "Psíquico/Fada"), legendary(787, "Tapu Bulu", "Planta/Fada"), legendary(788, "Tapu Fini", "Água/Fada"), legendary(789, "Cosmog", "Psíquico"), legendary(790, "Cosmoem", "Psíquico"), legendary(791, "Solgaleo", "Psíquico/Aço"), legendary(792, "Lunala", "Psíquico/Fantasma"), legendary(800, "Necrozma", "Psíquico"), legendary(801, "Magearna", "Aço/Fada", "mythical"), legendary(802, "Marshadow", "Lutador/Fantasma", "mythical"), legendary(807, "Zeraora", "Elétrico", "mythical"), legendary(808, "Meltan", "Aço", "mythical"), legendary(809, "Melmetal", "Aço", "mythical"),
  legendary(888, "Zacian", "Fada"), legendary(889, "Zamazenta", "Lutador"), legendary(890, "Eternatus", "Veneno/Dragão"), legendary(891, "Kubfu", "Lutador"), legendary(892, "Urshifu", "Lutador/Sombrio"), legendary(893, "Zarude", "Sombrio/Planta", "mythical"), legendary(894, "Regieleki", "Elétrico"), legendary(895, "Regidrago", "Dragão"), legendary(896, "Glastrier", "Gelo"), legendary(897, "Spectrier", "Fantasma"), legendary(898, "Calyrex", "Psíquico/Planta"), legendary(905, "Enamorus", "Fada/Voador"),
  legendary(1001, "Wo-Chien", "Sombrio/Planta"), legendary(1002, "Chien-Pao", "Sombrio/Gelo"), legendary(1003, "Ting-Lu", "Sombrio/Terra"), legendary(1004, "Chi-Yu", "Sombrio/Fogo"), legendary(1007, "Koraidon", "Lutador/Dragão"), legendary(1008, "Miraidon", "Elétrico/Dragão"), legendary(1009, "Walking Wake", "Água/Dragão"), legendary(1010, "Iron Leaves", "Planta/Psíquico"), legendary(1014, "Okidogi", "Veneno/Lutador"), legendary(1015, "Munkidori", "Veneno/Psíquico"), legendary(1016, "Fezandipiti", "Veneno/Fada"), legendary(1017, "Ogerpon", "Planta"), legendary(1024, "Terapagos", "Normal"), legendary(1025, "Pecharunt", "Veneno/Fantasma", "mythical")
]);

export function chooseChampionsHallSpecies(random = Math.random) {
  const index = Math.floor(random() * CHAMPIONS_HALL_SPECIES.length);
  return CHAMPIONS_HALL_SPECIES[Math.max(0, Math.min(CHAMPIONS_HALL_SPECIES.length - 1, index))];
}
