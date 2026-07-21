import { finalizeRoutes, route, species, uniqueSpecies } from "./worlds-core.js";

const hardSpecies = (id, name, type, stage = 1, rarity) => ({
  ...species(id, name, type, stage, rarity),
  hardExclusive: true
});

function buildHardRoutes({ basic, middle, final, route5Boss, route10Boss }) {
  const b = (index) => basic[index % basic.length];
  const m = (index) => middle[index % middle.length];
  const f = (index) => final[index % final.length];

  return finalizeRoutes([
    route([b(0), b(1), b(2)], m(0)),
    route([b(0), m(0), b(3), b(4)], f(0)),
    route([b(1), b(2), b(3)], m(1)),
    route([b(1), m(1), b(4), b(0)], f(1)),
    route([b(2), m(2), b(4), m(4), f(0)], route5Boss),
    route([m(2), b(2), f(0), m(0)], f(2)),
    route([b(3), m(3), f(1), f(2)], m(3)),
    route([m(3), f(1), m(4), b(4)], f(3)),
    route([m(4), f(0), f(1), f(2), f(3)], f(4)),
    route(uniqueSpecies([...final, ...middle.slice(2)]), route10Boss, "final")
  ]);
}

const bosque = (() => {
  const blipbug = hardSpecies(824, "Blipbug", "Inseto");
  const dottler = hardSpecies(825, "Dottler", "Inseto/Psíquico", 2);
  const orbeetle = hardSpecies(826, "Orbeetle", "Inseto/Psíquico", 3, "epic");
  const gossifleur = hardSpecies(829, "Gossifleur", "Planta");
  const eldegoss = hardSpecies(830, "Eldegoss", "Planta", 3);
  const nickit = hardSpecies(827, "Nickit", "Sombrio");
  const thievul = hardSpecies(828, "Thievul", "Sombrio", 3);
  const grookey = hardSpecies(810, "Grookey", "Planta");
  const thwackey = hardSpecies(811, "Thwackey", "Planta", 2);
  const rillaboom = hardSpecies(812, "Rillaboom", "Planta", 3, "epic");
  const applin = hardSpecies(840, "Applin", "Planta/Dragão");
  const flapple = hardSpecies(841, "Flapple", "Planta/Dragão", 3);
  const appletun = hardSpecies(842, "Appletun", "Planta/Dragão", 3);
  return buildHardRoutes({
    basic: [blipbug, gossifleur, nickit, grookey, applin],
    middle: [dottler, eldegoss, thievul, thwackey, flapple],
    final: [orbeetle, eldegoss, thievul, rillaboom, appletun],
    route5Boss: rillaboom,
    route10Boss: hardSpecies(151, "Mew", "Psíquico", 3, "mythical")
  });
})();

const floresta = (() => {
  const scatterbug = hardSpecies(664, "Scatterbug", "Inseto");
  const spewpa = hardSpecies(665, "Spewpa", "Inseto", 2);
  const vivillon = hardSpecies(666, "Vivillon", "Inseto/Voador", 3);
  const grubbin = hardSpecies(736, "Grubbin", "Inseto");
  const charjabug = hardSpecies(737, "Charjabug", "Inseto/Elétrico", 2);
  const vikavolt = hardSpecies(738, "Vikavolt", "Inseto/Elétrico", 3, "epic");
  const fomantis = hardSpecies(753, "Fomantis", "Planta");
  const lurantis = hardSpecies(754, "Lurantis", "Planta", 3);
  const morelull = hardSpecies(755, "Morelull", "Planta/Fada");
  const shiinotic = hardSpecies(756, "Shiinotic", "Planta/Fada", 3);
  const sprigatito = hardSpecies(906, "Sprigatito", "Planta");
  const floragato = hardSpecies(907, "Floragato", "Planta", 2);
  const meowscarada = hardSpecies(908, "Meowscarada", "Planta/Sombrio", 3, "epic");
  return buildHardRoutes({
    basic: [scatterbug, grubbin, fomantis, morelull, sprigatito],
    middle: [spewpa, charjabug, lurantis, shiinotic, floragato],
    final: [vivillon, vikavolt, lurantis, shiinotic, meowscarada],
    route5Boss: meowscarada,
    route10Boss: hardSpecies(251, "Celebi", "Psíquico/Planta", 3, "mythical")
  });
})();

const pantano = (() => {
  const tympole = hardSpecies(535, "Tympole", "Água");
  const palpitoad = hardSpecies(536, "Palpitoad", "Água/Terra", 2);
  const seismitoad = hardSpecies(537, "Seismitoad", "Água/Terra", 3, "epic");
  const gulpin = hardSpecies(316, "Gulpin", "Veneno");
  const swalot = hardSpecies(317, "Swalot", "Veneno", 3);
  const stunky = hardSpecies(434, "Stunky", "Veneno/Sombrio");
  const skuntank = hardSpecies(435, "Skuntank", "Veneno/Sombrio", 3);
  const wooper = hardSpecies(194, "Wooper", "Água/Terra");
  const quagsire = hardSpecies(195, "Quagsire", "Água/Terra", 3);
  const tadbulb = hardSpecies(938, "Tadbulb", "Elétrico");
  const bellibolt = hardSpecies(939, "Bellibolt", "Elétrico", 3);
  return buildHardRoutes({
    basic: [tympole, gulpin, stunky, wooper, tadbulb],
    middle: [palpitoad, swalot, skuntank, quagsire, bellibolt],
    final: [seismitoad, swalot, skuntank, quagsire, bellibolt],
    route5Boss: seismitoad,
    route10Boss: hardSpecies(890, "Eternatus", "Veneno/Dragão", 3, "legendary")
  });
})();

const caverna = (() => {
  const drilbur = hardSpecies(529, "Drilbur", "Terra");
  const excadrill = hardSpecies(530, "Excadrill", "Terra/Aço", 3);
  const dwebble = hardSpecies(557, "Dwebble", "Inseto/Pedra");
  const crustle = hardSpecies(558, "Crustle", "Inseto/Pedra", 3);
  const rolycoly = hardSpecies(837, "Rolycoly", "Pedra");
  const carkol = hardSpecies(838, "Carkol", "Pedra/Fogo", 2);
  const coalossal = hardSpecies(839, "Coalossal", "Pedra/Fogo", 3, "epic");
  const nacli = hardSpecies(932, "Nacli", "Pedra");
  const naclstack = hardSpecies(933, "Naclstack", "Pedra", 2);
  const garganacl = hardSpecies(934, "Garganacl", "Pedra", 3, "epic");
  const glimmet = hardSpecies(969, "Glimmet", "Pedra/Veneno");
  const glimmora = hardSpecies(970, "Glimmora", "Pedra/Veneno", 3);
  return buildHardRoutes({
    basic: [drilbur, dwebble, rolycoly, nacli, glimmet],
    middle: [excadrill, crustle, carkol, naclstack, glimmora],
    final: [excadrill, crustle, coalossal, garganacl, glimmora],
    route5Boss: garganacl,
    route10Boss: hardSpecies(639, "Terrakion", "Pedra/Lutador", 3, "legendary")
  });
})();

const praia = (() => {
  const popplio = hardSpecies(728, "Popplio", "Água");
  const brionne = hardSpecies(729, "Brionne", "Água", 2);
  const primarina = hardSpecies(730, "Primarina", "Água/Fada", 3, "epic");
  const dewpider = hardSpecies(751, "Dewpider", "Água/Inseto");
  const araquanid = hardSpecies(752, "Araquanid", "Água/Inseto", 3);
  const clauncher = hardSpecies(692, "Clauncher", "Água");
  const clawitzer = hardSpecies(693, "Clawitzer", "Água", 3);
  const wiglett = hardSpecies(960, "Wiglett", "Água");
  const wugtrio = hardSpecies(961, "Wugtrio", "Água", 3);
  const finizen = hardSpecies(963, "Finizen", "Água");
  const palafin = hardSpecies(964, "Palafin", "Água", 3, "epic");
  return buildHardRoutes({
    basic: [popplio, dewpider, clauncher, wiglett, finizen],
    middle: [brionne, araquanid, clawitzer, wugtrio, palafin],
    final: [primarina, araquanid, clawitzer, wugtrio, palafin],
    route5Boss: palafin,
    route10Boss: hardSpecies(382, "Kyogre", "Água", 3, "legendary")
  });
})();

const usina = (() => {
  const blitzle = hardSpecies(522, "Blitzle", "Elétrico");
  const zebstrika = hardSpecies(523, "Zebstrika", "Elétrico", 3);
  const helioptile = hardSpecies(694, "Helioptile", "Elétrico/Normal");
  const heliolisk = hardSpecies(695, "Heliolisk", "Elétrico/Normal", 3);
  const yamper = hardSpecies(835, "Yamper", "Elétrico");
  const boltund = hardSpecies(836, "Boltund", "Elétrico", 3);
  const toxel = hardSpecies(848, "Toxel", "Elétrico/Veneno");
  const toxtricity = hardSpecies(849, "Toxtricity", "Elétrico/Veneno", 3, "epic");
  const pawmi = hardSpecies(921, "Pawmi", "Elétrico");
  const pawmo = hardSpecies(922, "Pawmo", "Elétrico/Lutador", 2);
  const pawmot = hardSpecies(923, "Pawmot", "Elétrico/Lutador", 3, "epic");
  return buildHardRoutes({
    basic: [blitzle, helioptile, yamper, toxel, pawmi],
    middle: [zebstrika, heliolisk, boltund, toxtricity, pawmo],
    final: [zebstrika, heliolisk, boltund, toxtricity, pawmot],
    route5Boss: pawmot,
    route10Boss: hardSpecies(243, "Raikou", "Elétrico", 3, "legendary")
  });
})();

const montanhas = (() => {
  const rockruff = hardSpecies(744, "Rockruff", "Pedra");
  const lycanroc = hardSpecies(745, "Lycanroc", "Pedra", 3, "epic");
  const mudbray = hardSpecies(749, "Mudbray", "Terra");
  const mudsdale = hardSpecies(750, "Mudsdale", "Terra", 3);
  const gligar = hardSpecies(207, "Gligar", "Terra/Voador");
  const gliscor = hardSpecies(472, "Gliscor", "Terra/Voador", 3);
  const skiddo = hardSpecies(672, "Skiddo", "Planta");
  const gogoat = hardSpecies(673, "Gogoat", "Planta", 3);
  const archen = hardSpecies(566, "Archen", "Pedra/Voador");
  const archeops = hardSpecies(567, "Archeops", "Pedra/Voador", 3, "epic");
  return buildHardRoutes({
    basic: [rockruff, mudbray, gligar, skiddo, archen],
    middle: [lycanroc, mudsdale, gliscor, gogoat, archeops],
    final: [lycanroc, mudsdale, gliscor, gogoat, archeops],
    route5Boss: hardSpecies(380, "Latias", "Dragão/Psíquico", 3, "legendary"),
    route10Boss: hardSpecies(381, "Latios", "Dragão/Psíquico", 3, "legendary")
  });
})();

const dojo = (() => {
  const mienfoo = hardSpecies(619, "Mienfoo", "Lutador");
  const mienshao = hardSpecies(620, "Mienshao", "Lutador", 3);
  const clobbopus = hardSpecies(852, "Clobbopus", "Lutador");
  const grapploct = hardSpecies(853, "Grapploct", "Lutador", 3);
  const crabrawler = hardSpecies(739, "Crabrawler", "Lutador");
  const crabominable = hardSpecies(740, "Crabominable", "Lutador/Gelo", 3);
  const falinks = hardSpecies(870, "Falinks", "Lutador", 3);
  const passimian = hardSpecies(766, "Passimian", "Lutador", 3);
  return buildHardRoutes({
    basic: [mienfoo, clobbopus, crabrawler, falinks, passimian],
    middle: [mienshao, grapploct, crabominable, falinks, passimian],
    final: [mienshao, grapploct, crabominable, falinks, passimian],
    route5Boss: hardSpecies(794, "Buzzwole", "Inseto/Lutador", 3, "legendary"),
    route10Boss: hardSpecies(647, "Keldeo", "Água/Lutador", 3, "mythical")
  });
})();

const gelo = (() => {
  const cetoddle = hardSpecies(974, "Cetoddle", "Gelo");
  const cetitan = hardSpecies(975, "Cetitan", "Gelo", 3);
  const snom = hardSpecies(872, "Snom", "Gelo/Inseto");
  const frosmoth = hardSpecies(873, "Frosmoth", "Gelo/Inseto", 3);
  const amaura = hardSpecies(698, "Amaura", "Pedra/Gelo");
  const aurorus = hardSpecies(699, "Aurorus", "Pedra/Gelo", 3, "epic");
  const bergmite = hardSpecies(712, "Bergmite", "Gelo");
  const avalugg = hardSpecies(713, "Avalugg", "Gelo", 3);
  const cryogonal = hardSpecies(615, "Cryogonal", "Gelo", 3);
  return buildHardRoutes({
    basic: [cetoddle, snom, amaura, bergmite, cryogonal],
    middle: [cetitan, frosmoth, aurorus, avalugg, cryogonal],
    final: [cetitan, frosmoth, aurorus, avalugg, cryogonal],
    route5Boss: aurorus,
    route10Boss: hardSpecies(245, "Suicune", "Água", 3, "legendary")
  });
})();

const fantasma = (() => {
  const dreepy = hardSpecies(885, "Dreepy", "Dragão/Fantasma");
  const drakloak = hardSpecies(886, "Drakloak", "Dragão/Fantasma", 2);
  const dragapult = hardSpecies(887, "Dragapult", "Dragão/Fantasma", 3, "epic");
  const sinistea = hardSpecies(854, "Sinistea", "Fantasma");
  const polteageist = hardSpecies(855, "Polteageist", "Fantasma", 3);
  const greavard = hardSpecies(971, "Greavard", "Fantasma");
  const houndstone = hardSpecies(972, "Houndstone", "Fantasma", 3);
  const bramblin = hardSpecies(946, "Bramblin", "Planta/Fantasma");
  const brambleghast = hardSpecies(947, "Brambleghast", "Planta/Fantasma", 3);
  const gimmighoul = hardSpecies(999, "Gimmighoul", "Fantasma");
  const gholdengo = hardSpecies(1000, "Gholdengo", "Aço/Fantasma", 3, "epic");
  return buildHardRoutes({
    basic: [dreepy, sinistea, greavard, bramblin, gimmighoul],
    middle: [drakloak, polteageist, houndstone, brambleghast, gholdengo],
    final: [dragapult, polteageist, houndstone, brambleghast, gholdengo],
    route5Boss: dragapult,
    route10Boss: hardSpecies(802, "Marshadow", "Lutador/Fantasma", 3, "mythical")
  });
})();

const ilusoes = (() => {
  const solosis = hardSpecies(577, "Solosis", "Psíquico");
  const duosion = hardSpecies(578, "Duosion", "Psíquico", 2);
  const reuniclus = hardSpecies(579, "Reuniclus", "Psíquico", 3, "epic");
  const elgyem = hardSpecies(605, "Elgyem", "Psíquico");
  const beheeyem = hardSpecies(606, "Beheeyem", "Psíquico", 3);
  const munna = hardSpecies(517, "Munna", "Psíquico");
  const musharna = hardSpecies(518, "Musharna", "Psíquico", 3);
  const inkay = hardSpecies(686, "Inkay", "Sombrio/Psíquico");
  const malamar = hardSpecies(687, "Malamar", "Sombrio/Psíquico", 3);
  const flittle = hardSpecies(955, "Flittle", "Psíquico");
  const espathra = hardSpecies(956, "Espathra", "Psíquico", 3);
  return buildHardRoutes({
    basic: [solosis, elgyem, munna, inkay, flittle],
    middle: [duosion, beheeyem, musharna, malamar, espathra],
    final: [reuniclus, beheeyem, musharna, malamar, espathra],
    route5Boss: hardSpecies(483, "Dialga", "Aço/Dragão", 3, "legendary"),
    route10Boss: hardSpecies(484, "Palkia", "Água/Dragão", 3, "legendary")
  });
})();

const vulcao = (() => {
  const fuecoco = hardSpecies(909, "Fuecoco", "Fogo");
  const crocalor = hardSpecies(910, "Crocalor", "Fogo", 2);
  const skeledirge = hardSpecies(911, "Skeledirge", "Fogo/Fantasma", 3, "epic");
  const litten = hardSpecies(725, "Litten", "Fogo");
  const torracat = hardSpecies(726, "Torracat", "Fogo", 2);
  const incineroar = hardSpecies(727, "Incineroar", "Fogo/Sombrio", 3, "epic");
  const fennekin = hardSpecies(653, "Fennekin", "Fogo");
  const braixen = hardSpecies(654, "Braixen", "Fogo", 2);
  const delphox = hardSpecies(655, "Delphox", "Fogo/Psíquico", 3, "epic");
  const larvesta = hardSpecies(636, "Larvesta", "Inseto/Fogo");
  const volcarona = hardSpecies(637, "Volcarona", "Inseto/Fogo", 3, "epic");
  const sizzlipede = hardSpecies(850, "Sizzlipede", "Fogo/Inseto");
  const centiskorch = hardSpecies(851, "Centiskorch", "Fogo/Inseto", 3);
  return buildHardRoutes({
    basic: [fuecoco, litten, fennekin, larvesta, sizzlipede],
    middle: [crocalor, torracat, braixen, volcarona, centiskorch],
    final: [skeledirge, incineroar, delphox, volcarona, centiskorch],
    route5Boss: hardSpecies(244, "Entei", "Fogo", 3, "legendary"),
    route10Boss: hardSpecies(383, "Groudon", "Terra", 3, "legendary")
  });
})();

const ilha = (() => {
  const wattrel = hardSpecies(940, "Wattrel", "Elétrico/Voador");
  const kilowattrel = hardSpecies(941, "Kilowattrel", "Elétrico/Voador", 3);
  const rufflet = hardSpecies(627, "Rufflet", "Normal/Voador");
  const braviary = hardSpecies(628, "Braviary", "Normal/Voador", 3, "epic");
  const vullaby = hardSpecies(629, "Vullaby", "Sombrio/Voador");
  const mandibuzz = hardSpecies(630, "Mandibuzz", "Sombrio/Voador", 3);
  const ducklett = hardSpecies(580, "Ducklett", "Água/Voador");
  const swanna = hardSpecies(581, "Swanna", "Água/Voador", 3);
  const oricorio = hardSpecies(741, "Oricorio", "Fogo/Voador", 3);
  return buildHardRoutes({
    basic: [wattrel, rufflet, vullaby, ducklett, oricorio],
    middle: [kilowattrel, braviary, mandibuzz, swanna, oricorio],
    final: [kilowattrel, braviary, mandibuzz, swanna, oricorio],
    route5Boss: braviary,
    route10Boss: hardSpecies(384, "Rayquaza", "Dragão/Voador", 3, "legendary")
  });
})();

const planalto = (() => {
  const jangmoo = hardSpecies(782, "Jangmo-o", "Dragão");
  const hakamoo = hardSpecies(783, "Hakamo-o", "Dragão/Lutador", 2);
  const kommoo = hardSpecies(784, "Kommo-o", "Dragão/Lutador", 3, "epic");
  const goomy = hardSpecies(704, "Goomy", "Dragão");
  const sliggoo = hardSpecies(705, "Sliggoo", "Dragão", 2);
  const goodra = hardSpecies(706, "Goodra", "Dragão", 3, "epic");
  const frigibax = hardSpecies(996, "Frigibax", "Dragão/Gelo");
  const arctibax = hardSpecies(997, "Arctibax", "Dragão/Gelo", 2);
  const baxcalibur = hardSpecies(998, "Baxcalibur", "Dragão/Gelo", 3, "epic");
  const duraludon = hardSpecies(884, "Duraludon", "Aço/Dragão");
  const archaludon = hardSpecies(1018, "Archaludon", "Aço/Dragão", 3, "epic");
  const cyclizar = hardSpecies(967, "Cyclizar", "Dragão/Normal", 3);
  return buildHardRoutes({
    basic: [jangmoo, goomy, frigibax, duraludon, cyclizar],
    middle: [hakamoo, sliggoo, arctibax, archaludon, cyclizar],
    final: [kommoo, goodra, baxcalibur, archaludon, cyclizar],
    route5Boss: hardSpecies(792, "Lunala", "Psíquico/Fantasma", 3, "legendary"),
    route10Boss: hardSpecies(791, "Solgaleo", "Psíquico/Aço", 3, "legendary")
  });
})();

const elite = (() => {
  const greatTusk = hardSpecies(984, "Great Tusk", "Terra/Lutador", 3, "epic");
  const ironTreads = hardSpecies(990, "Iron Treads", "Terra/Aço", 3, "epic");
  const flutterMane = hardSpecies(987, "Flutter Mane", "Fantasma/Fada", 3, "epic");
  const ironHands = hardSpecies(992, "Iron Hands", "Lutador/Elétrico", 3, "epic");
  const ironBundle = hardSpecies(991, "Iron Bundle", "Gelo/Água", 3, "epic");
  const ironThorns = hardSpecies(995, "Iron Thorns", "Pedra/Elétrico", 3, "epic");
  const roaringMoon = hardSpecies(1005, "Roaring Moon", "Dragão/Sombrio", 3, "epic");
  const ironValiant = hardSpecies(1006, "Iron Valiant", "Fada/Lutador", 3, "epic");
  const walkingWake = hardSpecies(1009, "Walking Wake", "Água/Dragão", 3, "epic");
  const ironLeaves = hardSpecies(1010, "Iron Leaves", "Planta/Psíquico", 3, "epic");
  return buildHardRoutes({
    basic: [greatTusk, ironTreads, flutterMane, ironHands, ironBundle],
    middle: [ironThorns, roaringMoon, ironValiant, walkingWake, ironLeaves],
    final: [greatTusk, ironTreads, flutterMane, ironHands, ironBundle, ironThorns, roaringMoon, ironValiant, walkingWake, ironLeaves],
    route5Boss: hardSpecies(250, "Ho-Oh", "Fogo/Voador", 3, "legendary"),
    route10Boss: hardSpecies(493, "Arceus", "Normal", 3, "mythical")
  });
})();

export const HARD_ROUTES_BY_WORLD = {
  bosque,
  floresta,
  pantano,
  caverna,
  praia,
  "usina-eletrica": usina,
  montanhas,
  "dojo-luta": dojo,
  "caverna-gelo": gelo,
  "torre-fantasma": fantasma,
  "torre-ilusoes": ilusoes,
  vulcao,
  "ilha-flutuante": ilha,
  "planalto-indigo": planalto,
  "elite-4": elite
};

export const HARD_EXCLUSIVE_BY_WORLD = Object.fromEntries(
  Object.entries(HARD_ROUTES_BY_WORLD).map(([environmentId, routes]) => [
    environmentId,
    uniqueSpecies(routes.flatMap((entry) => [...entry.encounters, entry.boss]))
  ])
);

export const HARD_MODE_SPECIES = uniqueSpecies(
  Object.values(HARD_ROUTES_BY_WORLD).flatMap((routes) => routes.flatMap((entry) => [...entry.encounters, entry.boss]))
);

export const HARD_SHINY_CHANCE = 1 / 160;

function getHardRoute(routeDefinition) {
  const routes = HARD_ROUTES_BY_WORLD[routeDefinition?.environment?.id];
  if (!routes?.length) return null;
  return routes[Math.max(0, Math.min(routes.length - 1, Number(routeDefinition.routeIndex) || 0))] || null;
}

export function getHardEncounterPool(routeDefinition) {
  return getHardRoute(routeDefinition)?.encounters || [];
}

export function getHardBossTemplate(routeDefinition) {
  return getHardRoute(routeDefinition)?.boss || routeDefinition.boss;
}
