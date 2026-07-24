(() => {
  const ITEM_BASE = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items";
  const MEGA_SYMBOL = "/assets/mega-evolution-symbol.svg?v=20260724-1";

  const ITEM_FILE_MAP = new Map([
    ["griseous-core", "griseous-orb"],
    ["red-orb", "red-orb"],
    ["blue-orb", "blue-orb"],
    ["reveal-glass", "reveal-glass"],
    ["rusted-sword", "rusted-sword"],
    ["rusted-shield", "rusted-shield"],
    ["adamant-crystal", "adamant-crystal"],
    ["lustrous-globe", "lustrous-globe"]
  ]);

  const CUSTOM_MEGA_STONES = new Set(["rayquazite"]);

  function fileIdFromSource(source) {
    const match = String(source || "").match(/\/([^/?]+)\.png(?:\?|$)/i);
    return match?.[1] || "";
  }

  function isMegaInventoryHeading(image) {
    const heading = image.closest(".inventory-heading");
    return Boolean(heading && /mega pedras/i.test(heading.textContent || ""));
  }

  function replaceSource(image, source) {
    if (!source || image.getAttribute("src") === source) return;
    image.setAttribute("src", source);
  }

  function repairItemImage(image) {
    if (!(image instanceof HTMLImageElement) || !image.classList.contains("item-sprite")) return;

    if (isMegaInventoryHeading(image)) {
      image.classList.add("mega-evolution-symbol");
      image.removeAttribute("data-fallback-src");
      image.alt = "Símbolo da Mega Evolução";
      replaceSource(image, MEGA_SYMBOL);
      return;
    }

    const currentId = fileIdFromSource(image.getAttribute("src"));
    if (CUSTOM_MEGA_STONES.has(currentId)) {
      image.setAttribute("data-fallback-src", MEGA_SYMBOL);
      replaceSource(image, MEGA_SYMBOL);
      return;
    }

    const mappedId = ITEM_FILE_MAP.get(currentId);
    if (mappedId && mappedId !== currentId) {
      image.setAttribute("data-fallback-src", MEGA_SYMBOL);
      replaceSource(image, `${ITEM_BASE}/${mappedId}.png`);
    }

    if (!image.dataset.itemSpriteRepairInstalled) {
      image.dataset.itemSpriteRepairInstalled = "true";
      image.addEventListener("error", () => {
        if (image.getAttribute("src") !== MEGA_SYMBOL) replaceSource(image, MEGA_SYMBOL);
      });
    }
  }

  function repairAll(root = document) {
    if (root instanceof HTMLImageElement) repairItemImage(root);
    root.querySelectorAll?.("img.item-sprite").forEach(repairItemImage);
  }

  function install() {
    const style = document.createElement("style");
    style.textContent = `
      img.item-sprite.mega-evolution-symbol {
        object-fit: contain !important;
        filter: none !important;
      }
    `;
    document.head.appendChild(style);

    repairAll();
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) repairAll(node);
        });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install, { once: true });
  else install();
})();
