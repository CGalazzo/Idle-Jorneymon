import { HARD_EVOLUTION_RULES } from "./hard-evolutions.js";

export const EVOLUTION_RULES = {
  1: { to: 2, level: 16 }, 2: { to: 3, level: 32 },
  4: { to: 5, level: 16 }, 5: { to: 6, level: 36 },
  7: { to: 8, level: 16 }, 8: { to: 9, level: 36 },
  10: { to: 11, level: 7 }, 11: { to: 12, level: 10 },
  13: { to: 14, level: 7 }, 14: { to: 15, level: 10 },
  16: { to: 17, level: 18 }, 17: { to: 18, level: 36 },
  25: { to: 26, level: 30 },
  29: { to: 30, level: 16 }, 30: { to: 31, level: 32 },
  32: { to: 33, level: 16 }, 33: { to: 34, level: 32 },
  35: { to: 36, level: 32 },
  41: { to: 42, level: 22 }, 42: { to: 169, level: 30 },
  43: { to: 44, level: 21 }, 44: { to: 45, level: 32 },
  56: { to: 57, level: 28 }, 57: { to: 979, level: 45 },
  58: { to: 59, level: 30 },
  60: { to: 61, level: 25 }, 61: { to: 62, level: 36 },
  63: { to: 64, level: 16 }, 64: { to: 65, level: 36 },
  66: { to: 67, level: 28 }, 67: { to: 68, level: 40 },
  74: { to: 75, level: 25 }, 75: { to: 76, level: 36 },
  81: { to: 82, level: 30 }, 82: { to: 462, level: 45 },
  88: { to: 89, level: 38 },
  92: { to: 93, level: 25 }, 93: { to: 94, level: 40 },
  100: { to: 101, level: 30 },
  109: { to: 110, level: 35 },
  111: { to: 112, level: 42 }, 112: { to: 464, level: 55 },
  116: { to: 117, level: 32 }, 117: { to: 230, level: 45 },
  125: { to: 466, level: 45 },
  126: { to: 467, level: 45 },
  147: { to: 148, level: 30 }, 148: { to: 149, level: 55 },
  152: { to: 153, level: 16 }, 153: { to: 154, level: 32 },
  155: { to: 156, level: 14 }, 156: { to: 157, level: 36 },
  158: { to: 159, level: 18 }, 159: { to: 160, level: 30 },
  172: { to: 25, level: 15 },
  173: { to: 35, level: 16 },
  179: { to: 180, level: 15 }, 180: { to: 181, level: 30 },
  187: { to: 188, level: 18 }, 188: { to: 189, level: 27 },
  218: { to: 219, level: 38 },
  220: { to: 221, level: 33 }, 221: { to: 473, level: 45 },
  239: { to: 125, level: 30 },
  240: { to: 126, level: 30 },
  246: { to: 247, level: 30 }, 247: { to: 248, level: 55 },
  252: { to: 253, level: 16 }, 253: { to: 254, level: 36 },
  255: { to: 256, level: 16 }, 256: { to: 257, level: 36 },
  258: { to: 259, level: 16 }, 259: { to: 260, level: 36 },
  265: { to: 266, level: 7 }, 266: { to: 267, level: 10 },
  270: { to: 271, level: 14 }, 271: { to: 272, level: 28 },
  273: { to: 274, level: 14 }, 274: { to: 275, level: 28 },
  280: { to: 281, level: 20 },
  296: { to: 297, level: 24 },
  304: { to: 305, level: 32 }, 305: { to: 306, level: 42 },
  307: { to: 308, level: 37 },
  309: { to: 310, level: 26 },
  315: { to: 407, level: 32 },
  322: { to: 323, level: 33 },
  328: { to: 329, level: 35 }, 329: { to: 330, level: 45 },
  333: { to: 334, level: 35 },
  349: { to: 350, level: 35 },
  353: { to: 354, level: 37 },
  355: { to: 356, level: 37 }, 356: { to: 477, level: 50 },
  361: { to: 362, level: 42 }, 362: { to: 478, level: 50 },
  363: { to: 364, level: 32 }, 364: { to: 365, level: 44 },
  371: { to: 372, level: 30 }, 372: { to: 373, level: 50 },
  374: { to: 375, level: 20 }, 375: { to: 376, level: 45 },
  387: { to: 388, level: 18 }, 388: { to: 389, level: 32 },
  390: { to: 391, level: 14 }, 391: { to: 392, level: 36 },
  393: { to: 394, level: 16 }, 394: { to: 395, level: 36 },
  396: { to: 397, level: 14 }, 397: { to: 398, level: 34 },
  403: { to: 404, level: 15 }, 404: { to: 405, level: 30 },
  406: { to: 315, level: 16 },
  425: { to: 426, level: 28 },
  439: { to: 122, level: 25 },
  443: { to: 444, level: 24 }, 444: { to: 445, level: 48 },
  447: { to: 448, level: 30 },
  451: { to: 452, level: 40 },
  453: { to: 454, level: 37 },
  519: { to: 520, level: 21 }, 520: { to: 521, level: 32 },
  524: { to: 525, level: 25 }, 525: { to: 526, level: 40 },
  532: { to: 533, level: 25 }, 533: { to: 534, level: 40 },
  540: { to: 541, level: 20 }, 541: { to: 542, level: 30 },
  543: { to: 544, level: 22 }, 544: { to: 545, level: 30 },
  559: { to: 560, level: 39 },
  562: { to: 563, level: 34 },
  568: { to: 569, level: 36 },
  574: { to: 575, level: 32 }, 575: { to: 576, level: 41 },
  582: { to: 583, level: 35 }, 583: { to: 584, level: 47 },
  590: { to: 591, level: 39 },
  602: { to: 603, level: 39 }, 603: { to: 604, level: 50 },
  607: { to: 608, level: 41 }, 608: { to: 609, level: 50 },
  610: { to: 611, level: 38 }, 611: { to: 612, level: 48 },
  613: { to: 614, level: 37 },
  633: { to: 634, level: 50 }, 634: { to: 635, level: 64 },
  661: { to: 662, level: 17 }, 662: { to: 663, level: 35 },
  674: { to: 675, level: 32 },
  677: { to: 678, level: 25 },
  682: { to: 683, level: 32 },
  684: { to: 685, level: 32 },
  690: { to: 691, level: 48 },
  714: { to: 715, level: 48 },
  728: { to: 729, level: 17 }, 729: { to: 730, level: 34 },
  731: { to: 732, level: 14 }, 732: { to: 733, level: 28 },
  744: { to: 745, level: 25 },
  747: { to: 748, level: 38 },
  757: { to: 758, level: 33 },
  759: { to: 760, level: 27 },
  810: { to: 811, level: 16 }, 811: { to: 812, level: 35 },
  821: { to: 822, level: 18 }, 822: { to: 823, level: 38 },
  848: { to: 849, level: 30 },
  856: { to: 857, level: 32 }, 857: { to: 858, level: 42 },
  859: { to: 860, level: 32 }, 860: { to: 861, level: 42 },
  885: { to: 886, level: 25 }, 886: { to: 887, level: 50 },
  891: { to: 892, level: 50 },
  909: { to: 910, level: 16 }, 910: { to: 911, level: 36 },
  940: { to: 941, level: 25 },
  974: { to: 975, level: 34 },
  996: { to: 997, level: 35 }, 997: { to: 998, level: 54 }
};

const EEVEE_ENVIRONMENT_EVOLUTIONS = {
  floresta: [470],
  praia: [134],
  "usina-eletrica": [135],
  "caverna-gelo": [471],
  "torre-fantasma": [197],
  "torre-ilusoes": [196, 700],
  vulcao: [136]
};

export function getEeveeEvolutionTargets(environmentId) {
  return [...(EEVEE_ENVIRONMENT_EVOLUTIONS[String(environmentId || "")] || [])];
}

function getEeveeEvolution(level, context) {
  if (Number(level) < 20) return null;
  const forcedTarget = Number(context.forceEeveeEvolutionTarget);
  if (!forcedTarget) return null;
  const allowedTargets = getEeveeEvolutionTargets(context.environmentId);
  return allowedTargets.includes(forcedTarget) ? { to: forcedTarget, level: 20 } : null;
}

function getKirliaEvolution(level, context) {
  if (Number(level) < 30) return null;
  return { to: context.environmentId === "dojo-luta" ? 475 : 282, level: 30 };
}

function getTyrogueEvolution(level, context) {
  if (Number(level) < 20) return null;
  const pokemon = context.pokemon || {};
  const attack = Number(pokemon.attack) || 0;
  const defense = Number(pokemon.defense) || 0;
  if (attack > defense) return { to: 106, level: 20 };
  if (defense > attack) return { to: 107, level: 20 };
  return { to: 237, level: 20 };
}

export function getEvolutionRule(speciesId, level, context = {}) {
  const id = Number(speciesId);
  if (id === 133) return getEeveeEvolution(level, context);
  if (id === 281) return getKirliaEvolution(level, context);
  if (id === 236) return getTyrogueEvolution(level, context);

  const rule = EVOLUTION_RULES[id] || HARD_EVOLUTION_RULES[id];
  return rule && Number(level) >= rule.level ? rule : null;
}
