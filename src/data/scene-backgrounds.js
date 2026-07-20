import bosque from "./scene-assets/bosque.js";
import floresta from "./scene-assets/floresta.js";
import caverna from "./scene-assets/caverna.js";
import praia from "./scene-assets/praia.js";
import montanhas from "./scene-assets/montanhas.js";
import cavernaGelo from "./scene-assets/caverna-gelo.js";
import torreFantasma from "./scene-assets/torre-fantasma.js";
import vulcao from "./scene-assets/vulcao.js";
import planaltoIndigo from "./scene-assets/planalto-indigo.js";
import elite4 from "./scene-assets/elite-4.js";

const webp = (data) => `data:image/webp;base64,${data}`;

export const SCENE_BACKGROUNDS = {
  bosque: webp(bosque),
  floresta: webp(floresta),
  caverna: webp(caverna),
  praia: webp(praia),
  montanhas: webp(montanhas),
  "caverna-gelo": webp(cavernaGelo),
  "torre-fantasma": webp(torreFantasma),
  vulcao: webp(vulcao),
  "planalto-indigo": webp(planaltoIndigo),
  "elite-4": webp(elite4)
};
