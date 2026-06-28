# Discord Tidal RPC Widget

Shows your current Tidal track as a **"Listening to"** activity on your Discord profile via [eddyAPI](https://github.com/espeon/neptune-plugins).

## Prerequisites

- [Tidal desktop app](https://tidal.com/) with the [eddyAPI Neptune plugin](https://espeon.github.io/neptune-plugins/eddyAPI) installed and running
- [Discord desktop app](https://discord.com/download) running
- Node.js 18+

## Setup

### 1. Create a Discord Application

1. Go to https://discord.com/developers/applications
2. Click **New Application**, name it (e.g. "Tidal RPC")
3. Copy the **Client ID** from the OAuth2 / General Info page
4. Go to **Rich Presence** → **Art Assets**, upload:
   - `tidal` — a Tidal logo (512x512 recommended)
   - `play` — a play icon (optional)
   - `pause` — a pause icon (optional)

### 2. Configure

```bash
# Copy the env template
cp .env.example .env
```

Edit `.env`:

```
DISCORD_CLIENT_ID=your_client_id_here
EDDY_API_URL=http://localhost:3665
EDDY_API_KEY=
POLL_INTERVAL=5000
```

### 3. Install & Run

```bash
npm install
npm start
```

---

## How it works

The script polls eddyAPI's `/now-playing` endpoint every 5 seconds and updates your Discord Rich Presence with the current track info (title, artist, album art, play/pause state, elapsed time).
