import { Tracer, type LunaUnload } from "@luna/core";
import { MediaItem, PlayState, redux } from "@luna/lib";
import { getSettings, onChange } from "./store";
import { setActivity, clearPresence, destroyRPC, initRPC } from "./rpc.native";

export const { trace } = Tracer("[DiscordRPC]");
export const unloads = new Set<LunaUnload>();
export { Settings } from "./Settings";

function log(...args: unknown[]) {
  console.log("[DiscordRPC]", ...args);
}

let updatePresenceSeq = 0;

async function updatePresence(mediaItem?: MediaItem, newPlayState?: string) {
  const seq = ++updatePresenceSeq;
  log("=== updatePresence called (seq:", seq + ") ===");
  const { enabled } = getSettings();

  if (!enabled) return clearPresence();
  const isPlaying = newPlayState !== undefined ? newPlayState === "PLAYING" : PlayState.playing;
  if (!isPlaying) return clearPresence();

  let track: redux.Track | undefined;

  if (mediaItem) {
    track = mediaItem.tidalItem;
  } else {
    const pid = PlayState.playbackContext?.actualProductId;
    if (pid) {
      const storeItem = redux.store.getState().content.mediaItems[pid];
      track = storeItem?.item as redux.Track | undefined;
      log("fast path - store hit:", !!track);
    }
    if (!track) {
      log("fast path miss, loading MediaItem...");
      mediaItem = await MediaItem.fromPlaybackContext();
      if (seq !== updatePresenceSeq) { log("stale, discarding (seq:", seq, "latest:", updatePresenceSeq + ")"); return; }
      if (!mediaItem) return clearPresence();
      track = mediaItem.tidalItem;
    }
  }

  if (seq !== updatePresenceSeq) { log("stale, discarding (seq:", seq, "latest:", updatePresenceSeq + ")"); return; }
  if (!track) return clearPresence();

  const posMs = (PlayState.playTime ?? 0) * 1000;
  const now = PlayState.playbackControls?.latestCurrentTimeSyncTimestamp ?? Date.now();
  const durMs = (track.duration ?? 0) * 1000;
  const title = track.title;
  const artistNames = track.artists?.map(a => a.name).filter(Boolean).join(", ") || "?";
  const coverUuid = track.album?.cover;
  const albumArtUrl = coverUuid ? `https://resources.tidal.com/images/${coverUuid.split("-").join("/")}/1280x1280.jpg` : undefined;

  const trackId = track.id;
  const artistId = track.artists?.[0]?.id;
  const artistWebUrl = artistId ? `https://tidal.com/artist/${artistId}` : undefined;
  const webUrl = track.url ? track.url.replace("http://", "https://") : "https://tidal.com";
  log("title:", title, "artists:", artistNames, "trackId:", trackId, "artistId:", artistId);

  const activity: Record<string, unknown> = {
    name: "Tidal",
    type: 2,
    details: title,
    detailsUrl: webUrl,
    state: artistNames !== "?" ? artistNames : undefined,
    stateUrl: artistWebUrl,
    largeImageKey: albumArtUrl ?? "tidal",
    smallImageKey: "tidal",
    smallImageUrl: "https://tidal.com/",
    startTimestamp: Math.floor((now - posMs) / 1000),
    endTimestamp: Math.floor((now + (durMs - posMs)) / 1000),
    instance: true,
    buttons: [{ label: "Play on Tidal", url: `https://tidal.com/browse/track/${trackId}` }],
  };

  log("built activity:", JSON.stringify(activity, null, 2));
  await setActivity(JSON.parse(JSON.stringify(activity)));
  log("=== updatePresence done (seq:", seq + ") ===");
}

onChange(() => {
  log("=== settings changed ===");
  const { enabled, clientId } = getSettings();
  log("enabled:", enabled, "clientId:", clientId);
  if (enabled && clientId) {
    log("initializing RPC...");
    initRPC(clientId).then(() => {
      log("RPC initialized, updating presence...");
      updatePresence().catch(() => {});
    }).catch(trace.err.withContext("Failed to init RPC"));
  } else {
    log("disabling RPC");
    destroyRPC();
  }
  log("=== settings change handled ===");
});

const updateHandler = (state: unknown, type: string) => {
  log("redux intercept triggered (seek or playback state change)", { state, type });
  const newPlayState = type === "playbackControls/SET_PLAYBACK_STATE" ? (state as string) : undefined;
  updatePresence(undefined, newPlayState).catch(() => {});
};

redux.intercept(["playbackControls/SEEK", "playbackControls/SET_PLAYBACK_STATE"], unloads, updateHandler);
log("redux intercept registered for SEEK and SET_PLAYBACK_STATE");

MediaItem.onMediaTransition(unloads, () => {
  log("media transition detected");
  updatePresence().catch(() => {});
});
log("MediaItem.onMediaTransition registered");

unloads.add(() => {
  log("plugin unloading - destroying RPC");
  destroyRPC();
});

log("plugin loaded, scheduling initial RPC init in setTimeout...");
setTimeout(async () => {
  log("setTimeout fired");
  const { enabled, clientId } = getSettings();
  log("settings: enabled=" + enabled + " clientId=" + clientId);
  if (enabled && clientId) {
    try {
      log("calling initRPC...");
      await initRPC(clientId);
      log("initRPC succeeded, calling updatePresence...");
      await updatePresence();
      log("initial presence update complete");
    } catch (e) {
      trace.err.withContext("Failed to init RPC")(e);
      log("FATAL: initRPC failed:", e);
    }
  } else {
    log("plugin disabled, not initializing RPC");
  }
}, 1000);
