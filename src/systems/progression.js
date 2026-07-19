import { addLog } from "../core/game-state.js";
import { experienceToNextLevel, recalculatePokemonForLevel } from "../data/pokemon.js";

function grantPokemonExperience(state, pokemon, amount) {
  pokemon.xp += amount;
  addLog(state, `${pokemon.name} recebeu ${amount} XP.`);

  while (pokemon.level < 100 && pokemon.xp >= pokemon.xpToNext) {
    pokemon.xp -= pokemon.xpToNext;
    pokemon.level += 1;
    pokemon.xpToNext = experienceToNextLevel(pokemon.level);
    recalculatePokemonForLevel(pokemon, true);
    addLog(state, `${pokemon.name} subiu para o nível ${pokemon.level}!`);
  }

  if (pokemon.level >= 100) {
    pokemon.level = 100;
    pokemon.xp = 0;
    pokemon.xpToNext = experienceToNextLevel(100);
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
