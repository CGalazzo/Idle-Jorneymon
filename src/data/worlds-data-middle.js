import { line, route, species } from "./worlds-core.js";

export const usinaRoutes = [
  route([species(172, "Pichu", "Elétrico"), species(81, "Magnemite", "Elétrico/Aço"), species(100, "Voltorb", "Elétrico"), species(309, "Electrike", "Elétrico")], species(25, "Pikachu", "Elétrico", 2)),
  route([species(172, "Pichu", "Elétrico"), species(25, "Pikachu", "Elétrico", 2), species(81, "Magnemite", "Elétrico/Aço"), species(479, "Rotom", "Elétrico/Fantasma", 2)], species(26, "Raichu", "Elétrico", 3)),
  route([species(239, "Elekid", "Elétrico"), species(100, "Voltorb", "Elétrico"), species(309, "Electrike", "Elétrico"), species(587, "Emolga", "Elétrico/Voador", 2)], species(125, "Electabuzz", "Elétrico", 2)),
  route([species(239, "Elekid", "Elétrico"), species(125, "Electabuzz", "Elétrico", 2), species(82, "Magneton", "Elétrico/Aço", 2), species(101, "Electrode", "Elétrico", 2)], species(466, "Electivire", "Elétrico", 3)),
  route([species(179, "Mareep", "Elétrico"), species(403, "Shinx", "Elétrico"), species(602, "Tynamo", "Elétrico"), species(310, "Manectric", "Elétrico", 3)], species(180, "Flaaffy", "Elétrico", 2)),
  route([species(179, "Mareep", "Elétrico"), species(180, "Flaaffy", "Elétrico", 2), species(479, "Rotom", "Elétrico/Fantasma", 2), species(462, "Magnezone", "Elétrico/Aço", 3)], species(181, "Ampharos", "Elétrico", 3)),
  route([species(403, "Shinx", "Elétrico"), species(602, "Tynamo", "Elétrico"), species(587, "Emolga", "Elétrico/Voador", 2), species(135, "Jolteon", "Elétrico", 3)], species(404, "Luxio", "Elétrico", 2)),
  route([species(403, "Shinx", "Elétrico"), species(404, "Luxio", "Elétrico", 2), species(135, "Jolteon", "Elétrico", 3), species(466, "Electivire", "Elétrico", 3)], species(405, "Luxray", "Elétrico", 3)),
  route([species(602, "Tynamo", "Elétrico"), species(181, "Ampharos", "Elétrico", 3), species(405, "Luxray", "Elétrico", 3), species(604, "Eelektross", "Elétrico", 3)], species(603, "Eelektrik", "Elétrico", 2)),
  route([species(603, "Eelektrik", "Elétrico", 2), species(604, "Eelektross", "Elétrico", 3), species(462, "Magnezone", "Elétrico/Aço", 3), species(135, "Jolteon", "Elétrico", 3), species(479, "Rotom", "Elétrico/Fantasma", 2)], species(145, "Zapdos", "Elétrico/Voador", 3, "legendary"), "final")
];

export const montanhasLines = [
  line(species(111, "Rhyhorn", "Terra/Pedra"), species(112, "Rhydon", "Terra/Pedra", 2), species(464, "Rhyperior", "Terra/Pedra", 3)),
  line(species(246, "Larvitar", "Pedra/Terra"), species(247, "Pupitar", "Pedra/Terra", 2), species(248, "Tyranitar", "Pedra/Sombrio", 3, "epic")),
  line(species(371, "Bagon", "Dragão"), species(372, "Shelgon", "Dragão", 2), species(373, "Salamence", "Dragão/Voador", 3, "epic")),
  line(species(328, "Trapinch", "Terra"), species(329, "Vibrava", "Terra/Dragão", 2), species(330, "Flygon", "Terra/Dragão", 3)),
  line(species(443, "Gible", "Dragão/Terra"), species(444, "Gabite", "Dragão/Terra", 2), species(445, "Garchomp", "Dragão/Terra", 3, "epic"))
];

export const dojoRoutes = [
  route([species(56, "Mankey", "Lutador"), species(236, "Tyrogue", "Lutador"), species(296, "Makuhita", "Lutador"), species(307, "Meditite", "Lutador/Psíquico")], species(57, "Primeape", "Lutador", 2)),
  route([species(56, "Mankey", "Lutador"), species(57, "Primeape", "Lutador", 2), species(559, "Scraggy", "Sombrio/Lutador"), species(701, "Hawlucha", "Lutador/Voador", 3)], species(979, "Annihilape", "Lutador/Fantasma", 3, "epic")),
  route([species(532, "Timburr", "Lutador"), species(236, "Tyrogue", "Lutador"), species(447, "Riolu", "Lutador"), species(674, "Pancham", "Lutador")], species(533, "Gurdurr", "Lutador", 2)),
  route([species(532, "Timburr", "Lutador"), species(533, "Gurdurr", "Lutador", 2), species(759, "Stufful", "Normal/Lutador"), species(560, "Scrafty", "Sombrio/Lutador", 3)], species(534, "Conkeldurr", "Lutador", 3)),
  route([species(307, "Meditite", "Lutador/Psíquico"), species(106, "Hitmonlee", "Lutador", 3), species(107, "Hitmonchan", "Lutador", 3), species(237, "Hitmontop", "Lutador", 3)], species(308, "Medicham", "Lutador/Psíquico", 3)),
  route([species(296, "Makuhita", "Lutador"), species(759, "Stufful", "Normal/Lutador"), species(559, "Scraggy", "Sombrio/Lutador"), species(701, "Hawlucha", "Lutador/Voador", 3)], species(297, "Hariyama", "Lutador", 3)),
  route([species(447, "Riolu", "Lutador"), species(236, "Tyrogue", "Lutador"), species(760, "Bewear", "Normal/Lutador", 3), species(308, "Medicham", "Lutador/Psíquico", 3)], species(448, "Lucario", "Lutador/Aço", 3)),
  route([species(674, "Pancham", "Lutador"), species(560, "Scrafty", "Sombrio/Lutador", 3), species(701, "Hawlucha", "Lutador/Voador", 3), species(534, "Conkeldurr", "Lutador", 3)], species(675, "Pangoro", "Lutador/Sombrio", 3)),
  route([species(280, "Ralts", "Psíquico/Fada"), species(281, "Kirlia", "Psíquico/Fada", 2), species(448, "Lucario", "Lutador/Aço", 3), species(675, "Pangoro", "Lutador/Sombrio", 3)], species(475, "Gallade", "Psíquico/Lutador", 3, "epic")),
  route([species(979, "Annihilape", "Lutador/Fantasma", 3, "epic"), species(534, "Conkeldurr", "Lutador", 3), species(448, "Lucario", "Lutador/Aço", 3), species(475, "Gallade", "Psíquico/Lutador", 3), species(701, "Hawlucha", "Lutador/Voador", 3)], species(892, "Urshifu", "Lutador/Sombrio", 3, "legendary"), "final")
];

export const geloFinal = species(144, "Articuno", "Gelo/Voador", 3, "legendary");

export const geloLines = [
  line(species(220, "Swinub", "Gelo/Terra"), species(221, "Piloswine", "Gelo/Terra", 2), species(473, "Mamoswine", "Gelo/Terra", 3)),
  line(species(363, "Spheal", "Gelo/Água"), species(364, "Sealeo", "Gelo/Água", 2), species(365, "Walrein", "Gelo/Água", 3)),
  line(species(582, "Vanillite", "Gelo"), species(583, "Vanillish", "Gelo", 2), species(584, "Vanilluxe", "Gelo", 3)),
  line(species(361, "Snorunt", "Gelo"), species(362, "Glalie", "Gelo", 2), species(478, "Froslass", "Gelo/Fantasma", 3)),
  line(species(613, "Cubchoo", "Gelo"), species(614, "Beartic", "Gelo", 2), species(614, "Beartic", "Gelo", 3, "epic"))
];

export const fantasmaFinal = species(487, "Giratina", "Fantasma/Dragão", 3, "legendary");

export const fantasmaLines = [
  line(species(92, "Gastly", "Fantasma/Veneno"), species(93, "Haunter", "Fantasma/Veneno", 2), species(94, "Gengar", "Fantasma/Veneno", 3, "epic")),
  line(species(355, "Duskull", "Fantasma"), species(356, "Dusclops", "Fantasma", 2), species(477, "Dusknoir", "Fantasma", 3)),
  line(species(607, "Litwick", "Fantasma/Fogo"), species(608, "Lampent", "Fantasma/Fogo", 2), species(609, "Chandelure", "Fantasma/Fogo", 3, "epic")),
  line(species(353, "Shuppet", "Fantasma"), species(354, "Banette", "Fantasma", 2), species(354, "Banette", "Fantasma", 3)),
  line(species(562, "Yamask", "Fantasma"), species(563, "Cofagrigus", "Fantasma", 2), species(563, "Cofagrigus", "Fantasma", 3, "epic"))
];
