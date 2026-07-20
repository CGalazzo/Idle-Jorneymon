const STATIC_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const SHOWDOWN_PATTERN = /\/sprites\/pokemon\/other\/showdown\/(back\/)?(shiny\/)?(\d+)\.gif(?:\?.*)?$/i;
const STATIC_BACK_PATTERN = /\/sprites\/pokemon\/back\/(shiny\/)?(\d+)\.png(?:\?.*)?$/i;

function staticSpriteUrl(id, { shiny = false, back = false } = {}) {
  const backPath = back ? "back/" : "";
  const shinyPath = shiny ? "shiny/" : "";
  return `${STATIC_SPRITE_BASE}/${backPath}${shinyPath}${id}.png`;
}

export function installSpriteFallbacks() {
  document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement)) return;

    const customFallback = image.dataset.fallbackSrc;
    if (customFallback && image.dataset.customFallbackApplied !== "true") {
      image.dataset.customFallbackApplied = "true";
      image.src = customFallback;
      return;
    }

    const currentUrl = image.currentSrc || image.src || "";
    const showdownMatch = currentUrl.match(SHOWDOWN_PATTERN);
    if (showdownMatch) {
      const isBack = Boolean(showdownMatch[1]);
      const isShiny = Boolean(showdownMatch[2]);
      const id = showdownMatch[3];
      image.dataset.spriteFallbackStage = isBack ? "static-back" : "static-front";
      image.src = staticSpriteUrl(id, { shiny: isShiny, back: isBack });
      return;
    }

    const staticBackMatch = currentUrl.match(STATIC_BACK_PATTERN);
    if (staticBackMatch && image.dataset.spriteFallbackStage === "static-back") {
      image.dataset.spriteFallbackStage = "static-front";
      image.src = staticSpriteUrl(staticBackMatch[2], { shiny: Boolean(staticBackMatch[1]) });
    }
  }, true);
}
