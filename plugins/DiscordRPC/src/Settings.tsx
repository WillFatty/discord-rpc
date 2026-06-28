import React from "react";
import { LunaSettings, LunaSwitchSetting, LunaTextSetting } from "@luna/ui";
import { setEnabled, setClientId, getSettings } from "./store";

function log(...args: unknown[]) {
  console.log("[DiscordRPC:settings]", ...args);
}

export const Settings = () => {
  const s = getSettings();
  const [enabled, setEnabledState] = React.useState(s.enabled);
  const [clientId, setClientIdState] = React.useState(s.clientId);

  log("Settings component rendered, enabled:", s.enabled, "clientId:", s.clientId);

  return (
    <LunaSettings>
      <LunaSwitchSetting
        title="Enabled"
        desc="Show currently playing Tidal track on Discord"
        checked={enabled}
        onChange={(_, checked) => {
          const val = checked ?? false;
          log("Switch toggled to:", val);
          setEnabled(val);
          setEnabledState(val);
        }}
      />
      <LunaTextSetting
        title="Discord Client ID (Required)"
        desc="Create an application at discord.com/developers/applications and copy its Application ID"
        placeholder="0000000000000000000"
        value={clientId}
        onChange={(e) => {
          const val = e.target.value;
          log("Client ID changed to:", val);
          setClientId(val);
          setClientIdState(val);
        }}
      />
    </LunaSettings>
  );
};
