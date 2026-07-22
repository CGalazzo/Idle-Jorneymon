const fs = require("fs");
const path = require("path");
const pngToIco = require("png-to-ico");

async function main() {
  const source = path.resolve(__dirname, "..", "..", "public", "icons", "app-icon-512.png");
  const outputDir = path.resolve(__dirname, "..", "build");
  const output = path.join(outputDir, "icon.ico");
  fs.mkdirSync(outputDir, { recursive: true });
  const icon = await pngToIco(source);
  fs.writeFileSync(output, icon);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
