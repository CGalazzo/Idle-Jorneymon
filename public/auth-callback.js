(() => {
  "use strict";

  const SUPABASE_URL = "https://glvxsqdchvkxiduiltep.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UNhbHcKsJOBewJjNXTp36A__7yMBHvt";

  const statusElement = document.querySelector("#callback-status");
  const closeButton = document.querySelector("#callback-close");

  function setStatus(text, type = "") {
    if (!statusElement) return;
    statusElement.textContent = text;
    statusElement.className = `status${type ? ` ${type}` : ""}`;
  }

  function showCloseButton() {
    if (closeButton) closeButton.hidden = false;
  }

  function readTokensFromHash() {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    return {
      accessToken: hash.get("access_token") || "",
      refreshToken: hash.get("refresh_token") || "",
      error: hash.get("error_description") || hash.get("error") || ""
    };
  }

  async function finishLogin() {
    const query = new URLSearchParams(window.location.search);
    const handoffCode = query.get("handoff") || "";
    const secret = query.get("secret") || "";
    const tokens = readTokensFromHash();

    if (tokens.error) throw new Error(tokens.error);
    if (!handoffCode || !secret) throw new Error("O aplicativo não forneceu os dados de retorno do login.");
    if (!tokens.accessToken || !tokens.refreshToken) throw new Error("O Google não devolveu uma sessão válida. Tente entrar novamente pelo aplicativo.");

    const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    });

    const { data, error } = await client.rpc("create_idle_jorneymon_auth_handoff", {
      p_handoff_code: handoffCode,
      p_secret: secret,
      p_access_token: tokens.accessToken,
      p_refresh_token: tokens.refreshToken
    });

    if (error || data !== true) {
      throw new Error(error?.message || "Não foi possível entregar a conta ao aplicativo.");
    }

    window.history.replaceState({}, document.title, "/auth-callback.html");
    setStatus("Conta conectada! Volte ao aplicativo para continuar.", "ok");
    showCloseButton();

    window.setTimeout(() => {
      try {
        window.close();
      } catch {
        // Alguns navegadores exigem que a pessoa use o botão de voltar ao app.
      }
    }, 900);
  }

  closeButton?.addEventListener("click", () => {
    try {
      window.close();
    } catch {
      window.history.back();
    }
  });

  finishLogin().catch((error) => {
    window.history.replaceState({}, document.title, "/auth-callback.html");
    setStatus(error?.message || "Não foi possível concluir o login Google.", "error");
    showCloseButton();
  });
})();
