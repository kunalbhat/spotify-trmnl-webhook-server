// webhook-server.mjs
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REFRESH_TOKEN,
  TRMNL_WEBHOOK_URL,
  TRMNL_API_KEY,
} = process.env;

let cachedToken = null;
let tokenExpiresAt = 0;
let lastTrackId = null;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const auth = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000 - 10000;
  return cachedToken;
}

async function pollSpotify() {
  try {
    const token = await getAccessToken();
    const res = await fetch(
      "https://api.spotify.com/v1/me/player/currently-playing",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (res.status === 204) return; // no active playback

    const data = await res.json();
    const trackId = data?.item?.id;

    if (!trackId || trackId === lastTrackId) return;
    lastTrackId = trackId;

    const payload = {
      apiKey: TRMNL_API_KEY,
      data: {
        artist: data?.item?.artists?.map((a) => a.name).join(", "),
        track: data?.item?.name,
        album: data?.item?.album?.name,
        albumYear: data?.item?.album?.release_date?.split("-")[0],
        albumArt: data?.item?.album?.images?.[0]?.url,
        isPlaying: data?.is_playing,
      },
    };

    await fetch(TRMNL_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    console.log("✅ Sent update to TRMNL:", payload.data);
  } catch (err) {
    console.error("❌ Error polling Spotify or sending to TRMNL:", err);
  }
}

// Start polling every 30s
setInterval(pollSpotify, 30000);

app.get("/health", (_, res) => res.send("Webhook server running."));

app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on http://localhost:${PORT}`);
});
