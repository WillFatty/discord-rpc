import { Client } from "@xhayper/discord-rpc";

let rpcClient: Client | null = null;
let currentClientId = "";

function log(...args: unknown[]) {
  console.log("[DiscordRPC:native]", ...args);
}

async function getClient() {
  if (rpcClient?.transport?.isConnected && rpcClient.user) {
    log("getClient: reusing existing connected client");
    return rpcClient;
  }
  log("getClient: no valid client, creating new one (clientId:", currentClientId + ")");
  if (rpcClient) {
    log("getClient: destroying stale client");
    await rpcClient.destroy().catch(() => {});
  }
  rpcClient = new Client({ clientId: currentClientId });
  try {
    log("getClient: calling connect()...");
    await rpcClient.connect();
    log("getClient: connect() succeeded, transport connected:", rpcClient.transport?.isConnected, "user:", rpcClient.user ? "set" : "null");
  } catch (err) {
    log("getClient: connect() FAILED:", err);
    throw err;
  }
  return rpcClient;
}

export async function initRPC(clientId: string) {
  log("initRPC called with clientId:", clientId);
  currentClientId = clientId;
  try {
    const c = await getClient();
    log("initRPC: got client, user:", c.user ? "present" : "null", "transport connected:", c.transport?.isConnected);
  } catch (err) {
    log("initRPC: FAILED -", err);
    throw err;
  }
}

export async function destroyRPC() {
  log("destroyRPC called");
  if (rpcClient) {
    log("destroyRPC: clearing activity and destroying client");
    try { rpcClient.user?.clearActivity(); log("destroyRPC: activity cleared"); } catch (e) { log("destroyRPC: clearActivity error:", e); }
    try { await rpcClient.destroy(); log("destroyRPC: client destroyed"); } catch (e) { log("destroyRPC: destroy error:", e); }
    rpcClient = null;
    log("destroyRPC: done");
  } else {
    log("destroyRPC: no client to destroy");
  }
}

export async function setActivity(activity: Record<string, unknown>) {
  log("setActivity called with:", JSON.stringify(activity));
  try {
    const c = await getClient();
    log("setActivity: got client, user:", c.user ? "present" : "null");
    if (c.user) {
      try {
        await c.user.setActivity(activity);
        log("setActivity: setActivity() call completed");
      } catch (e) {
        log("setActivity: user.setActivity() threw:", e);
      }
    } else {
      log("setActivity: SKIPPING - no user object on client");
    }
  } catch (err) {
    log("setActivity: FAILED to get client:", err);
  }
}

export async function clearPresence() {
  log("clearPresence called");
  try {
    if (rpcClient?.user) {
      rpcClient.user.clearActivity();
      log("clearPresence: activity cleared");
    } else {
      log("clearPresence: no user to clear");
    }
  } catch (e) {
    log("clearPresence: error:", e);
  }
}
