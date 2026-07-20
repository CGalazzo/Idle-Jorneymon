const INITIAL_PRICE = 6000;
const INTERMEDIATE_PRICE = 9000;
const POWERFUL_PRICE = 11000;
const PSEUDO_LEGENDARY_PRICE = 14000;
const LEGENDARY_PRICE = 20000;

export const MEGA_STONES = [
  { id: "venusaurite", name: "Venusaurite", baseSpeciesId: 3, baseName: "Venusaur", formId: 10033, megaName: "Mega Venusaur", type: "Planta/Veneno", price: INTERMEDIATE_PRICE },
  { id: "charizardite-x", name: "Charizardite X", baseSpeciesId: 6, baseName: "Charizard", formId: 10034, megaName: "Mega Charizard X", type: "Fogo/Dragão", price: POWERFUL_PRICE },
  { id: "charizardite-y", name: "Charizardite Y", baseSpeciesId: 6, baseName: "Charizard", formId: 10035, megaName: "Mega Charizard Y", type: "Fogo/Voador", price: POWERFUL_PRICE },
  { id: "blastoisinite", name: "Blastoisinite", baseSpeciesId: 9, baseName: "Blastoise", formId: 10036, megaName: "Mega Blastoise", type: "Água", price: INTERMEDIATE_PRICE },
  { id: "beedrillite", name: "Beedrillite", baseSpeciesId: 15, baseName: "Beedrill", formId: 10090, megaName: "Mega Beedrill", type: "Inseto/Veneno", price: INITIAL_PRICE },
  { id: "pidgeotite", name: "Pidgeotite", baseSpeciesId: 18, baseName: "Pidgeot", formId: 10073, megaName: "Mega Pidgeot", type: "Normal/Voador", price: INITIAL_PRICE },
  { id: "alakazite", name: "Alakazite", baseSpeciesId: 65, baseName: "Alakazam", formId: 10037, megaName: "Mega Alakazam", type: "Psíquico", price: INTERMEDIATE_PRICE },
  { id: "slowbronite", name: "Slowbronite", baseSpeciesId: 80, baseName: "Slowbro", formId: 10071, megaName: "Mega Slowbro", type: "Água/Psíquico", price: INTERMEDIATE_PRICE },
  { id: "gengarite", name: "Gengarite", baseSpeciesId: 94, baseName: "Gengar", formId: 10038, megaName: "Mega Gengar", type: "Fantasma/Veneno", price: INTERMEDIATE_PRICE },
  { id: "kangaskhanite", name: "Kangaskhanite", baseSpeciesId: 115, baseName: "Kangaskhan", formId: 10039, megaName: "Mega Kangaskhan", type: "Normal", price: POWERFUL_PRICE },
  { id: "pinsirite", name: "Pinsirite", baseSpeciesId: 127, baseName: "Pinsir", formId: 10040, megaName: "Mega Pinsir", type: "Inseto/Voador", price: POWERFUL_PRICE },
  { id: "gyaradosite", name: "Gyaradosite", baseSpeciesId: 130, baseName: "Gyarados", formId: 10041, megaName: "Mega Gyarados", type: "Água/Sombrio", price: POWERFUL_PRICE },
  { id: "aerodactylite", name: "Aerodactylite", baseSpeciesId: 142, baseName: "Aerodactyl", formId: 10042, megaName: "Mega Aerodactyl", type: "Pedra/Voador", price: POWERFUL_PRICE },
  { id: "mewtwonite-x", name: "Mewtwonite X", baseSpeciesId: 150, baseName: "Mewtwo", formId: 10043, megaName: "Mega Mewtwo X", type: "Psíquico/Lutador", price: LEGENDARY_PRICE, legendary: true },
  { id: "mewtwonite-y", name: "Mewtwonite Y", baseSpeciesId: 150, baseName: "Mewtwo", formId: 10044, megaName: "Mega Mewtwo Y", type: "Psíquico", price: LEGENDARY_PRICE, legendary: true },
  { id: "ampharosite", name: "Ampharosite", baseSpeciesId: 181, baseName: "Ampharos", formId: 10045, megaName: "Mega Ampharos", type: "Elétrico/Dragão", price: INTERMEDIATE_PRICE },
  { id: "steelixite", name: "Steelixite", baseSpeciesId: 208, baseName: "Steelix", formId: 10072, megaName: "Mega Steelix", type: "Aço/Terra", price: INTERMEDIATE_PRICE },
  { id: "scizorite", name: "Scizorite", baseSpeciesId: 212, baseName: "Scizor", formId: 10046, megaName: "Mega Scizor", type: "Inseto/Aço", price: POWERFUL_PRICE },
  { id: "heracronite", name: "Heracronite", baseSpeciesId: 214, baseName: "Heracross", formId: 10047, megaName: "Mega Heracross", type: "Inseto/Lutador", price: POWERFUL_PRICE },
  { id: "houndoominite", name: "Houndoominite", baseSpeciesId: 229, baseName: "Houndoom", formId: 10048, megaName: "Mega Houndoom", type: "Sombrio/Fogo", price: INTERMEDIATE_PRICE },
  { id: "tyranitarite", name: "Tyranitarite", baseSpeciesId: 248, baseName: "Tyranitar", formId: 10049, megaName: "Mega Tyranitar", type: "Pedra/Sombrio", price: PSEUDO_LEGENDARY_PRICE },
  { id: "sceptilite", name: "Sceptilite", baseSpeciesId: 254, baseName: "Sceptile", formId: 10065, megaName: "Mega Sceptile", type: "Planta/Dragão", price: INTERMEDIATE_PRICE },
  { id: "blazikenite", name: "Blazikenite", baseSpeciesId: 257, baseName: "Blaziken", formId: 10050, megaName: "Mega Blaziken", type: "Fogo/Lutador", price: INTERMEDIATE_PRICE },
  { id: "swampertite", name: "Swampertite", baseSpeciesId: 260, baseName: "Swampert", formId: 10064, megaName: "Mega Swampert", type: "Água/Terra", price: INTERMEDIATE_PRICE },
  { id: "gardevoirite", name: "Gardevoirite", baseSpeciesId: 282, baseName: "Gardevoir", formId: 10051, megaName: "Mega Gardevoir", type: "Psíquico/Fada", price: INTERMEDIATE_PRICE },
  { id: "sablenite", name: "Sablenite", baseSpeciesId: 302, baseName: "Sableye", formId: 10066, megaName: "Mega Sableye", type: "Sombrio/Fantasma", price: INTERMEDIATE_PRICE },
  { id: "mawilite", name: "Mawilite", baseSpeciesId: 303, baseName: "Mawile", formId: 10052, megaName: "Mega Mawile", type: "Aço/Fada", price: POWERFUL_PRICE },
  { id: "aggronite", name: "Aggronite", baseSpeciesId: 306, baseName: "Aggron", formId: 10053, megaName: "Mega Aggron", type: "Aço", price: INTERMEDIATE_PRICE },
  { id: "medichamite", name: "Medichamite", baseSpeciesId: 308, baseName: "Medicham", formId: 10054, megaName: "Mega Medicham", type: "Lutador/Psíquico", price: INTERMEDIATE_PRICE },
  { id: "manectite", name: "Manectite", baseSpeciesId: 310, baseName: "Manectric", formId: 10055, megaName: "Mega Manectric", type: "Elétrico", price: INTERMEDIATE_PRICE },
  { id: "sharpedonite", name: "Sharpedonite", baseSpeciesId: 319, baseName: "Sharpedo", formId: 10070, megaName: "Mega Sharpedo", type: "Água/Sombrio", price: POWERFUL_PRICE },
  { id: "cameruptite", name: "Cameruptite", baseSpeciesId: 323, baseName: "Camerupt", formId: 10087, megaName: "Mega Camerupt", type: "Fogo/Terra", price: INTERMEDIATE_PRICE },
  { id: "altarianite", name: "Altarianite", baseSpeciesId: 334, baseName: "Altaria", formId: 10067, megaName: "Mega Altaria", type: "Dragão/Fada", price: INTERMEDIATE_PRICE },
  { id: "banettite", name: "Banettite", baseSpeciesId: 354, baseName: "Banette", formId: 10056, megaName: "Mega Banette", type: "Fantasma", price: INTERMEDIATE_PRICE },
  { id: "absolite", name: "Absolite", baseSpeciesId: 359, baseName: "Absol", formId: 10057, megaName: "Mega Absol", type: "Sombrio", price: POWERFUL_PRICE },
  { id: "glalitite", name: "Glalitite", baseSpeciesId: 362, baseName: "Glalie", formId: 10074, megaName: "Mega Glalie", type: "Gelo", price: INTERMEDIATE_PRICE },
  { id: "salamencite", name: "Salamencite", baseSpeciesId: 373, baseName: "Salamence", formId: 10089, megaName: "Mega Salamence", type: "Dragão/Voador", price: PSEUDO_LEGENDARY_PRICE },
  { id: "metagrossite", name: "Metagrossite", baseSpeciesId: 376, baseName: "Metagross", formId: 10076, megaName: "Mega Metagross", type: "Aço/Psíquico", price: PSEUDO_LEGENDARY_PRICE },
  { id: "latiasite", name: "Latiasite", baseSpeciesId: 380, baseName: "Latias", formId: 10062, megaName: "Mega Latias", type: "Dragão/Psíquico", price: LEGENDARY_PRICE, legendary: true },
  { id: "latiosite", name: "Latiosite", baseSpeciesId: 381, baseName: "Latios", formId: 10063, megaName: "Mega Latios", type: "Dragão/Psíquico", price: LEGENDARY_PRICE, legendary: true },
  { id: "rayquazite", name: "Rayquazite", baseSpeciesId: 384, baseName: "Rayquaza", formId: 10079, megaName: "Mega Rayquaza", type: "Dragão/Voador", price: LEGENDARY_PRICE, legendary: true },
  { id: "lopunnite", name: "Lopunnite", baseSpeciesId: 428, baseName: "Lopunny", formId: 10088, megaName: "Mega Lopunny", type: "Normal/Lutador", price: POWERFUL_PRICE },
  { id: "garchompite", name: "Garchompite", baseSpeciesId: 445, baseName: "Garchomp", formId: 10058, megaName: "Mega Garchomp", type: "Dragão/Terra", price: PSEUDO_LEGENDARY_PRICE },
  { id: "lucarionite", name: "Lucarionite", baseSpeciesId: 448, baseName: "Lucario", formId: 10059, megaName: "Mega Lucario", type: "Lutador/Aço", price: POWERFUL_PRICE },
  { id: "abomasite", name: "Abomasite", baseSpeciesId: 460, baseName: "Abomasnow", formId: 10060, megaName: "Mega Abomasnow", type: "Planta/Gelo", price: INTERMEDIATE_PRICE },
  { id: "galladite", name: "Galladite", baseSpeciesId: 475, baseName: "Gallade", formId: 10068, megaName: "Mega Gallade", type: "Psíquico/Lutador", price: INTERMEDIATE_PRICE },
  { id: "audinite", name: "Audinite", baseSpeciesId: 531, baseName: "Audino", formId: 10069, megaName: "Mega Audino", type: "Normal/Fada", price: INTERMEDIATE_PRICE },
  { id: "diancite", name: "Diancite", baseSpeciesId: 719, baseName: "Diancie", formId: 10075, megaName: "Mega Diancie", type: "Pedra/Fada", price: LEGENDARY_PRICE, legendary: true }
];

export const MEGA_FORM_IDS = [...new Set(MEGA_STONES.map((stone) => stone.formId))];

export function getMegaStone(stoneId) {
  return MEGA_STONES.find((stone) => stone.id === String(stoneId || "")) || null;
}

export function getMegaStonesForSpecies(speciesId) {
  return MEGA_STONES.filter((stone) => stone.baseSpeciesId === Number(speciesId));
}
