import { MAX_TEAM_SIZE } from "../core/game-state.js";

export function moveTeamMember(state, uid, direction) {
  const index = state.team.findIndex((pokemon) => pokemon.uid === uid);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= state.team.length || state.mode === "battle") return false;
  [state.team[index], state.team[target]] = [state.team[target], state.team[index]];
  state.activeTeamIndex = 0;
  return true;
}

export function sendToStorage(state, uid) {
  if (state.team.length <= 1 || state.mode === "battle") return false;
  const index = state.team.findIndex((pokemon) => pokemon.uid === uid);
  if (index < 0) return false;
  state.storage.push(state.team.splice(index, 1)[0]);
  state.activeTeamIndex = 0;
  return true;
}

export function addToTeam(state, uid) {
  if (state.team.length >= MAX_TEAM_SIZE || state.mode === "battle") return false;
  const index = state.storage.findIndex((pokemon) => pokemon.uid === uid);
  if (index < 0) return false;
  state.team.push(state.storage.splice(index, 1)[0]);
  return true;
}
