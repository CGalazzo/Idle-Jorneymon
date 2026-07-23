import { POKEDEX_SPECIES } from "../data/pokemon.js";
import { ensureEeveeEvolutionChoices } from "../systems/progression.js";

let latestState = null;
let latestCanOpen = false;

function findOwnedPokemon(state, uid) {
  return [...(state.team || []), ...(state.storage || [])].find((pokemon) => pokemon.uid === uid) || null;
}

export function enhanceEeveeEvolutionMarkup() {
  if (document.querySelector("#eevee-evolution-dialog")) return;
  document.querySelector("#app")?.insertAdjacentHTML("beforeend", `
    <dialog id="eevee-evolution-dialog" class="eevee-evolution-dialog" aria-labelledby="eevee-evolution-title">
      <div class="eevee-evolution-card">
        <small>ESCOLHA DE EVOLUÇÃO</small>
        <h2 id="eevee-evolution-title">Eevee pode evoluir!</h2>
        <div class="eevee-evolution-pokemon">
          <span><img id="eevee-choice-current-sprite" alt="Eevee" /></span>
          <b>→</b>
          <span class="target"><img id="eevee-choice-target-sprite" alt="Evolução do Eevee" /></span>
        </div>
        <p id="eevee-evolution-copy"></p>
        <div class="eevee-evolution-actions">
          <button id="accept-eevee-evolution" class="accept-eevee-evolution"></button>
          <button id="decline-eevee-evolution" class="decline-eevee-evolution">NÃO</button>
        </div>
        <em>A jornada ficará pausada até você escolher.</em>
      </div>
    </dialog>
  `);
}

export function renderEeveeEvolutionChoice(state, canOpen = true) {
  latestState = state;
  latestCanOpen = canOpen;
  ensureEeveeEvolutionChoices(state);

  const dialog = document.querySelector("#eevee-evolution-dialog");
  if (!dialog) return;
  const choice = state.pendingEvolutionChoices?.[0];

  if (!choice) {
    if (dialog.open) dialog.close();
    return;
  }

  const pokemon = findOwnedPokemon(state, choice.pokemonUid);
  const target = POKEDEX_SPECIES.find((entry) => entry.id === Number(choice.targetId));
  if (!pokemon || !target) return;

  document.querySelector("#eevee-choice-current-sprite").src = pokemon.sprite;
  document.querySelector("#eevee-choice-current-sprite").alt = pokemon.name;
  document.querySelector("#eevee-choice-target-sprite").src = target.sprite;
  document.querySelector("#eevee-choice-target-sprite").alt = target.name;
  document.querySelector("#eevee-evolution-copy").textContent = `${pokemon.name} chegou ao nível ${pokemon.level} em ${choice.environmentName}. Deseja evoluir para ${target.name}?`;
  document.querySelector("#accept-eevee-evolution").textContent = `SIM, EVOLUIR PARA ${target.name.toUpperCase()}`;

  if (canOpen && !dialog.open) dialog.showModal();
}

if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && latestState) renderEeveeEvolutionChoice(latestState, latestCanOpen);
  });
}
