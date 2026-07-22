import "../styles/install-app.css";

const INSTALLED_KEY = "idle-jorneymon-app-installed";
const PROMPT_WAIT_MS = 3500;

let deferredInstallPrompt = null;
let installButton = null;
let markupObserver = null;
let installInProgress = false;
let promptWaiters = [];

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches
    || window.matchMedia?.("(display-mode: fullscreen)")?.matches
    || window.navigator.standalone === true;
}

function wasInstalledHere() {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberInstallation() {
  try {
    localStorage.setItem(INSTALLED_KEY, "1");
  } catch {
    // A instalação continua válida mesmo quando o armazenamento está indisponível.
  }
}

function isInstalled() {
  return isStandalone() || wasInstalledHere();
}

function updateButtonState() {
  if (!installButton) return;
  const installed = isInstalled();
  installButton.hidden = installed;
  installButton.disabled = installed || installInProgress;
  installButton.setAttribute("aria-hidden", installed ? "true" : "false");

  const title = installButton.querySelector("strong");
  const subtitle = installButton.querySelector("small");
  if (title) title.textContent = "BAIXAR APP";
  if (subtitle) subtitle.textContent = "Instalar no celular ou computador";
}

function resolvePromptWaiters(promptEvent) {
  const waiters = promptWaiters;
  promptWaiters = [];
  waiters.forEach((resolve) => resolve(promptEvent));
}

function waitForPrompt(timeoutMs = PROMPT_WAIT_MS) {
  if (deferredInstallPrompt) return Promise.resolve(deferredInstallPrompt);

  return new Promise((resolve) => {
    const finish = (promptEvent = null) => {
      window.clearTimeout(timeout);
      resolve(promptEvent);
    };
    const timeout = window.setTimeout(() => {
      promptWaiters = promptWaiters.filter((waiter) => waiter !== finish);
      resolve(null);
    }, timeoutMs);
    promptWaiters.push(finish);
  });
}

async function refreshInstallability() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  } catch {
    // O botão continua disponível; o navegador poderá entregar o prompt depois.
  }
}

async function requestInstallation() {
  if (isInstalled() || installInProgress) {
    updateButtonState();
    return;
  }

  installInProgress = true;
  updateButtonState();

  try {
    let promptEvent = deferredInstallPrompt;
    if (!promptEvent) {
      await refreshInstallability();
      promptEvent = deferredInstallPrompt || await waitForPrompt();
    }

    if (!promptEvent) return;

    deferredInstallPrompt = null;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice.catch(() => null);
    if (choice?.outcome === "accepted") {
      rememberInstallation();
    }
  } catch (error) {
    console.warn("Idle Jorneymon: a instalação não pôde ser iniciada.", error);
  } finally {
    installInProgress = false;
    updateButtonState();
  }
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
      <small>Instalar no celular ou computador</small>
    </button>`);

  installButton = document.querySelector("#install-app-button");
  installButton?.addEventListener("click", requestInstallation);
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

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("./service-worker.js", { scope: "./" });
    await navigator.serviceWorker.ready;
  } catch (error) {
    console.warn("Idle Jorneymon: não foi possível registrar o modo aplicativo.", error);
  }
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  resolvePromptWaiters(event);
  ensureInstallButton();
  updateButtonState();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  rememberInstallation();
  resolvePromptWaiters(null);
  updateButtonState();
});

window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change", updateButtonState);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", observeMarkup, { once: true });
} else {
  observeMarkup();
}

registerServiceWorker();
