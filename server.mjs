import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import cors from "cors";

dotenv.config();
const app = express();
app.use(cors());
const port = process.env.PORT || 3001;

let cachedToken = null;
let tokenExpiresAt = 0;

// Refresh access token if expired
async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const authBuffer = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${authBuffer}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
    }),
  });

  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000 - 10000;
  return cachedToken;
}

// Fetch recently played tracks from Spotify
async function getRecentlyPlayed() {
  const token = await getAccessToken();

  const res = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=10",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  const json = await res.json();

  const seen = new Set();
  const deduped = [];

  for (const item of json.items) {
    const trackId = item.track.id;
    if (!seen.has(trackId)) {
      deduped.push({
        trackName: item.track.name,
        album: item.track.album.name,
        artist: item.track.artists.map((a) => a.name).join(", "),
        albumArt: item.track.album.images?.[0]?.url || "",
        playedAt: item.played_at,
      });
      seen.add(trackId);
    }
  }

  return deduped;
}

// Polling endpoint
app.get("/recent", async (req, res) => {
  try {
    const recentTracks = await getRecentlyPlayed();
    res.json(recentTracks);
  } catch (err) {
    console.error("❌ Error in /recent:", err.message);
    res.status(500).json({ error: "Failed to fetch recent tracks" });
  }
});

// Root debug route
app.get("/", (req, res) => {
  res.send("✅ Spotify polling server running");
});

app.listen(port, () => {
  console.log(`🎧 Listening on port ${port}`);
});
