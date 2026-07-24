(() => {
  "use strict";

  const INTRODUCED_KEY = "idleJorneymonGooglePanelIntroduced";
  const LINK_PREFIX = "idleJorneymonCloudLinked:";
  let manualOpenUntil = 0;
  let scheduled = false;

  function hasLinkedAccount() {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || "";
      if (key.startsWith(LINK_PREFIX) && localStorage.getItem(key) === "1") return true;
    }
    return false;
  }

  function markIntroduced() {
    localStorage.setItem(INTRODUCED_KEY, "1");
  }

  function wasIntroduced() {
    return localStorage.getItem(INTRODUCED_KEY) === "1" || hasLinkedAccount();
  }

  function hideAutomaticPanel() {
    const panel = document.querySelector("#idle-auth-panel");
    const accountButton = document.querySelector("#idle-account-button");
    if (!panel || panel.hidden) return;
    if (Date.now() <= manualOpenUntil) return;

    if (!wasIntroduced()) {
      markIntroduced();
      return;
    }

    panel.hidden = true;
    if (accountButton) accountButton.hidden = false;
  }

  function scheduleCheck() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      hideAutomaticPanel();
    });
  }

  function closeAfterLink() {
    let attempts = 0;
    const check = window.setInterval(() => {
      attempts += 1;
      if (hasLinkedAccount()) {
        window.clearInterval(check);
        markIntroduced();
        const panel = document.querySelector("#idle-auth-panel");
        const accountButton = document.querySelector("#idle-account-button");
        if (panel) panel.hidden = true;
        if (accountButton) accountButton.hidden = false;
        return;
      }
      if (attempts >= 20) window.clearInterval(check);
    }, 250);
  }

  function install() {
    if (hasLinkedAccount()) markIntroduced();

    document.addEventListener("pointerdown", (event) => {
      if (event.target.closest?.("#idle-account-button")) {
        manualOpenUntil = Date.now() + 5000;
        return;
      }

      if (event.target.closest?.("#idle-link-save")) {
        markIntroduced();
        closeAfterLink();
      }
    }, true);

    document.addEventListener("click", (event) => {
      if (event.target.closest?.("#idle-account-button")) {
        manualOpenUntil = Date.now() + 5000;
      }
    }, true);

    const observer = new MutationObserver(scheduleCheck);
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden"]
    });

    scheduleCheck();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
