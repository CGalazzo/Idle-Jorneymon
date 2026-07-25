const STATIC_SPRITE_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
const SHOWDOWN_SPRITE_BASE = "https://play.pokemonshowdown.com/sprites";
const SHOWDOWN_PATTERN = /\/sprites\/pokemon\/other\/showdown\/(back\/)?(shiny\/)?(\d+)\.gif(?:\?.*)?$/i;
const STATIC_BACK_PATTERN = /\/sprites\/pokemon\/back\/(shiny\/)?(\d+)\.png(?:\?.*)?$/i;
const NAMED_SHOWDOWN_ANIMATED_PATTERN = /play\.pokemonshowdown\.com\/sprites\/(ani|ani-back|ani-shiny|ani-back-shiny)\/([^/?]+)\.gif(?:\?.*)?$/i;
const NAMED_SHOWDOWN_STATIC_PATTERN = /play\.pokemonshowdown\.com\/sprites\/(gen5|gen5-back|gen5-shiny|gen5-back-shiny|afd|afd-back|afd-shiny|afd-back-shiny)\/([^/?]+)\.png(?:\?.*)?$/i;

function staticSpriteUrl(id, { shiny = false, back = false } = {}) {
  const backPath = back ? "back/" : "";
  const shinyPath = shiny ? "shiny/" : "";
  return `${STATIC_SPRITE_BASE}/${backPath}${shinyPath}${id}.png`;
}

function namedShowdownUrl(directory, slug) {
  return `${SHOWDOWN_SPRITE_BASE}/${directory}/${slug}.png`;
}

function namedStaticFallbackDirectories(animatedDirectory) {
  return {
    ani: ["gen5", "afd"],
    "ani-back": ["gen5-back", "afd-back", "gen5", "afd"],
    "ani-shiny": ["gen5-shiny", "afd-shiny", "gen5", "afd"],
    "ani-back-shiny": [
      "gen5-back-shiny",
      "afd-back-shiny",
      "gen5-back",
      "afd-back",
      "gen5-shiny",
      "afd-shiny",
      "gen5",
      "afd"
    ]
  }[animatedDirectory] || ["gen5", "afd"];
}

function startNamedFallback(image, animatedDirectory, slug) {
  const directories = namedStaticFallbackDirectories(animatedDirectory);
  image.dataset.namedShowdownFallbackSlug = slug;
  image.dataset.namedShowdownFallbackQueue = directories.slice(1).join(",");
  image.src = namedShowdownUrl(directories[0], slug);
}

function continueNamedFallback(image, slug) {
  const savedSlug = image.dataset.namedShowdownFallbackSlug;
  if (savedSlug && savedSlug !== slug) return false;

  const queue = String(image.dataset.namedShowdownFallbackQueue || "")
    .split(",")
    .filter(Boolean);
  const nextDirectory = queue.shift();
  if (!nextDirectory) return false;

  image.dataset.namedShowdownFallbackQueue = queue.join(",");
  image.src = namedShowdownUrl(nextDirectory, slug);
  return true;
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
      startNamedFallback(image, namedAnimatedMatch[1], namedAnimatedMatch[2]);
      return;
    }

    const namedStaticMatch = currentUrl.match(NAMED_SHOWDOWN_STATIC_PATTERN);
    if (namedStaticMatch) {
      continueNamedFallback(image, namedStaticMatch[2]);
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
