import "../styles/install-app.css";

const RELEASE_BASE = "https://github.com/CGalazzo/Idle-Jorneymon/releases/download/app-latest";
const RELEASE_PAGE = "https://github.com/CGalazzo/Idle-Jorneymon/releases/tag/app-latest";
const DOWNLOADS = {
  android: `${RELEASE_BASE}/Idle-Jorneymon-Android.apk`,
  windows: `${RELEASE_BASE}/Idle-Jorneymon-Windows-Setup.exe`
};

let installButton = null;
let markupObserver = null;

function isPackagedApp() {
  return /IdleJorneymonApp\//i.test(window.navigator.userAgent || "")
    || window.matchMedia?.("(display-mode: standalone)")?.matches
    || window.matchMedia?.("(display-mode: fullscreen)")?.matches
    || window.navigator.standalone === true;
}

function currentPlatform() {
  const userAgent = window.navigator.userAgent || "";
  if (/Android/i.test(userAgent)) return "android";
  if (/Windows NT/i.test(userAgent)) return "windows";
  return "other";
}

function updateButtonState() {
  if (!installButton) return;

  const installed = isPackagedApp();
  installButton.hidden = installed;
  installButton.disabled = installed;
  installButton.setAttribute("aria-hidden", installed ? "true" : "false");
  if (installed) return;

  const platform = currentPlatform();
  const title = installButton.querySelector("strong");
  const subtitle = installButton.querySelector("small");

  if (platform === "android") {
    if (title) title.textContent = "BAIXAR APK";
    if (subtitle) subtitle.textContent = "Instalar o jogo no Android";
  } else if (platform === "windows") {
    if (title) title.textContent = "BAIXAR PARA WINDOWS";
    if (subtitle) subtitle.textContent = "Baixar o instalador do jogo";
  } else {
    if (title) title.textContent = "BAIXAR APP";
    if (subtitle) subtitle.textContent = "Disponível para Android e Windows";
  }
}

function requestDownload() {
  if (isPackagedApp()) {
    updateButtonState();
    return;
  }

  const platform = currentPlatform();
  const target = DOWNLOADS[platform] || RELEASE_PAGE;
  window.location.assign(target);
}

function ensureInstallButton() {
  if (installButton?.isConnected) return true;
  installButton = document.querySelector("#install-app-button");
  if (installButton) {
    updateButtonState();
    return true;
  }

  const actions = document.querySelector(".journey-menu-actions");
  if (!actions) return false;

  actions.insertAdjacentHTML("beforeend", `
    <button id="install-app-button" class="journey-menu-action install-app-button" type="button">
      <strong>BAIXAR APP</strong>
      <small>Disponível para Android e Windows</small>
    </button>`);

  installButton = document.querySelector("#install-app-button");
  installButton?.addEventListener("click", requestDownload);
  updateButtonState();
  return true;
}

function observeMarkup() {
  if (ensureInstallButton()) return;
  markupObserver = new MutationObserver(() => {
    if (!ensureInstallButton()) return;
    markupObserver?.disconnect();
    markupObserver = null;
  });
  markupObserver.observe(document.body, { childList: true, subtree: true });
}

window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change", updateButtonState);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", observeMarkup, { once: true });
} else {
  observeMarkup();
}
