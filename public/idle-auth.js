(() => {
  "use strict";

  const SUPABASE_URL = "https://glvxsqdchvkxiduiltep.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UNhbHcKsJOBewJjNXTp36A__7yMBHvt";
  const CLOUD_TABLE = "idle_jorneymon_saves";
  const SAVE_KEY = "idle-jorneymon-save";
  const LINK_PREFIX = "idleJorneymonCloudLinked:";
  const SYNC_DELAY_MS = 1800;

  let client = null;
  let currentUser = null;
  let syncTimer = null;
  let syncing = false;
  let panelOpen = false;

  function localSave() {
    try {
      return JSON.parse(localStorage.getItem(SAVE_KEY) || "null");
    } catch {
      return null;
    }
  }

  function linkedKey(user = currentUser) {
    return user ? `${LINK_PREFIX}${user.id}` : "";
  }

  function isLinked() {
    const key = linkedKey();
    return Boolean(key && localStorage.getItem(key) === "1");
  }

  function setLinked(value) {
    const key = linkedKey();
    if (!key) return;
    if (value) localStorage.setItem(key, "1");
    else localStorage.removeItem(key);
  }

  function profile() {
    const metadata = currentUser?.user_metadata || {};
    return {
      name: metadata.full_name || metadata.name || currentUser?.email?.split("@")[0] || "Treinador",
      email: currentUser?.email || "",
      avatar: metadata.avatar_url || metadata.picture || ""
    };
  }

  function status(text, type = "") {
    const element = document.querySelector("#idle-auth-status");
    if (!element) return;
    element.textContent = text;
    element.className = `idle-auth-status${type ? ` ${type}` : ""}`;
  }

  function placeAccountButton() {
    const button = document.querySelector("#idle-account-button");
    const screen = document.querySelector("#journey-menu-screen");
    const card = screen?.querySelector(".journey-menu-card");
    if (!button || !screen || !card) return false;

    let stack = screen.querySelector(":scope > .journey-menu-stack");
    if (!stack) {
      stack = document.createElement("div");
      stack.className = "journey-menu-stack";
      card.before(stack);
      stack.appendChild(card);
    }

    if (button.parentElement !== stack) stack.appendChild(button);
    button.hidden = panelOpen;
    return true;
  }

  function ensureInterface() {
    if (document.querySelector("#idle-auth-panel")) {
      placeAccountButton();
      return;
    }

    document.body.insertAdjacentHTML("beforeend", `
      <button id="idle-account-button" class="idle-account-button" type="button" hidden>👤 Conta Google</button>
      <aside id="idle-auth-panel" class="idle-auth-panel" aria-live="polite" hidden>
        <button id="idle-auth-close" class="idle-auth-close" type="button" aria-label="Fechar conta">×</button>
        <section id="idle-auth-signed-out">
          <div class="idle-auth-head"><span class="idle-auth-icon">G</span><div><strong>Proteja sua jornada</strong><small>Entre com Google para vincular o save e continuar em outros dispositivos.</small></div></div>
          <button id="idle-google-login" class="idle-google-button" type="button"><span class="idle-google-mark">G</span>Entrar com Google</button>
        </section>
        <section id="idle-auth-signed-in" hidden>
          <div class="idle-auth-profile"><img id="idle-auth-avatar" class="idle-auth-avatar" alt="" referrerpolicy="no-referrer"><div><strong id="idle-auth-name">Conta conectada</strong><small id="idle-auth-email"></small><span id="idle-auth-status" class="idle-auth-status">Verificando save…</span></div></div>
          <div class="idle-auth-actions">
            <button id="idle-link-save" class="primary" type="button">Vincular save atual</button>
            <button id="idle-load-save" type="button">Carregar save da conta</button>
            <button id="idle-sync-save" type="button">Sincronizar agora</button>
            <button id="idle-logout" class="danger" type="button">Sair</button>
          </div>
        </section>
      </aside>`);

    document.querySelector("#idle-account-button")?.addEventListener("click", () => setPanelOpen(true));
    document.querySelector("#idle-auth-close")?.addEventListener("click", () => setPanelOpen(false));
    document.querySelector("#idle-google-login")?.addEventListener("click", loginGoogle);
    document.querySelector("#idle-link-save")?.addEventListener("click", linkCurrentSave);
    document.querySelector("#idle-load-save")?.addEventListener("click", loadCloudSave);
    document.querySelector("#idle-sync-save")?.addEventListener("click", () => pushCloudSave(true));
    document.querySelector("#idle-logout")?.addEventListener("click", logout);
    placeAccountButton();
  }

  function observeMenuPlacement() {
    if (placeAccountButton()) return;
    const observer = new MutationObserver(() => {
      if (!placeAccountButton()) return;
      observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function setPanelOpen(open) {
    panelOpen = Boolean(open);
    const panel = document.querySelector("#idle-auth-panel");
    const button = document.querySelector("#idle-account-button");
    if (panel) panel.hidden = !panelOpen;
    if (button) button.hidden = panelOpen;
    placeAccountButton();
  }

  function render() {
    ensureInterface();
    placeAccountButton();
    const signedOut = document.querySelector("#idle-auth-signed-out");
    const signedIn = document.querySelector("#idle-auth-signed-in");
    const accountButton = document.querySelector("#idle-account-button");
    if (signedOut) signedOut.hidden = Boolean(currentUser);
    if (signedIn) signedIn.hidden = !currentUser;

    if (!currentUser) {
      if (accountButton) accountButton.textContent = "👤 Entrar com Google";
      return;
    }

    const data = profile();
    const avatar = document.querySelector("#idle-auth-avatar");
    const name = document.querySelector("#idle-auth-name");
    const email = document.querySelector("#idle-auth-email");
    if (name) name.textContent = data.name;
    if (email) email.textContent = data.email;
    if (avatar) {
      if (data.avatar) {
        avatar.src = data.avatar;
        avatar.hidden = false;
      } else {
        avatar.removeAttribute("src");
        avatar.hidden = true;
      }
    }
    if (accountButton) accountButton.textContent = `☁️ Conta Google · ${data.name.split(" ")[0]}`;
    status(isLinked() ? "Save vinculado à conta" : "Conta conectada; escolha qual save usar", isLinked() ? "ok" : "warn");
  }

  async function fetchCloudSave() {
    if (!client || !currentUser) return { data: null, error: new Error("Entre com Google primeiro.") };
    return client.from(CLOUD_TABLE).select("save_data,updated_at").eq("user_id", currentUser.id).maybeSingle();
  }

  function saveSummary(save) {
    if (!save) return "Nenhum progresso";
    const active = Array.isArray(save.team) ? save.team[save.activeTeamIndex || 0] || save.team[0] : null;
    const route = Math.max(1, Number(save.area?.routeNumber) || Number(save.journey?.routeIndex) + 1 || 1);
    const difficulty = Math.max(1, Number(save.journey?.worldIndex) + 1 || 1);
    return `${active?.isShiny ? "✨ " : ""}${active?.name || "Equipe"} · NV. ${active?.level || 1} · Dificuldade ${difficulty}, Rota ${route}`;
  }

  async function loginGoogle() {
    if (!client) return alert("O serviço de login ainda está carregando.");
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}${window.location.pathname}` }
    });
    if (error) alert(`Não foi possível abrir o login Google: ${error.message}`);
  }

  async function logout() {
    if (!client) return;
    await client.auth.signOut();
    currentUser = null;
    render();
  }

  async function pushCloudSave(showFeedback = false) {
    if (syncing || !client || !currentUser || !isLinked()) return false;
    const snapshot = localSave();
    if (!snapshot?.hasStarted) {
      if (showFeedback) alert("Não há uma jornada local iniciada para sincronizar.");
      return false;
    }

    syncing = true;
    status("Sincronizando…");
    const { error } = await client.from(CLOUD_TABLE).upsert({
      user_id: currentUser.id,
      save_data: snapshot,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    syncing = false;

    if (error) {
      status("Não foi possível sincronizar", "error");
      if (showFeedback) alert(error.message || "Não foi possível salvar na conta.");
      return false;
    }

    status("Save sincronizado agora", "ok");
    if (showFeedback) alert("Progresso salvo na sua conta Google.");
    return true;
  }

  function queueCloudSave() {
    if (!currentUser || !isLinked()) return;
    window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(() => pushCloudSave(false), SYNC_DELAY_MS);
  }

  async function linkCurrentSave() {
    if (!currentUser) return loginGoogle();
    const snapshot = localSave();
    if (!snapshot?.hasStarted) return alert("Comece uma jornada ou carregue um save da conta primeiro.");

    const { data, error } = await fetchCloudSave();
    if (error) return alert(error.message || "Não foi possível verificar o save da conta.");
    if (data?.save_data) {
      const replace = window.confirm(`Já existe um save nesta conta:\n${saveSummary(data.save_data)}\n\nDeseja substituir esse save pelo progresso atual deste navegador?`);
      if (!replace) return;
    }

    setLinked(true);
    await pushCloudSave(true);
    render();
  }

  async function loadCloudSave() {
    if (!currentUser) return loginGoogle();
    const { data, error } = await fetchCloudSave();
    if (error) return alert(error.message || "Não foi possível carregar o save da conta.");
    if (!data?.save_data) return alert("Esta conta ainda não possui um save do Idle Jorneymon.");

    const local = localSave();
    if (local?.hasStarted) {
      const replace = window.confirm(`Save local atual:\n${saveSummary(local)}\n\nSave da conta:\n${saveSummary(data.save_data)}\n\nDeseja substituir o save local pelo save da conta?`);
      if (!replace) return;
    }

    localStorage.setItem(SAVE_KEY, JSON.stringify(data.save_data));
    setLinked(true);
    status("Save da conta carregado", "ok");
    window.location.reload();
  }

  function patchLocalStorage() {
    if (window.__idleJorneymonCloudStoragePatched) return;
    window.__idleJorneymonCloudStoragePatched = true;
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      originalSetItem.call(this, key, value);
      if (this === localStorage && key === SAVE_KEY) queueCloudSave();
    };
  }

  async function initialize() {
    ensureInterface();
    observeMenuPlacement();
    patchLocalStorage();

    if (!window.supabase?.createClient) {
      status("Serviço de login indisponível", "error");
      return;
    }

    client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const { data } = await client.auth.getSession();
    currentUser = data.session?.user || null;
    render();

    if (currentUser) {
      const local = localSave();
      const cloud = await fetchCloudSave();
      if (!local?.hasStarted && cloud.data?.save_data) {
        localStorage.setItem(SAVE_KEY, JSON.stringify(cloud.data.save_data));
        setLinked(true);
        window.location.reload();
        return;
      }
      if (isLinked()) queueCloudSave();
      else setPanelOpen(true);
    }

    client.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user || null;
      render();
      if (currentUser) setPanelOpen(true);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
