import { species, uniqueSpecies } from "./worlds-core.js";

export const SAFARI_ENTRY_PRICE = 5000;
export const SAFARI_DURATION_MS = 15 * 60 * 1000;
export const SAFARI_BALLS_PER_SESSION = 30;
export const SAFARI_CAPTURE_CHANCE = 35;
export const SAFARI_SHINY_CHANCE = 1 / 128;
export const SAFARI_XP_MULTIPLIER = 0.25;

export function createInitialSafariState() {
  return {
    active: false,
    habitatId: null,
    startedAt: 0,
    expiresAt: 0,
    ballsRemaining: 0,
    encounters: 0,
    victories: 0,
    captures: 0,
    originRuntime: null,
    lastResult: null
  };
}

export function normalizeSafariState(value = {}) {
  const base = createInitialSafariState();
  return {
    ...base,
    ...value,
    active: Boolean(value.active),
    habitatId: getSafariHabitat(value.habitatId)?.id || null,
    startedAt: Math.max(0, Number(value.startedAt) || 0),
    expiresAt: Math.max(0, Number(value.expiresAt) || 0),
    ballsRemaining: Math.max(0, Math.min(SAFARI_BALLS_PER_SESSION, Number(value.ballsRemaining) || 0)),
    encounters: Math.max(0, Number(value.encounters) || 0),
    victories: Math.max(0, Number(value.victories) || 0),
    captures: Math.max(0, Number(value.captures) || 0),
    originRuntime: value.originRuntime || null,
    lastResult: value.lastResult || null
  };
}

const safariSpecies = (id, name, type, rarity = "rare", safariTier = "rare") => ({
  ...species(id, name, type, 3, rarity),
  safariExclusive: true,
  safariTier
});

const ENTRIES = {
  chansey: safariSpecies(113, "Chansey", "Normal"),
  miltank: safariSpecies(241, "Miltank", "Normal"),
  smeargle: safariSpecies(235, "Smeargle", "Normal"),
  furfrou: safariSpecies(676, "Furfrou", "Normal"),
  komala: safariSpecies(775, "Komala", "Normal"),
  kangaskhan: safariSpecies(115, "Kangaskhan", "Normal", "epic", "epic"),
  tauros: safariSpecies(128, "Tauros", "Normal", "epic", "epic"),
  bouffalant: safariSpecies(626, "Bouffalant", "Normal", "epic", "epic"),
  oricorio: safariSpecies(741, "Oricorio", "Fogo/Voador", "epic", "epic"),
  ditto: safariSpecies(132, "Ditto", "Normal", "epic", "special"),

  heracross: safariSpecies(214, "Heracross", "Inseto/Lutador"),
  pinsir: safariSpecies(127, "Pinsir", "Inseto"),
  scyther: safariSpecies(123, "Scyther", "Inseto/Voador"),
  tropius: safariSpecies(357, "Tropius", "Planta/Voador"),
  shuckle: safariSpecies(213, "Shuckle", "Inseto/Pedra"),
  zorua: safariSpecies(570, "Zorua", "Sombrio", "epic", "epic"),
  carnivine: safariSpecies(455, "Carnivine", "Planta", "epic", "epic"),
  oranguru: safariSpecies(765, "Oranguru", "Normal/Psíquico", "epic", "epic"),
  kecleon: safariSpecies(352, "Kecleon", "Normal", "epic", "epic"),
  larvesta: safariSpecies(636, "Larvesta", "Inseto/Fogo", "epic", "special"),

  feebas: safariSpecies(349, "Feebas", "Água"),
  clamperl: safariSpecies(366, "Clamperl", "Água"),
  corsola: safariSpecies(222, "Corsola", "Água/Pedra"),
  mantine: safariSpecies(226, "Mantine", "Água/Voador"),
  wishiwashi: safariSpecies(746, "Wishiwashi", "Água"),
  relicanth: safariSpecies(369, "Relicanth", "Água/Pedra", "epic", "epic"),
  alomomola: safariSpecies(594, "Alomomola", "Água", "epic", "epic"),
  bruxish: safariSpecies(779, "Bruxish", "Água/Psíquico", "epic", "epic"),
  tatsugiri: safariSpecies(978, "Tatsugiri", "Dragão/Água", "epic", "epic"),
  dhelmise: safariSpecies(781, "Dhelmise", "Fantasma/Planta", "epic", "special"),

  cranidos: safariSpecies(408, "Cranidos", "Pedra"),
  shieldon: safariSpecies(410, "Shieldon", "Pedra/Aço"),
  archen: safariSpecies(566, "Archen", "Pedra/Voador"),
  tyrunt: safariSpecies(696, "Tyrunt", "Pedra/Dragão"),
  amaura: safariSpecies(698, "Amaura", "Pedra/Gelo"),
  carbink: safariSpecies(703, "Carbink", "Pedra/Fada", "epic", "epic"),
  turtonator: safariSpecies(776, "Turtonator", "Fogo/Dragão", "epic", "epic"),
  drampa: safariSpecies(780, "Drampa", "Normal/Dragão", "epic", "epic"),
  jangmoo: safariSpecies(782, "Jangmo-o", "Dragão", "epic", "epic"),
  duraludon: safariSpecies(884, "Duraludon", "Aço/Dragão", "epic", "special"),

  unown: safariSpecies(201, "Unown", "Psíquico"),
  sigilyph: safariSpecies(561, "Sigilyph", "Psíquico/Voador"),
  golett: safariSpecies(622, "Golett", "Terra/Fantasma"),
  honedge: safariSpecies(679, "Honedge", "Aço/Fantasma"),
  elgyem: safariSpecies(605, "Elgyem", "Psíquico"),
  spiritomb: safariSpecies(442, "Spiritomb", "Fantasma/Sombrio", "epic", "epic"),
  sinistea: safariSpecies(854, "Sinistea", "Fantasma", "epic", "epic"),
  klefki: safariSpecies(707, "Klefki", "Aço/Fada", "epic", "epic"),
  absol: safariSpecies(359, "Absol", "Sombrio", "epic", "epic"),
  gimmighoul: safariSpecies(999, "Gimmighoul", "Fantasma", "epic", "special")
};

const weighted = (pokemon, weight) => ({ pokemon, weight });

export const SAFARI_HABITATS = [
  {
    id: "campo-aberto",
    name: "Campo Aberto",
    types: "Normal · Fada · Voador",
    description: "Planícies tranquilas com espécies raras e épicas que não aparecem normalmente nas rotas.",
    encounters: [
      weighted(ENTRIES.chansey, 14), weighted(ENTRIES.miltank, 14),
      weighted(ENTRIES.smeargle, 14), weighted(ENTRIES.furfrou, 14), weighted(ENTRIES.komala, 14),
      weighted(ENTRIES.kangaskhan, 7), weighted(ENTRIES.tauros, 7),
      weighted(ENTRIES.bouffalant, 7), weighted(ENTRIES.oricorio, 7), weighted(ENTRIES.ditto, 2)
    ]
  },
  {
    id: "selva",
    name: "Selva",
    types: "Planta · Inseto · Veneno",
    description: "Vegetação fechada com espécies raras, exóticas e exclusivas da Zona Safari.",
    encounters: [
      weighted(ENTRIES.heracross, 14), weighted(ENTRIES.pinsir, 14),
      weighted(ENTRIES.scyther, 14), weighted(ENTRIES.tropius, 14), weighted(ENTRIES.shuckle, 14),
      weighted(ENTRIES.zorua, 7), weighted(ENTRIES.carnivine, 7),
      weighted(ENTRIES.oranguru, 7), weighted(ENTRIES.kecleon, 7), weighted(ENTRIES.larvesta, 2)
    ]
  },
  {
    id: "lago-safari",
    name: "Lago Safari",
    types: "Água · Gelo · Dragão",
    description: "Águas profundas com espécies aquáticas raras e épicas ausentes das praias comuns.",
    encounters: [
      weighted(ENTRIES.feebas, 14), weighted(ENTRIES.clamperl, 14),
      weighted(ENTRIES.corsola, 14), weighted(ENTRIES.mantine, 14), weighted(ENTRIES.wishiwashi, 14),
      weighted(ENTRIES.relicanth, 7), weighted(ENTRIES.alomomola, 7),
      weighted(ENTRIES.bruxish, 7), weighted(ENTRIES.tatsugiri, 7), weighted(ENTRIES.dhelmise, 2)
    ]
  },
  {
    id: "desfiladeiro",
    name: "Desfiladeiro",
    types: "Pedra · Terra · Lutador · Dragão",
    description: "Uma área rochosa com fósseis, dragões incomuns e espécies extremamente difíceis de encontrar.",
    encounters: [
      weighted(ENTRIES.cranidos, 14), weighted(ENTRIES.shieldon, 14),
      weighted(ENTRIES.archen, 14), weighted(ENTRIES.tyrunt, 14), weighted(ENTRIES.amaura, 14),
      weighted(ENTRIES.carbink, 7), weighted(ENTRIES.turtonator, 7),
      weighted(ENTRIES.drampa, 7), weighted(ENTRIES.jangmoo, 7), weighted(ENTRIES.duraludon, 2)
    ]
  },
  {
    id: "ruinas-antigas",
    name: "Ruínas Antigas",
    types: "Psíquico · Fantasma · Sombrio",
    description: "Ruínas misteriosas com aparições raras, relíquias vivas e encontros épicos exclusivos.",
    encounters: [
      weighted(ENTRIES.unown, 14), weighted(ENTRIES.sigilyph, 14),
      weighted(ENTRIES.golett, 14), weighted(ENTRIES.honedge, 14), weighted(ENTRIES.elgyem, 14),
      weighted(ENTRIES.spiritomb, 7), weighted(ENTRIES.sinistea, 7),
      weighted(ENTRIES.klefki, 7), weighted(ENTRIES.absol, 7), weighted(ENTRIES.gimmighoul, 2)
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
