import { addLog } from "../core/game-state.js";
import { experienceToNextLevel } from "../data/pokemon.js";

function grantPokemonExperience(state, pokemon, amount) {
  pokemon.xp += amount;
  addLog(state, `${pokemon.name} recebeu ${amount} XP.`);

  while (pokemon.xp >= pokemon.xpToNext) {
    pokemon.xp -= pokemon.xpToNext;
    pokemon.level += 1;
    pokemon.xpToNext = experienceToNextLevel(pokemon.level);
    pokemon.maxHp += 4;
    pokemon.attack += 2;
    pokemon.defense += 1;
    pokemon.hp = pokemon.maxHp;
    addLog(state, `${pokemon.name} subiu para o nível ${pokemon.level}!`);
  }
}

export function grantTeamExperience(state, amount) {
  const participants = new Set(state.battleParticipants);
  state.team.forEach((pokemon) => {
    if (participants.has(pokemon.uid)) {
      grantPokemonExperience(state, pokemon, amount);
    } else if (pokemon.hp > 0) {
      grantPokemonExperience(state, pokemon, Math.max(1, Math.round(amount * 0.5)));
    }
  });
}
