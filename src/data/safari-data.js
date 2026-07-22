import { species, uniqueSpecies } from "./worlds-core.js";

export const SAFARI_ENTRY_PRICE = 5000;
export const SAFARI_DURATION_MS = 15 * 60 * 1000;
export const SAFARI_BALLS_PER_SESSION = 30;
export const SAFARI_CAPTURE_CHANCE = 35;
export const SAFARI_SHINY_CHANCE = 1 / 128;
export const SAFARI_XP_MULTIPLIER = 0.25;

const safariSpecies = (id, name, type, rarity = "rare", safariTier = "rare") => ({
  ...species(id, name, type, 3, rarity),
  safariExclusive: true,
  safariTier
});

const ENTRIES = {
  audino: safariSpecies(531, "Audino", "Normal", "uncommon", "uncommon"),
  farfetchd: safariSpecies(83, "Farfetch'd", "Normal/Voador", "uncommon", "uncommon"),
  chansey: safariSpecies(113, "Chansey", "Normal", "rare", "rare"),
  miltank: safariSpecies(241, "Miltank", "Normal", "rare", "rare"),
  kangaskhan: safariSpecies(115, "Kangaskhan", "Normal", "epic", "epic"),
  tauros: safariSpecies(128, "Tauros", "Normal", "epic", "ultra"),
  ditto: safariSpecies(132, "Ditto", "Normal", "epic", "special"),

  heracross: safariSpecies(214, "Heracross", "Inseto/Lutador", "uncommon", "uncommon"),
  pinsir: safariSpecies(127, "Pinsir", "Inseto", "uncommon", "uncommon"),
  scyther: safariSpecies(123, "Scyther", "Inseto/Voador", "rare", "rare"),
  tropius: safariSpecies(357, "Tropius", "Planta/Voador", "rare", "rare"),
  zorua: safariSpecies(570, "Zorua", "Sombrio", "epic", "epic"),
  larvesta: safariSpecies(636, "Larvesta", "Inseto/Fogo", "epic", "ultra"),
  kecleon: safariSpecies(352, "Kecleon", "Normal", "epic", "special"),

  feebas: safariSpecies(349, "Feebas", "Água", "uncommon", "uncommon"),
  dratini: safariSpecies(147, "Dratini", "Dragão", "uncommon", "uncommon"),
  lapras: safariSpecies(131, "Lapras", "Água/Gelo", "rare", "rare"),
  clamperl: safariSpecies(366, "Clamperl", "Água", "rare", "rare"),
  milotic: safariSpecies(350, "Milotic", "Água", "epic", "epic"),
  kingdra: safariSpecies(230, "Kingdra", "Água/Dragão", "epic", "ultra"),
  phione: safariSpecies(489, "Phione", "Água", "mythical", "special"),

  riolu: safariSpecies(447, "Riolu", "Lutador", "uncommon", "uncommon"),
  axew: safariSpecies(610, "Axew", "Dragão", "uncommon", "uncommon"),
  larvitar: safariSpecies(246, "Larvitar", "Pedra/Terra", "rare", "rare"),
  beldum: safariSpecies(374, "Beldum", "Aço/Psíquico", "rare", "rare"),
  gible: safariSpecies(443, "Gible", "Dragão/Terra", "epic", "epic"),
  jangmoo: safariSpecies(782, "Jangmo-o", "Dragão", "epic", "ultra"),
  duraludon: safariSpecies(884, "Duraludon", "Aço/Dragão", "epic", "special"),

  unown: safariSpecies(201, "Unown", "Psíquico", "uncommon", "uncommon"),
  duskull: safariSpecies(355, "Duskull", "Fantasma", "uncommon", "uncommon"),
  spiritomb: safariSpecies(442, "Spiritomb", "Fantasma/Sombrio", "rare", "rare"),
  rotom: safariSpecies(479, "Rotom", "Elétrico/Fantasma", "rare", "rare"),
  dusknoir: safariSpecies(477, "Dusknoir", "Fantasma", "epic", "epic"),
  zoroark: safariSpecies(571, "Zoroark", "Sombrio", "epic", "ultra"),
  gimmighoul: safariSpecies(999, "Gimmighoul", "Fantasma", "epic", "special")
};

const weighted = (pokemon, weight) => ({ pokemon, weight });

export const SAFARI_HABITATS = [
  {
    id: "campo-aberto",
    name: "Campo Aberto",
    types: "Normal · Fada · Voador",
    description: "Planícies tranquilas com espécies raras e muito difíceis de encontrar nas rotas.",
    encounters: [
      weighted(ENTRIES.audino, 25), weighted(ENTRIES.farfetchd, 20),
      weighted(ENTRIES.chansey, 18), weighted(ENTRIES.miltank, 12),
      weighted(ENTRIES.kangaskhan, 16), weighted(ENTRIES.tauros, 7), weighted(ENTRIES.ditto, 2)
    ]
  },
  {
    id: "selva",
    name: "Selva",
    types: "Planta · Inseto · Veneno",
    description: "Vegetação fechada com Pokémon velozes, exóticos e excelentes para coleção.",
    encounters: [
      weighted(ENTRIES.heracross, 25), weighted(ENTRIES.pinsir, 20),
      weighted(ENTRIES.scyther, 15), weighted(ENTRIES.tropius, 15),
      weighted(ENTRIES.zorua, 16), weighted(ENTRIES.larvesta, 7), weighted(ENTRIES.kecleon, 2)
    ]
  },
  {
    id: "lago-safari",
    name: "Lago Safari",
    types: "Água · Gelo · Dragão",
    description: "Águas profundas onde espécies aquáticas raras aparecem longe das praias comuns.",
    encounters: [
      weighted(ENTRIES.feebas, 25), weighted(ENTRIES.dratini, 20),
      weighted(ENTRIES.lapras, 18), weighted(ENTRIES.clamperl, 12),
      weighted(ENTRIES.milotic, 16), weighted(ENTRIES.kingdra, 7), weighted(ENTRIES.phione, 2)
    ]
  },
  {
    id: "desfiladeiro",
    name: "Desfiladeiro",
    types: "Pedra · Terra · Lutador · Dragão",
    description: "Uma área rochosa com filhotes de pseudo-lendários e combatentes resistentes.",
    encounters: [
      weighted(ENTRIES.riolu, 25), weighted(ENTRIES.axew, 20),
      weighted(ENTRIES.larvitar, 15), weighted(ENTRIES.beldum, 15),
      weighted(ENTRIES.gible, 16), weighted(ENTRIES.jangmoo, 7), weighted(ENTRIES.duraludon, 2)
    ]
  },
  {
    id: "ruinas-antigas",
    name: "Ruínas Antigas",
    types: "Psíquico · Fantasma · Sombrio",
    description: "Ruínas misteriosas com aparições incomuns e encontros especiais.",
    encounters: [
      weighted(ENTRIES.unown, 25), weighted(ENTRIES.duskull, 20),
      weighted(ENTRIES.spiritomb, 15), weighted(ENTRIES.rotom, 15),
      weighted(ENTRIES.dusknoir, 16), weighted(ENTRIES.zoroark, 7), weighted(ENTRIES.gimmighoul, 2)
    ]
  }
];

export const SAFARI_SPECIES = uniqueSpecies(
  SAFARI_HABITATS.flatMap((habitat) => habitat.encounters.map((entry) => entry.pokemon))
);

export function getSafariHabitat(habitatId) {
  return SAFARI_HABITATS.find((habitat) => habitat.id === String(habitatId || "")) || null;
}

export function chooseSafariEncounter(habitatId, random = Math.random) {
  const habitat = getSafariHabitat(habitatId) || SAFARI_HABITATS[0];
  const totalWeight = habitat.encounters.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * totalWeight;
  for (const entry of habitat.encounters) {
    roll -= entry.weight;
    if (roll < 0) return { ...entry.pokemon, safariHabitatId: habitat.id, safariHabitatName: habitat.name };
  }
  const fallback = habitat.encounters[0].pokemon;
  return { ...fallback, safariHabitatId: habitat.id, safariHabitatName: habitat.name };
}
