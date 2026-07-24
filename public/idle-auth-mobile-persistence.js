(() => {
  "use strict";

  const DATABASE_NAME = "idle-jorneymon-auth";
  const DATABASE_VERSION = 1;
  const STORE_NAME = "supabase-session";
  let databasePromise = null;

  function openDatabase() {
    if (!window.indexedDB) return Promise.resolve(null);
    if (databasePromise) return databasePromise;

    databasePromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains(STORE_NAME)) {
            database.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(null);
        request.onblocked = () => resolve(null);
      } catch {
        resolve(null);
      }
    });

    return databasePromise;
  }

  async function readIndexedValue(key) {
    const database = await openDatabase();
    if (!database) return null;

    return new Promise((resolve) => {
      try {
        const transaction = database.transaction(STORE_NAME, "readonly");
        const request = transaction.objectStore(STORE_NAME).get(key);
        request.onsuccess = () => resolve(typeof request.result === "string" ? request.result : null);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function writeIndexedValue(key, value) {
    const database = await openDatabase();
    if (!database) return;

    await new Promise((resolve) => {
      try {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).put(String(value), key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
        transaction.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  async function removeIndexedValue(key) {
    const database = await openDatabase();
    if (!database) return;

    await new Promise((resolve) => {
      try {
        const transaction = database.transaction(STORE_NAME, "readwrite");
        transaction.objectStore(STORE_NAME).delete(key);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
        transaction.onabort = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  const durableStorage = {
    async getItem(key) {
      let localValue = null;
      try {
        localValue = window.localStorage.getItem(key);
      } catch {
        localValue = null;
      }

      if (localValue) {
        await writeIndexedValue(key, localValue);
        return localValue;
      }

      const indexedValue = await readIndexedValue(key);
      if (indexedValue) {
        try {
          window.localStorage.setItem(key, indexedValue);
        } catch {
          // O IndexedDB continua sendo a fonte persistente quando o localStorage falha.
        }
      }
      return indexedValue;
    },

    async setItem(key, value) {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // Alguns navegadores móveis limitam o localStorage no modo instalado.
      }
      await writeIndexedValue(key, value);
    },

    async removeItem(key) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Continua removendo a cópia persistente abaixo.
      }
      await removeIndexedValue(key);
    }
  };

  function installPersistentSupabaseClient() {
    const supabase = window.supabase;
    if (!supabase?.createClient || supabase.__idleJorneymonPersistentAuthInstalled) return false;

    const originalCreateClient = supabase.createClient.bind(supabase);
    supabase.createClient = (url, publishableKey, options = {}) => {
      const authOptions = options.auth || {};
      return originalCreateClient(url, publishableKey, {
        ...options,
        auth: {
          ...authOptions,
          storage: authOptions.storage || durableStorage,
          persistSession: authOptions.persistSession ?? true,
          autoRefreshToken: authOptions.autoRefreshToken ?? true,
          detectSessionInUrl: authOptions.detectSessionInUrl ?? true,
          flowType: authOptions.flowType || "pkce"
        }
      });
    };

    supabase.__idleJorneymonPersistentAuthInstalled = true;
    return true;
  }

  if (!installPersistentSupabaseClient()) {
    const timer = window.setInterval(() => {
      if (!installPersistentSupabaseClient()) return;
      window.clearInterval(timer);
    }, 25);
    window.setTimeout(() => window.clearInterval(timer), 5000);
  }
})();
