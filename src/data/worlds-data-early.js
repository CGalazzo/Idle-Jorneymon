import { line, route, species } from "./worlds-core.js";

export const bosqueLines = [
  line(species(10, "Caterpie", "Inseto"), species(11, "Metapod", "Inseto", 2), species(12, "Butterfree", "Inseto/Voador", 3)),
  line(species(13, "Weedle", "Inseto/Veneno"), species(14, "Kakuna", "Inseto/Veneno", 2), species(15, "Beedrill", "Inseto/Veneno", 3)),
  line(species(16, "Pidgey", "Normal/Voador"), species(17, "Pidgeotto", "Normal/Voador", 2), species(18, "Pidgeot", "Normal/Voador", 3)),
  line(species(43, "Oddish", "Planta/Veneno"), species(44, "Gloom", "Planta/Veneno", 2), species(45, "Vileplume", "Planta/Veneno", 3)),
  line(species(1, "Bulbasaur", "Planta/Veneno"), species(2, "Ivysaur", "Planta/Veneno", 2), species(3, "Venusaur", "Planta/Veneno", 3, "epic"))
];

export const florestaLines = [
  line(species(265, "Wurmple", "Inseto"), species(266, "Silcoon", "Inseto", 2), species(267, "Beautifly", "Inseto/Voador", 3)),
  line(species(273, "Seedot", "Planta"), species(274, "Nuzleaf", "Planta/Sombrio", 2), species(275, "Shiftry", "Planta/Sombrio", 3)),
  line(species(252, "Treecko", "Planta"), species(253, "Grovyle", "Planta", 2), species(254, "Sceptile", "Planta", 3)),
  line(species(540, "Sewaddle", "Inseto/Planta"), species(541, "Swadloon", "Inseto/Planta", 2), species(542, "Leavanny", "Inseto/Planta", 3)),
  line(species(543, "Venipede", "Inseto/Veneno"), species(544, "Whirlipede", "Inseto/Veneno", 2), species(545, "Scolipede", "Inseto/Veneno", 3, "epic"))
];

export const pantanoRoutes = [
  route([species(29, "Nidoran♀", "Veneno"), species(32, "Nidoran♂", "Veneno"), species(406, "Budew", "Planta/Veneno"), species(109, "Koffing", "Veneno")], species(30, "Nidorina", "Veneno", 2)),
  route([species(29, "Nidoran♀", "Veneno"), species(30, "Nidorina", "Veneno", 2), species(88, "Grimer", "Veneno"), species(568, "Trubbish", "Veneno")], species(31, "Nidoqueen", "Veneno/Terra", 3)),
  route([species(32, "Nidoran♂", "Veneno"), species(406, "Budew", "Planta/Veneno"), species(453, "Croagunk", "Veneno/Lutador"), species(590, "Foongus", "Planta/Veneno")], species(33, "Nidorino", "Veneno", 2)),
  route([species(32, "Nidoran♂", "Veneno"), species(33, "Nidorino", "Veneno", 2), species(109, "Koffing", "Veneno"), species(690, "Skrelp", "Veneno/Água")], species(34, "Nidoking", "Veneno/Terra", 3)),
  route([species(406, "Budew", "Planta/Veneno"), species(88, "Grimer", "Veneno"), species(451, "Skorupi", "Veneno/Inseto"), species(757, "Salandit", "Veneno/Fogo")], species(315, "Roselia", "Planta/Veneno", 2)),
  route([species(315, "Roselia", "Planta/Veneno", 2), species(109, "Koffing", "Veneno"), species(568, "Trubbish", "Veneno"), species(747, "Mareanie", "Veneno/Água")], species(407, "Roserade", "Planta/Veneno", 3)),
  route([species(88, "Grimer", "Veneno"), species(110, "Weezing", "Veneno", 3), species(590, "Foongus", "Planta/Veneno"), species(690, "Skrelp", "Veneno/Água")], species(89, "Muk", "Veneno", 3)),
  route([species(453, "Croagunk", "Veneno/Lutador"), species(451, "Skorupi", "Veneno/Inseto"), species(757, "Salandit", "Veneno/Fogo"), species(591, "Amoonguss", "Planta/Veneno", 3)], species(454, "Toxicroak", "Veneno/Lutador", 3)),
  route([species(747, "Mareanie", "Veneno/Água"), species(691, "Dragalge", "Veneno/Dragão", 3), species(758, "Salazzle", "Veneno/Fogo", 3), species(569, "Garbodor", "Veneno", 3)], species(748, "Toxapex", "Veneno/Água", 3)),
  route([species(451, "Skorupi", "Veneno/Inseto"), species(454, "Toxicroak", "Veneno/Lutador", 3), species(748, "Toxapex", "Veneno/Água", 3), species(407, "Roserade", "Planta/Veneno", 3), species(110, "Weezing", "Veneno", 3)], species(452, "Drapion", "Veneno/Sombrio", 3, "epic"), "final")
];

export const cavernaLines = [
  line(species(41, "Zubat", "Veneno/Voador"), species(42, "Golbat", "Veneno/Voador", 2), species(169, "Crobat", "Veneno/Voador", 3)),
  line(species(74, "Geodude", "Pedra/Terra"), species(75, "Graveler", "Pedra/Terra", 2), species(76, "Golem", "Pedra/Terra", 3)),
  line(species(66, "Machop", "Lutador"), species(67, "Machoke", "Lutador", 2), species(68, "Machamp", "Lutador", 3)),
  line(species(304, "Aron", "Aço/Pedra"), species(305, "Lairon", "Aço/Pedra", 2), species(306, "Aggron", "Aço/Pedra", 3)),
  line(species(524, "Roggenrola", "Pedra"), species(525, "Boldore", "Pedra", 2), species(526, "Gigalith", "Pedra", 3, "epic"))
];

export const praiaLines = [
  line(species(60, "Poliwag", "Água"), species(61, "Poliwhirl", "Água", 2), species(62, "Poliwrath", "Água/Lutador", 3)),
  line(species(116, "Horsea", "Água"), species(117, "Seadra", "Água", 2), species(230, "Kingdra", "Água/Dragão", 3)),
  line(species(270, "Lotad", "Água/Planta"), species(271, "Lombre", "Água/Planta", 2), species(272, "Ludicolo", "Água/Planta", 3)),
  line(species(258, "Mudkip", "Água"), species(259, "Marshtomp", "Água/Terra", 2), species(260, "Swampert", "Água/Terra", 3)),
  line(species(7, "Squirtle", "Água"), species(8, "Wartortle", "Água", 2), species(9, "Blastoise", "Água", 3, "epic"))
];
