(() => {
  "use strict";

  const SUPABASE_URL = "https://glvxsqdchvkxiduiltep.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_UNhbHcKsJOBewJjNXTp36A__7yMBHvt";
  const NATIVE_USER_AGENT_MARKER = "IdleJorneymonApp/";
  const NATIVE_CALLBACK_PATH = "/auth-native-callback.html";

  function isNativeAndroidApp() {
    return navigator.userAgent.includes(NATIVE_USER_AGENT_MARKER);
  }

  function setStatus(text, type = "") {
    const element = document.querySelector("#idle-auth-status");
    if (!element) return;
    element.textContent = text;
    element.className = `idle-auth-status${type ? ` ${type}` : ""}`;
  }

  if (!isNativeAndroidApp()) return;

  document.documentElement.dataset.idleNativeApp = "true";

  let urlClient = null;
  let sessionClient = null;
  let loginInProgress = false;

  function getUrlClient() {
    if (!urlClient) {
      urlClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
          flowType: "implicit"
        }
      });
    }
    return urlClient;
  }

  function getSessionClient() {
    if (!sessionClient) {
      sessionClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    }
    return sessionClient;
  }

  async function startNativeGoogleLogin() {
    if (loginInProgress) return;
    if (!window.supabase?.createClient) {
      alert("O serviço de login ainda está carregando. Tente novamente.");
      return;
    }

    loginInProgress = true;
    setStatus("Abrindo o Google dentro do aplicativo…", "warn");

    try {
      const redirectTo = new URL(NATIVE_CALLBACK_PATH, window.location.origin).toString();
      const { data, error } = await getUrlClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            prompt: "select_account"
          }
        }
      });

      if (error || !data?.url) {
        throw new Error(error?.message || "Não foi possível iniciar o login Google.");
      }

      // O WebView Android intercepta esta navegação e abre uma aba segura sobre o app.
      window.location.assign(data.url);
    } catch (error) {
      loginInProgress = false;
      setStatus("Não foi possível abrir o Google", "error");
      alert(error?.message || "Não foi possível abrir o login Google.");
    }
  }

  window.completeIdleNativeGoogleLogin = async function(accessToken, refreshToken) {
    if (!accessToken || !refreshToken) {
      loginInProgress = false;
      setStatus("O Google não devolveu uma sessão válida", "error");
      return;
    }

    setStatus("Conectando sua conta…");

    const { error } = await getSessionClient().auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    loginInProgress = false;

    if (error) {
      setStatus("Não foi possível concluir o login", "error");
      alert(`Não foi possível concluir o login Google: ${error.message}`);
      return;
    }

    localStorage.setItem("idleJorneymonGooglePanelIntroduced", "1");
    setStatus("Conta Google conectada", "ok");
    window.setTimeout(() => window.location.reload(), 180);
  };

  window.failIdleNativeGoogleLogin = function(message) {
    loginInProgress = false;
    setStatus(message || "O login Google foi cancelado", "error");
  };

  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("#idle-google-login");
    if (!button) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    startNativeGoogleLogin();
  }, true);
})();
