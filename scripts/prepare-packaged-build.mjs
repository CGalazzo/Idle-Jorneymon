import fs from "node:fs";
import path from "node:path";

const distDir = path.resolve("dist");
const indexPath = path.join(distDir, "index.html");

if (!fs.existsSync(indexPath)) {
  throw new Error("dist/index.html não encontrado. Execute o build do Vite primeiro.");
}

let html = fs.readFileSync(indexPath, "utf8");
html = html
  .replaceAll('href="/', 'href="./')
  .replaceAll('src="/', 'src="./');

fs.writeFileSync(indexPath, html);
console.log("Build preparado para Android e Windows.");
