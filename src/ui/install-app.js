import "../styles/install-app.css";

let deferredInstallPrompt = null;
let installButton = null;
let installDialog = null;
let confirmInstallButton = null;
let markupObserver = null;
let pendingInstallRequest = false;
let prepareTimeout = null;

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches
    || window.matchMedia?.("(display-mode: fullscreen)")?.matches
    || window.navigator.standalone === true;
}

function supportsDirectInstallation() {
  return "onbeforeinstallprompt" in window;
}

function setButtonCopy(title, subtitle) {
  if (!installButton) return;
  const strong = installButton.querySelector("strong");
  const small = installButton.querySelector("small");
  if (strong) strong.textContent = title;
  if (small) small.textContent = subtitle;
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
        <p>Confirme para instalar o jogo como aplicativo neste dispositivo.</p>
        <button id="confirm-install-app" class="confirm-install-app" type="button">CONFIRMAR INSTALAÇÃO</button>
      </div>
    </dialog>`);

  installDialog = document.querySelector("#install-app-dialog");
  confirmInstallButton = document.querySelector("#confirm-install-app");
  confirmInstallButton?.addEventListener("click", confirmInstallation);
  installDialog?.addEventListener("cancel", (event) => event.preventDefault());
  return installDialog;
}

function updateButtonState() {
  if (!installButton) return;

  if (isStandalone()) {
    installButton.hidden = true;
    installButton.disabled = true;
    installButton.setAttribute("aria-hidden", "true");
    return;
  }

  if (!supportsDirectInstallation()) {
    installButton.hidden = true;
    installButton.disabled = true;
    installButton.setAttribute("aria-hidden", "true");
    return;
  }

  installButton.hidden = false;
  installButton.setAttribute("aria-hidden", "false");

  if (deferredInstallPrompt) {
    installButton.disabled = false;
    setButtonCopy("BAIXAR APP", "Instalar no celular ou computador");
    return;
  }

  installButton.disabled = true;
  setButtonCopy("PREPARANDO APP", "Aguarde a instalação ficar disponível");
}

function openConfirmation() {
  if (!deferredInstallPrompt || isStandalone()) return false;
  const dialog = ensureDialog();
  confirmInstallButton = document.querySelector("#confirm-install-app");
  if (confirmInstallButton) {
    confirmInstallButton.disabled = false;
    confirmInstallButton.textContent = "CONFIRMAR INSTALAÇÃO";
  }
  if (!dialog.open) dialog.showModal();
  return true;
}

function waitForInstallPrompt() {
  pendingInstallRequest = true;
  installButton.disabled = true;
  setButtonCopy("PREPARANDO APP", "Aguarde alguns segundos");
  window.clearTimeout(prepareTimeout);
  prepareTimeout = window.setTimeout(() => {
    if (!pendingInstallRequest || deferredInstallPrompt) return;
    pendingInstallRequest = false;
    setButtonCopy("BAIXAR APP", "Instalação ainda não disponível");
    installButton.disabled = true;
  }, 8000);
}

function requestInstallation() {
  if (isStandalone()) {
    updateButtonState();
    return;
  }

  if (deferredInstallPrompt) {
    openConfirmation();
    return;
  }

  waitForInstallPrompt();
}

async function confirmInstallation() {
  const promptEvent = deferredInstallPrompt;
  if (!promptEvent || isStandalone()) {
    installDialog?.close();
    updateButtonState();
    return;
  }

  confirmInstallButton.disabled = true;
  confirmInstallButton.textContent = "ABRINDO INSTALAÇÃO...";
  deferredInstallPrompt = null;

  try {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice.catch(() => null);
    installDialog?.close();

    if (choice?.outcome === "accepted") {
      installButton.hidden = true;
      installButton.disabled = true;
      return;
    }

    setButtonCopy("BAIXAR APP", "Recarregue a página para tentar novamente");
    installButton.disabled = true;
  } catch (error) {
    console.warn("Idle Jorneymon: a instalação não pôde ser iniciada.", error);
    installDialog?.close();
    setButtonCopy("BAIXAR APP", "Recarregue a página para tentar novamente");
    installButton.disabled = true;
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
    <button id="install-app-button" class="journey-menu-action install-app-button" type="button" disabled>
      <strong>PREPARANDO APP</strong>
      <small>Aguarde a instalação ficar disponível</small>
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
  if (!("serviceWorker" in navigator)) return false;
  try {
    await navigator.serviceWorker.register("/service-worker.js?v=4", { scope: "/" });
    await navigator.serviceWorker.ready;
    return true;
  } catch (error) {
    console.warn("Idle Jorneymon: não foi possível preparar a instalação do aplicativo.", error);
    return false;
  }
}

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  window.clearTimeout(prepareTimeout);
  ensureInstallButton();
  updateButtonState();

  if (pendingInstallRequest) {
    pendingInstallRequest = false;
    openConfirmation();
  }
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  pendingInstallRequest = false;
  installDialog?.close();
  updateButtonState();
});

window.matchMedia?.("(display-mode: standalone)")?.addEventListener?.("change", updateButtonState);

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", observeMarkup, { once: true });
} else {
  observeMarkup();
}

registerServiceWorker().then(() => updateButtonState());
