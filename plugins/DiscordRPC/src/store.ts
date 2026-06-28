const STORAGE_KEY = "discord-rpc-settings";

interface Store {
  enabled: boolean;
  clientId: string;
}

const DEFAULTS: Store = {
  enabled: true,
  clientId: "",
};

function log(...args: unknown[]) {
  console.log("[DiscordRPC:store]", ...args);
}

function load(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = { ...DEFAULTS, ...JSON.parse(raw) };
      log("loaded settings from localStorage:", JSON.stringify(parsed));
      return parsed;
    }
    log("no saved settings, using defaults:", JSON.stringify(DEFAULTS));
  } catch (e) {
    log("failed to load settings:", e);
  }
  return { ...DEFAULTS };
}

function save(data: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    log("saved settings:", JSON.stringify(data));
  } catch (e) {
    log("failed to save settings:", e);
  }
}

const data: Store = load();

export function getSettings(): Store {
  const s = { ...data };
  log("getSettings ->", JSON.stringify(s));
  return s;
}

export function setEnabled(val: boolean) {
  log("setEnabled:", val);
  data.enabled = val;
  save(data);
  notify();
}

export function setClientId(val: string) {
  log("setClientId:", val);
  data.clientId = val;
  save(data);
  notify();
}

type Listener = () => void;
const listeners = new Set<Listener>();

export function onChange(fn: Listener) {
  log("onChange: listener registered");
  listeners.add(fn);
  return () => {
    log("onChange: listener removed");
    listeners.delete(fn);
  };
}

function notify() {
  log("notify: triggering", listeners.size, "listener(s)");
  for (const fn of listeners) {
    try { fn(); } catch (e) { log("notify: listener error:", e); }
  }
}
