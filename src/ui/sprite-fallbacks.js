const STATIC_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const SHOWDOWN_SPRITE_BASE = "https://play.pokemonshowdown.com/sprites";
const SHOWDOWN_PATTERN = /\/sprites\/pokemon\/other\/showdown\/(back\/)?(shiny\/)?(\d+)\.gif(?:\?.*)?$/i;
const STATIC_BACK_PATTERN = /\/sprites\/pokemon\/back\/(shiny\/)?(\d+)\.png(?:\?.*)?$/i;
const NAMED_SHOWDOWN_ANIMATED_PATTERN = /play\.pokemonshowdown\.com\/sprites\/(ani|ani-back|ani-shiny|ani-back-shiny)\/([^/?]+)\.gif(?:\?.*)?$/i;
const NAMED_SHOWDOWN_STATIC_PATTERN = /play\.pokemonshowdown\.com\/sprites\/(afd|afd-back|afd-shiny|afd-back-shiny)\/([^/?]+)\.png(?:\?.*)?$/i;

function staticSpriteUrl(id, { shiny = false, back = false } = {}) {
  const backPath = back ? "back/" : "";
  const shinyPath = shiny ? "shiny/" : "";
  return `${STATIC_SPRITE_BASE}/${backPath}${shinyPath}${id}.png`;
}

function namedShowdownUrl(directory, slug) {
  return `${SHOWDOWN_SPRITE_BASE}/${directory}/${slug}.png`;
}

function namedStaticDirectory(animatedDirectory) {
  return {
    ani: "afd",
    "ani-back": "afd-back",
    "ani-shiny": "afd-shiny",
    "ani-back-shiny": "afd-back-shiny"
  }[animatedDirectory] || "afd";
}

function nextNamedStaticFallback(directory) {
  if (directory === "afd-back-shiny") return "afd-back";
  if (directory === "afd-shiny") return "afd";
  if (directory === "afd-back") return "afd";
  return null;
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
    const namedAnimatedMatch = currentUrl.match(NAMED_SHOWDOWN_ANIMATED_PATTERN);
    if (namedAnimatedMatch) {
      const directory = namedStaticDirectory(namedAnimatedMatch[1]);
      image.dataset.namedShowdownFallbackDirectory = directory;
      image.src = namedShowdownUrl(directory, namedAnimatedMatch[2]);
      return;
    }

    const namedStaticMatch = currentUrl.match(NAMED_SHOWDOWN_STATIC_PATTERN);
    if (namedStaticMatch) {
      const nextDirectory = nextNamedStaticFallback(namedStaticMatch[1]);
      if (nextDirectory && nextDirectory !== image.dataset.namedShowdownFallbackDirectory) {
        image.dataset.namedShowdownFallbackDirectory = nextDirectory;
        image.src = namedShowdownUrl(nextDirectory, namedStaticMatch[2]);
      }
      return;
    }

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
