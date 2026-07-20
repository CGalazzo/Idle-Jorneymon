import { MAX_TEAM_SIZE } from "../core/game-state.js";
import { clearMegaEquipmentForPokemon } from "./mega.js";

export function moveTeamMember(state, uid, direction) {
  const index = state.team.findIndex((pokemon) => pokemon.uid === uid);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= state.team.length || state.mode === "battle") return false;
  const activeUid = state.team[state.activeTeamIndex]?.uid;
  [state.team[index], state.team[target]] = [state.team[target], state.team[index]];
  state.activeTeamIndex = Math.max(0, state.team.findIndex((pokemon) => pokemon.uid === activeUid));
  return true;
}

export function setTeamPosition(state, uid, targetIndex) {
  if (state.mode === "battle") return false;
  const currentIndex = state.team.findIndex((pokemon) => pokemon.uid === uid);
  const safeTarget = Math.max(0, Math.min(Number(targetIndex), state.team.length - 1));
  if (currentIndex < 0 || currentIndex === safeTarget) return false;
  const activeUid = state.team[state.activeTeamIndex]?.uid;
  const [pokemon] = state.team.splice(currentIndex, 1);
  state.team.splice(safeTarget, 0, pokemon);
  state.activeTeamIndex = Math.max(0, state.team.findIndex((member) => member.uid === activeUid));
  return true;
}

export function setActivePokemon(state, uid) {
  if (state.mode === "battle") return false;
  const index = state.team.findIndex((pokemon) => pokemon.uid === uid);
  if (index < 0 || state.team[index].hp <= 0 || index === state.activeTeamIndex) return false;
  state.activeTeamIndex = index;
  if (state.mode === "approach") state.battleParticipants = [state.team[index].uid];
  return true;
}

export function sendToStorage(state, uid) {
  if (state.team.length <= 1 || state.mode === "battle") return false;
  const index = state.team.findIndex((pokemon) => pokemon.uid === uid);
  if (index < 0) return false;
  const activeUid = state.team[state.activeTeamIndex]?.uid;
  clearMegaEquipmentForPokemon(state, uid);
  state.storage.push(state.team.splice(index, 1)[0]);
  const preservedIndex = state.team.findIndex((pokemon) => pokemon.uid === activeUid);
  state.activeTeamIndex = preservedIndex >= 0 ? preservedIndex : 0;
  if (state.mode === "approach") state.battleParticipants = [state.team[state.activeTeamIndex].uid];
  return true;
}

export function addToTeam(state, uid) {
  if (state.team.length >= MAX_TEAM_SIZE || state.mode === "battle") return false;
  const index = state.storage.findIndex((pokemon) => pokemon.uid === uid);
  if (index < 0) return false;
  state.team.push(state.storage.splice(index, 1)[0]);
  return true;
}
