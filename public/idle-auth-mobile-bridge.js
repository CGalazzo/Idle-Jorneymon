(() => {
  "use strict";

  const SUPABASE_URL = "https://glvxsqdchvkxiduiltep.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UNhbHcKsJOBewJjNXTp36A__7yMBHvt";
  const PENDING_KEY = "idleJorneymonMobileAuthHandoff";
  const POLL_INTERVAL_MS = 1200;
  const MAX_PENDING_AGE_MS = 20 * 60 * 1000;

  const originalCreateClient = window.supabase?.createClient?.bind(window.supabase);
  if (!originalCreateClient) return;

  const handoffClient = originalCreateClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      flowType: "implicit"
    }
  });

  let pollTimer = null;
  let claiming = false;

  function isInstalledApp() {
    return Boolean(
      window.matchMedia?.("(display-mode: standalone)")?.matches
      || window.navigator.standalone === true
      || document.referrer.startsWith("android-app://")
    );
  }

  function randomToken(byteLength = 32) {
    const bytes = new Uint8Array(byteLength);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  }

  function readPending() {
    try {
      const pending = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
      if (!pending?.code || !pending?.secret || !pending?.createdAt) return null;
      if (Date.now() - Number(pending.createdAt) > MAX_PENDING_AGE_MS) {
        localStorage.removeItem(PENDING_KEY);
        return null;
      }
      return pending;
    } catch {
      return null;
    }
  }

  function writePending(pending) {
    localStorage.setItem(PENDING_KEY, JSON.stringify(pending));
  }

  function clearPending() {
    localStorage.removeItem(PENDING_KEY);
    if (pollTimer) window.clearTimeout(pollTimer);
    pollTimer = null;
  }

  function setStatus(text, type = "") {
    const status = document.querySelector("#idle-auth-status");
    if (!status) return;
    status.textContent = text;
    status.className = `idle-auth-status${type ? ` ${type}` : ""}`;
  }

  function scheduleClaim(delay = POLL_INTERVAL_MS) {
    if (pollTimer) window.clearTimeout(pollTimer);
    pollTimer = window.setTimeout(claimPendingSession, delay);
  }

  async function claimPendingSession() {
    if (claiming) return;
    const pending = readPending();
    if (!pending) return;

    claiming = true;
    try {
      const { data, error } = await handoffClient.rpc("claim_idle_jorneymon_auth_handoff", {
        p_handoff_code: pending.code,
        p_secret: pending.secret
      });

      if (error) {
        scheduleClaim();
        return;
      }

      const session = Array.isArray(data) ? data[0] : data;
      if (!session?.access_token || !session?.refresh_token) {
        scheduleClaim();
        return;
      }

      setStatus("Conectando sua conta…");

      // Neste momento o módulo de persistência já substituiu createClient,
      // então a sessão é gravada no localStorage e no IndexedDB do app.
      const persistentClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
      );
      const { error: sessionError } = await persistentClient.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token
      });

      if (sessionError) {
        setStatus("Não foi possível concluir o login", "error");
        scheduleClaim();
        return;
      }

      clearPending();
      setStatus("Conta Google conectada", "ok");
      window.setTimeout(() => window.location.reload(), 250);
    } finally {
      claiming = false;
    }
  }

  async function startInstalledAppLogin() {
    const code = randomToken(24);
    const secret = randomToken(32);
    writePending({ code, secret, createdAt: Date.now() });
    setStatus("Conclua o login no navegador e volte ao aplicativo…", "warn");

    const callbackUrl = new URL("/auth-callback.html", window.location.origin);
    callbackUrl.searchParams.set("handoff", code);
    callbackUrl.searchParams.set("secret", secret);

    const { data, error } = await handoffClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
        skipBrowserRedirect: true
      }
    });

    if (error || !data?.url) {
      clearPending();
      setStatus("Não foi possível abrir o login Google", "error");
      alert(`Não foi possível abrir o login Google: ${error?.message || "endereço inválido"}`);
      return;
    }

    scheduleClaim(600);
    const opened = window.open(data.url, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(data.url);
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("#idle-google-login");
    if (!button || !isInstalledApp()) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    startInstalledAppLogin();
  }, true);

  window.addEventListener("focus", () => claimPendingSession());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) claimPendingSession();
  });
  window.addEventListener("pageshow", () => claimPendingSession());

  if (readPending()) scheduleClaim(250);
})();
