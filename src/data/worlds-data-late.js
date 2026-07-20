import { line, route, species } from "./worlds-core.js";

export const ilusoesRoutes = [
  route([species(63, "Abra", "Psíquico"), species(280, "Ralts", "Psíquico/Fada"), species(173, "Cleffa", "Fada"), species(677, "Espurr", "Psíquico")], species(64, "Kadabra", "Psíquico", 2)),
  route([species(63, "Abra", "Psíquico"), species(64, "Kadabra", "Psíquico", 2), species(439, "Mime Jr.", "Psíquico/Fada"), species(196, "Espeon", "Psíquico", 3)], species(65, "Alakazam", "Psíquico", 3)),
  route([species(280, "Ralts", "Psíquico/Fada"), species(574, "Gothita", "Psíquico"), species(682, "Spritzee", "Fada"), species(684, "Swirlix", "Fada")], species(281, "Kirlia", "Psíquico/Fada", 2)),
  route([species(281, "Kirlia", "Psíquico/Fada", 2), species(677, "Espurr", "Psíquico"), species(876, "Indeedee", "Psíquico/Normal", 2), species(700, "Sylveon", "Fada", 3)], species(282, "Gardevoir", "Psíquico/Fada", 3)),
  route([species(856, "Hatenna", "Psíquico"), species(574, "Gothita", "Psíquico"), species(173, "Cleffa", "Fada"), species(778, "Mimikyu", "Fantasma/Fada", 3)], species(857, "Hattrem", "Psíquico", 2)),
  route([species(856, "Hatenna", "Psíquico"), species(857, "Hattrem", "Psíquico", 2), species(122, "Mr. Mime", "Psíquico/Fada", 3), species(683, "Aromatisse", "Fada", 3)], species(858, "Hatterene", "Psíquico/Fada", 3)),
  route([species(173, "Cleffa", "Fada"), species(682, "Spritzee", "Fada"), species(684, "Swirlix", "Fada"), species(678, "Meowstic", "Psíquico", 3)], species(35, "Clefairy", "Fada", 2)),
  route([species(35, "Clefairy", "Fada", 2), species(683, "Aromatisse", "Fada", 3), species(685, "Slurpuff", "Fada", 3), species(196, "Espeon", "Psíquico", 3), species(700, "Sylveon", "Fada", 3)], species(36, "Clefable", "Fada", 3)),
  route([species(574, "Gothita", "Psíquico"), species(575, "Gothorita", "Psíquico", 2), species(876, "Indeedee", "Psíquico/Normal", 2), species(778, "Mimikyu", "Fantasma/Fada", 3)], species(576, "Gothitelle", "Psíquico", 3, "epic")),
  route([species(65, "Alakazam", "Psíquico", 3), species(282, "Gardevoir", "Psíquico/Fada", 3), species(858, "Hatterene", "Psíquico/Fada", 3), species(36, "Clefable", "Fada", 3), species(196, "Espeon", "Psíquico", 3), species(700, "Sylveon", "Fada", 3)], species(488, "Cresselia", "Psíquico", 3, "legendary"), "final")
];

export const vulcaoLines = [
  line(species(218, "Slugma", "Fogo"), species(219, "Magcargo", "Fogo/Pedra", 2), species(219, "Magcargo", "Fogo/Pedra", 3)),
  line(species(322, "Numel", "Fogo/Terra"), species(323, "Camerupt", "Fogo/Terra", 2), species(323, "Camerupt", "Fogo/Terra", 3)),
  line(species(240, "Magby", "Fogo"), species(126, "Magmar", "Fogo", 2), species(467, "Magmortar", "Fogo", 3, "epic")),
  line(species(255, "Torchic", "Fogo"), species(256, "Combusken", "Fogo/Lutador", 2), species(257, "Blaziken", "Fogo/Lutador", 3, "epic")),
  line(species(4, "Charmander", "Fogo"), species(5, "Charmeleon", "Fogo", 2), species(6, "Charizard", "Fogo/Voador", 3, "epic"))
];

export const ilhaRoutes = [
  route([species(396, "Starly", "Normal/Voador"), species(519, "Pidove", "Normal/Voador"), species(333, "Swablu", "Normal/Voador"), species(187, "Hoppip", "Planta/Voador")], species(397, "Staravia", "Normal/Voador", 2)),
  route([species(396, "Starly", "Normal/Voador"), species(397, "Staravia", "Normal/Voador", 2), species(425, "Drifloon", "Fantasma/Voador"), species(714, "Noibat", "Voador/Dragão")], species(398, "Staraptor", "Normal/Voador", 3)),
  route([species(519, "Pidove", "Normal/Voador"), species(661, "Fletchling", "Normal/Voador"), species(187, "Hoppip", "Planta/Voador"), species(731, "Pikipek", "Normal/Voador")], species(520, "Tranquill", "Normal/Voador", 2)),
  route([species(519, "Pidove", "Normal/Voador"), species(520, "Tranquill", "Normal/Voador", 2), species(334, "Altaria", "Dragão/Voador", 3), species(426, "Drifblim", "Fantasma/Voador", 3)], species(521, "Unfezant", "Normal/Voador", 3)),
  route([species(661, "Fletchling", "Normal/Voador"), species(821, "Rookidee", "Voador"), species(714, "Noibat", "Voador/Dragão"), species(188, "Skiploom", "Planta/Voador", 2)], species(662, "Fletchinder", "Fogo/Voador", 2)),
  route([species(661, "Fletchling", "Normal/Voador"), species(662, "Fletchinder", "Fogo/Voador", 2), species(715, "Noivern", "Voador/Dragão", 3), species(700, "Sylveon", "Fada", 3)], species(663, "Talonflame", "Fogo/Voador", 3)),
  route([species(731, "Pikipek", "Normal/Voador"), species(821, "Rookidee", "Voador"), species(333, "Swablu", "Normal/Voador"), species(425, "Drifloon", "Fantasma/Voador")], species(732, "Trumbeak", "Normal/Voador", 2)),
  route([species(731, "Pikipek", "Normal/Voador"), species(732, "Trumbeak", "Normal/Voador", 2), species(189, "Jumpluff", "Planta/Voador", 3), species(715, "Noivern", "Voador/Dragão", 3)], species(733, "Toucannon", "Normal/Voador", 3)),
  route([species(821, "Rookidee", "Voador"), species(822, "Corvisquire", "Voador", 2), species(334, "Altaria", "Dragão/Voador", 3), species(700, "Sylveon", "Fada", 3)], species(823, "Corviknight", "Voador/Aço", 3, "epic")),
  route([species(398, "Staraptor", "Normal/Voador", 3), species(521, "Unfezant", "Normal/Voador", 3), species(663, "Talonflame", "Fogo/Voador", 3), species(733, "Toucannon", "Normal/Voador", 3), species(823, "Corviknight", "Voador/Aço", 3), species(715, "Noivern", "Voador/Dragão", 3)], species(384, "Rayquaza", "Dragão/Voador", 3, "legendary"), "final")
];

export const planaltoLines = [
  line(species(147, "Dratini", "Dragão"), species(148, "Dragonair", "Dragão", 2), species(149, "Dragonite", "Dragão/Voador", 3, "epic")),
  line(species(374, "Beldum", "Aço/Psíquico"), species(375, "Metang", "Aço/Psíquico", 2), species(376, "Metagross", "Aço/Psíquico", 3, "epic")),
  line(species(443, "Gible", "Dragão/Terra"), species(444, "Gabite", "Dragão/Terra", 2), species(445, "Garchomp", "Dragão/Terra", 3, "epic")),
  line(species(610, "Axew", "Dragão"), species(611, "Fraxure", "Dragão", 2), species(612, "Haxorus", "Dragão", 3, "epic")),
  line(species(633, "Deino", "Sombrio/Dragão"), species(634, "Zweilous", "Sombrio/Dragão", 2), species(635, "Hydreigon", "Sombrio/Dragão", 3, "epic"))
];

export const eliteFinal = species(150, "Mewtwo", "Psíquico", 3, "legendary");

export const eliteRoutes = [
  route([species(91, "Cloyster", "Água/Gelo", 3), species(80, "Slowbro", "Água/Psíquico", 3), species(124, "Jynx", "Gelo/Psíquico", 3)], species(87, "Dewgong", "Água/Gelo", 3)),
  route([species(87, "Dewgong", "Água/Gelo", 3), species(91, "Cloyster", "Água/Gelo", 3), species(80, "Slowbro", "Água/Psíquico", 3), species(124, "Jynx", "Gelo/Psíquico", 3)], species(131, "Lapras", "Água/Gelo", 3, "epic")),
  route([species(95, "Onix", "Pedra/Terra", 3), species(107, "Hitmonchan", "Lutador", 3), species(106, "Hitmonlee", "Lutador", 3)], species(68, "Machamp", "Lutador", 3, "epic")),
  route([species(24, "Arbok", "Veneno", 3), species(42, "Golbat", "Veneno/Voador", 2), species(93, "Haunter", "Fantasma/Veneno", 2)], species(94, "Gengar", "Fantasma/Veneno", 3, "epic")),
  route([species(130, "Gyarados", "Água/Voador", 3), species(148, "Dragonair", "Dragão", 2), species(142, "Aerodactyl", "Pedra/Voador", 3)], species(149, "Dragonite", "Dragão/Voador", 3, "epic")),
  route([species(178, "Xatu", "Psíquico/Voador", 3), species(124, "Jynx", "Gelo/Psíquico", 3), species(103, "Exeggutor", "Planta/Psíquico", 3)], species(80, "Slowbro", "Água/Psíquico", 3)),
  route([species(168, "Ariados", "Inseto/Veneno", 3), species(205, "Forretress", "Inseto/Aço", 3), species(89, "Muk", "Veneno", 3), species(49, "Venomoth", "Inseto/Veneno", 3)], species(169, "Crobat", "Veneno/Voador", 3, "epic")),
  route([species(237, "Hitmontop", "Lutador", 3), species(106, "Hitmonlee", "Lutador", 3), species(107, "Hitmonchan", "Lutador", 3), species(95, "Onix", "Pedra/Terra", 3)], species(68, "Machamp", "Lutador", 3, "epic")),
  route([species(197, "Umbreon", "Sombrio", 3), species(45, "Vileplume", "Planta/Veneno", 3), species(198, "Murkrow", "Sombrio/Voador", 3), species(94, "Gengar", "Fantasma/Veneno", 3)], species(229, "Houndoom", "Sombrio/Fogo", 3, "epic")),
  route([species(131, "Lapras", "Água/Gelo", 3, "epic"), species(149, "Dragonite", "Dragão/Voador", 3, "epic"), species(178, "Xatu", "Psíquico/Voador", 3), species(169, "Crobat", "Veneno/Voador", 3, "epic"), species(229, "Houndoom", "Sombrio/Fogo", 3, "epic"), species(68, "Machamp", "Lutador", 3, "epic")], eliteFinal, "final")
];
