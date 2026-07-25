import { loadMegaFormData, MEGA_STONES } from "./data/mega-data.js";

const DISABLED_MEGA_STONE_IDS = new Set([
  "lucarionite-z",
  "garchompite-z"
]);

for (let index = MEGA_STONES.length - 1; index >= 0; index -= 1) {
  if (DISABLED_MEGA_STONE_IDS.has(MEGA_STONES[index]?.id)) {
    MEGA_STONES.splice(index, 1);
  }
}

loadMegaFormData();
await import("./main.js");