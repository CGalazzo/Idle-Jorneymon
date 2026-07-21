import bosque from "./scene-assets/bosque.js";
import floresta from "./scene-assets/floresta.js";
import caverna from "./scene-assets/caverna.js";
import praia from "./scene-assets/praia.js";
import montanhas from "./scene-assets/montanhas.js";
import cavernaGelo from "./scene-assets/caverna-gelo.js";
import torreFantasma from "./scene-assets/torre-fantasma.js";
import vulcao from "./scene-assets/vulcao.js";
import planaltoIndigo from "./scene-assets/planalto-indigo.js";
import pantano from "./scene-assets/pantano.js";
import usinaEletrica from "./scene-assets/usina-eletrica.js";
import dojoLuta from "./scene-assets/dojo-luta.js";
import torreIlusoes from "./scene-assets/torre-ilusoes.js";
import ilhaFlutuante from "./scene-assets/ilha-flutuante.js";
import "../styles/new-worlds.css";

const webp = (data) => `data:image/webp;base64,${data}`;
const elite4GoldBackground = "https://raw.githubusercontent.com/CGalazzo/Idle-Jorneymon/main/src/data/scene-assets/elite-4-gold.webp?v=20260721-elite4-fix";

export const SCENE_BACKGROUNDS = {
  bosque: webp(bosque),
  floresta: webp(floresta),
  pantano: webp(pantano),
  caverna: webp(caverna),
  praia: webp(praia),
  "usina-eletrica": webp(usinaEletrica),
  montanhas: webp(montanhas),
  "dojo-luta": webp(dojoLuta),
  "caverna-gelo": webp(cavernaGelo),
  "torre-fantasma": webp(torreFantasma),
  "torre-ilusoes": webp(torreIlusoes),
  vulcao: webp(vulcao),
  "ilha-flutuante": webp(ilhaFlutuante),
  "planalto-indigo": webp(planaltoIndigo),
  "elite-4": elite4GoldBackground
};
