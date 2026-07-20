const MACHAMP_SPRITE_PATTERN = /\/(?:back\/)?(?:shiny\/)?68\.gif(?:$|[?#])/;
const STYLE_ID = "machamp-photo-face-style";
const HOST_CLASS = "machamp-photo-face-host";
const OVERLAY_CLASS = "machamp-photo-face-overlay";
const FACE_DATA_URI = "data:image/webp;base64,UklGRoADAABXRUJQVlA4IHQDAAAwEgCdASpAAEAAPpFAnUqlo6KhqBQJWLASCWMAr73sWF6TEH2/A0x1jFtGat8cdOt2757fuwl/WrTHQarNBaW6bzxJ/fzcpC0S8amgH44uYQDF18HhG8xI8PoNpEtH4A6zHjzyE1akVeO+dCMkM6TKWHPcx12latBDH9bqPw/q4ek8grd1Aq3sU9ecPLVtB/LNNS1pv8LvbVQAAP76hgsx/DhX8YB1uZ5j4yeNX++GQjZG2ko6ZzxooaW+EbSNkURj4AWtLb7aEapU2WYo9Mlha6JFtPnifWZpm7LXhdJOAajBuYhvzECDNIT5nu3mJVOI0R3dpO2khHNm4Ggn6wwquzb5Q8FwJwoSjVDyhn+DJhzZjVX4wsyM7qpHahltYbJTcZfGHYD3HhuoqiA9ym4aS2raVXUg1m6WDjXY3Hymow2dwOddFejGZ5N5GbPmYidmhTYVvvo3nccMdX4VYvfdbu1DqtVEukbP996vKNuY8iQYdWbLYblIMYXElWys+UUPOimWg4OcVfnIjchwklqLpr+ASkHwl6onMOsYI85LyyFUi+f0uVkv2OV85zz8p13nkG0Hn1vT9lvpeTZH7CaMFpHccrJ/1SBJ8Nqso4nMO9nCk0V7WqZwuhDzp1U7DRkl2o3CpXqMh7GqH6yjYFWb0MwiYO2gSfzpoZytCIv6FnWT5JIGpFmz49hY7SpDoiwJWXvc6ka9gGpA/rMKzqlCTINwC4DORIVd1NABMSBK10Yqdaj1Zi5TI7hrr65Ka9qapX1No8oc2MpytPt8ufIalu8cIYUbSgMM60rImTGUs5XKGl7Ri3x9h1cy5BBi0NB5BSfTWG4S57OMHfh63unJzTTRKXzgjKRLGQKWFPoXCApeYTzi31yB2mYPbEoyG0SWXqwu5rBdAPKmhc5GwMMf1ompByuabYIquAkN9vC1zJt/IvVlM2Qu7apRcw344J2PZivyhN2h2qPDcYnrVoZsfsohWTozOxdADdBdvOsbj4bdB+XxxWmwBPiutDQuAJRzzqRMP+9fAbsJlyMeZGi9YD069hyJfu+Gpwl2+K8+4QiWdq08tmbP/uCjeuRQKZL5Be6t+Az7iY8Sk09QT0m7tSo6U1NUJ3JIpxsUH1uxccvZKPgfNGdlMsEQbF7zp1QzgYZ3DxuLM+uH+qlcec0C9RxgAA==";

function getMachampContext(image) {
  const walker = image.closest(".scene .walker");
  if (walker) return { host: walker, name: "exploration-player" };

  const approachingEnemy = image.closest(".scene .approaching-enemy");
  if (approachingEnemy) return { host: approachingEnemy, name: "exploration-enemy" };

  const battleCard = image.closest(".pokemon-card");
  if (battleCard) {
    return {
      host: battleCard,
      name: battleCard.classList.contains("enemy-card") ? "battle-enemy" : "battle-player"
    };
  }

  const capturePokemon = image.closest(".capture-pokemon");
  if (capturePokemon) return { host: capturePokemon, name: "capture" };

  return null;
}

function isMachampSprite(image) {
  const source = image.currentSrc || image.src || image.getAttribute("src") || "";
  return MACHAMP_SPRITE_PATTERN.test(source);
}

function findDirectOverlay(host) {
  return [...host.children].find((child) => child.classList?.contains(OVERLAY_CLASS)) || null;
}

function removeOverlay(host) {
  const overlay = findDirectOverlay(host);
  if (overlay) overlay.remove();
  host.classList.remove(HOST_CLASS);
  delete host.dataset.machampPhotoFace;

  if (host.dataset.machampPhotoPositionAdjusted === "true") {
    host.style.removeProperty("position");
    delete host.dataset.machampPhotoPositionAdjusted;
  }
}

function syncMachampImage(image) {
  if (!(image instanceof HTMLImageElement)) return;
  const context = getMachampContext(image);
  if (!context) return;

  const { host, name } = context;
  if (!isMachampSprite(image)) {
    removeOverlay(host);
    return;
  }

  host.classList.add(HOST_CLASS);
  host.dataset.machampPhotoFace = name;

  if (!name.startsWith("exploration") && getComputedStyle(host).position === "static") {
    host.style.position = "relative";
    host.dataset.machampPhotoPositionAdjusted = "true";
  }

  let overlay = findDirectOverlay(host);
  if (!overlay) {
    overlay = document.createElement("span");
    overlay.className = OVERLAY_CLASS;
    overlay.setAttribute("aria-hidden", "true");
    host.appendChild(overlay);
  }
}

function scanForMachamp(root = document) {
  if (root instanceof HTMLImageElement) syncMachampImage(root);
  root.querySelectorAll?.("img").forEach(syncMachampImage);
}

function injectMachampFaceStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .${OVERLAY_CLASS} {
      position: absolute;
      display: block;
      aspect-ratio: 1;
      overflow: hidden;
      pointer-events: none;
      z-index: 40;
      border: 2px solid rgba(14, 20, 26, .85);
      border-radius: 50%;
      background: url("${FACE_DATA_URI}") center / cover no-repeat;
      box-shadow: 0 3px 7px rgba(0, 0, 0, .42);
    }

    .scene .walker.${HOST_CLASS} > .${OVERLAY_CLASS},
    .scene .approaching-enemy.${HOST_CLASS} > .${OVERLAY_CLASS} {
      left: 50%;
      width: clamp(28px, 25%, 58px);
    }

    .scene .walker.${HOST_CLASS} > .${OVERLAY_CLASS} {
      top: 26%;
      animation: machampPhotoWalkPlayer .52s ease-in-out infinite alternate;
    }

    .scene .approaching-enemy.${HOST_CLASS} > .${OVERLAY_CLASS} {
      top: 22%;
      animation: machampPhotoWalkEnemy .4s ease-in-out infinite alternate;
    }

    @keyframes machampPhotoWalkPlayer {
      from { transform: translate(-50%, var(--exploration-ground-offset)) scaleX(-1) rotate(1deg); }
      to { transform: translate(-50%, calc(var(--exploration-ground-offset) - 7px)) scaleX(-1) rotate(-3deg); }
    }

    @keyframes machampPhotoWalkEnemy {
      from { transform: translate(-50%, var(--exploration-ground-offset)) rotate(2deg); }
      to { transform: translate(-50%, calc(var(--exploration-ground-offset) - 7px)) rotate(-3deg); }
    }

    .pokemon-card.${HOST_CLASS} > .${OVERLAY_CLASS} {
      left: 50%;
      top: 13%;
      width: clamp(30px, 21%, 50px);
      transform: translateX(-50%);
    }

    .pokemon-card.player-card.${HOST_CLASS} > .${OVERLAY_CLASS} {
      top: 17%;
      transform: translateX(-50%) scaleX(-1);
    }

    .capture-pokemon.${HOST_CLASS} > .${OVERLAY_CLASS} {
      left: 50%;
      top: 14%;
      width: clamp(32px, 24%, 52px);
      transform: translateX(-50%);
    }
  `;
  document.head.appendChild(style);
}

function startMachampFaceOverlay() {
  injectMachampFaceStyles();
  scanForMachamp();

  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === "attributes") {
        syncMachampImage(record.target);
        return;
      }

      record.addedNodes.forEach((node) => {
        if (node instanceof Element) scanForMachamp(node);
      });
    });
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["src"]
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startMachampFaceOverlay, { once: true });
} else {
  startMachampFaceOverlay();
}
