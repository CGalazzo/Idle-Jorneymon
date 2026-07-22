import "../styles/install-app.css";

let deferredInstallPrompt = null;
let installButton = null;
let installDialog = null;
let markupObserver = null;

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches
    || window.matchMedia?.("(display-mode: fullscreen)")?.matches
    || window.navigator.standalone === true;
}

function isAppleMobile() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent || "");
}

function instructionMarkup() {
  if (isAppleMobile()) {
    return `
      <p>No iPhone ou iPad, a instalação é feita pelo menu de compartilhamento do navegador.</p>
      <ol class="install-app-steps">
        <li>1. Toque no botão <strong>Compartilhar</strong>.</li>
        <li>2. Escolha <strong>Adicionar à Tela de Início</strong>.</li>
        <li>3. Confirme em <strong>Adicionar</strong>.</li>
      </ol>`;
  }

  return `
    <p>O navegador não abriu a instalação automática. Use o menu do navegador para instalar o jogo.</p>
    <ol class="install-app-steps">
      <li>1. Abra o menu do navegador.</li>
      <li>2. Escolha <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
      <li>3. Confirme a instalação.</li>
    </ol>`;
}

function ensureDialog() {
  if (installDialog?.isConnected) return installDialog;
  installDialog = document.querySelector("#install-app-dialog");
  if (installDialog) return installDialog;

  document.body.insertAdjacentHTML("beforeend", `
    <dialog id="install-app-dialog" class="install-app-dialog">
      <div class="install-app-card">
        <img src="/icons/app-icon-512.png" alt="Símbolo do Idle Jorneymon" />
        <h2>Instalar Idle Jorneymon</h2>
        <div id="install-app-instructions">${instructionMarkup()}</div>
        <button id="close-install-app" type="button">ENTENDI</button>
      </div>
    </dialog>`);

  installDialog = document.querySelector("#install-app-dialog");
  document.querySelector("#close-install-app")?.addEventListener("click", () => installDialog.close());
  installDialog?.addEventListener("click", (event) => {
    if (event.target === installDialog) installDialog.close();
  });
  return installDialog;
}

function updateButtonState() {
  if (!installButton) return;
  const installed = isStandalone();
  installButton.hidden = installed;
  installButton.disabled = installed;
  installButton.setAttribute("aria-hidden", installed ? "true" : "false");
}

async function requestInstallation() {
  if (isStandalone()) {
    updateButtonState();
    return;
  }

  if (deferredInstallPrompt) {
    const promptEvent = deferredInstallPrompt;
    deferredInstallPrompt = null;
    await promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    updateButtonState();
    return;
  }

  const dialog = ensureDialog();
  const instructions = document.querySelector("#install-app-instructions");
  if (instructions) instructions.innerHTML = instructionMarkup();
  if (!dialog.open) dialog.showModal();
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
    await navigator.serviceWorker.register("/service-worker.js", { scope: "/" });
  } catch (error) {
    console.warn("Idle Jorneymon: não foi possível registrar o modo aplicativo.", error);
  }
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  ensureInstallButton();
  updateButtonState();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  updateButtonState();
});

window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change", updateButtonState);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", observeMarkup, { once: true });
} else {
  observeMarkup();
}

registerServiceWorker();
