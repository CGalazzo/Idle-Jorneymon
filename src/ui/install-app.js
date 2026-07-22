import "../styles/install-app.css";

const APK_URL = "https://github.com/CGalazzo/Idle-Jorneymon/releases/download/app-latest/Idle-Jorneymon-Android.apk";
const APP_USER_AGENT = /IdleJorneymonApp\//i;

let downloadButton = null;
let pendingFrame = 0;

function isAndroidApp() {
  return APP_USER_AGENT.test(window.navigator.userAgent || "");
}

function removeLegacyPwa() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => {});
  }

  if ("caches" in window) {
    window.caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith("idle-jorneymon-"))
          .map((name) => window.caches.delete(name))
      ))
      .catch(() => {});
  }
}

function journeyMenuIsVisible() {
  const menuActions = document.querySelector(".journey-menu-actions");
  if (!menuActions) return false;

  const style = window.getComputedStyle(menuActions);
  return style.display !== "none"
    && style.visibility !== "hidden"
    && menuActions.getClientRects().length > 0;
}

function ensureDownloadButton() {
  if (downloadButton?.isConnected) return downloadButton;

  downloadButton = document.createElement("a");
  downloadButton.id = "android-apk-download";
  downloadButton.className = "android-apk-download";
  downloadButton.href = APK_URL;
  downloadButton.download = "Idle-Jorneymon-Android.apk";
  downloadButton.setAttribute("aria-label", "Baixar o APK do Idle Jorneymon para Android");
  downloadButton.innerHTML = `
    <span class="android-apk-download__icon" aria-hidden="true">↓</span>
    <span>BAIXAR APK</span>
  `;

  document.body.appendChild(downloadButton);
  return downloadButton;
}

function updateVisibility() {
  pendingFrame = 0;
  const button = ensureDownloadButton();
  button.hidden = isAndroidApp() || !journeyMenuIsVisible();
}

function scheduleVisibilityUpdate() {
  if (pendingFrame) return;
  pendingFrame = window.requestAnimationFrame(updateVisibility);
}

function start() {
  removeLegacyPwa();
  updateVisibility();

  const observer = new MutationObserver(scheduleVisibilityUpdate);
  observer.observe(document.body, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ["class", "hidden", "style"]
  });

  window.addEventListener("pageshow", scheduleVisibilityUpdate);
  window.addEventListener("resize", scheduleVisibilityUpdate);
  window.addEventListener("orientationchange", scheduleVisibilityUpdate);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
  start();
}
