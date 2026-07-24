import { loadMegaFormData } from "./data/mega-data.js";

const megaDataRequest = loadMegaFormData();
await Promise.race([
  megaDataRequest,
  new Promise((resolve) => window.setTimeout(resolve, 6000))
]);
await import("./main.js");
