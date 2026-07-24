export const FORM_ITEMS = [
  {
    id: "red-orb",
    name: "Orbe Vermelho",
    price: 36000,
    description: "Desperta o poder ancestral de Groudon e ativa sua Reversão Primal.",
    forms: [
      { baseSpeciesId: 383, baseName: "Groudon", formId: 10078, formName: "Groudon Primal", type: "Terra/Fogo" }
    ]
  },
  {
    id: "blue-orb",
    name: "Orbe Azul",
    price: 36000,
    description: "Desperta o poder ancestral de Kyogre e ativa sua Reversão Primal.",
    forms: [
      { baseSpeciesId: 382, baseName: "Kyogre", formId: 10077, formName: "Kyogre Primal", type: "Água" }
    ]
  },
  {
    id: "griseous-core",
    name: "Núcleo Griseous",
    price: 30000,
    description: "Permite que Giratina assuma permanentemente sua Forma Origem enquanto estiver equipado.",
    forms: [
      { baseSpeciesId: 487, baseName: "Giratina", formId: 10007, formName: "Giratina Forma Origem", type: "Fantasma/Dragão" }
    ]
  },
  {
    id: "reveal-glass",
    name: "Espelho da Verdade",
    price: 28000,
    description: "Revela a Forma Therian das Forças da Natureza. Pode ficar equipado em apenas uma delas por vez.",
    forms: [
      { baseSpeciesId: 641, baseName: "Tornadus", formId: 10019, formName: "Tornadus Forma Therian", type: "Voador" },
      { baseSpeciesId: 642, baseName: "Thundurus", formId: 10020, formName: "Thundurus Forma Therian", type: "Elétrico/Voador" },
      { baseSpeciesId: 645, baseName: "Landorus", formId: 10021, formName: "Landorus Forma Therian", type: "Terra/Voador" }
    ]
  },
  {
    id: "rusted-sword",
    name: "Espada Enferrujada",
    price: 34000,
    description: "Restaura a Espada Coroada de Zacian, mudando sua forma, tipo e atributos.",
    forms: [
      { baseSpeciesId: 888, baseName: "Zacian", formId: 10188, formName: "Zacian Espada Coroada", type: "Fada/Aço" }
    ]
  },
  {
    id: "rusted-shield",
    name: "Escudo Enferrujado",
    price: 34000,
    description: "Restaura o Escudo Coroado de Zamazenta, mudando sua forma, tipo e atributos.",
    forms: [
      { baseSpeciesId: 889, baseName: "Zamazenta", formId: 10189, formName: "Zamazenta Escudo Coroado", type: "Lutador/Aço" }
    ]
  },
  {
    id: "adamant-crystal",
    name: "Cristal Adamante",
    price: 30000,
    description: "Faz Dialga assumir sua Forma Origem com os atributos oficiais dessa forma.",
    forms: [
      { baseSpeciesId: 483, baseName: "Dialga", formId: 10245, formName: "Dialga Forma Origem", type: "Aço/Dragão" }
    ]
  },
  {
    id: "lustrous-globe",
    name: "Globo Lustroso",
    price: 30000,
    description: "Faz Palkia assumir sua Forma Origem com os atributos oficiais dessa forma.",
    forms: [
      { baseSpeciesId: 484, baseName: "Palkia", formId: 10246, formName: "Palkia Forma Origem", type: "Água/Dragão" }
    ]
  }
];

export const FORM_ITEM_FORM_IDS = [...new Set(
  FORM_ITEMS.flatMap((item) => item.forms.map((form) => form.formId))
)];

export function getFormItem(itemId) {
  return FORM_ITEMS.find((item) => item.id === String(itemId || "")) || null;
}

export function getFormItemForm(itemId, speciesId) {
  const item = getFormItem(itemId);
  return item?.forms.find((form) => form.baseSpeciesId === Number(speciesId)) || null;
}

export function getFormItemsForSpecies(speciesId) {
  const id = Number(speciesId);
  return FORM_ITEMS.filter((item) => item.forms.some((form) => form.baseSpeciesId === id));
}
