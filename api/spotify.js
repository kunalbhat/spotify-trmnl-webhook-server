// server.mjs - Vercel-compatible using serverless functions (via API Routes)

import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const {
  SPOTIFY_REFRESH_TOKEN,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  TRMNL_API_KEY,
  TRMNL_WEBHOOK_URL,
} = process.env;

const basicAuth = Buffer.from(
  `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
).toString("base64");

async function getAccessToken() {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  const data = await res.json();
  return data.access_token;
}

async function fetchRecentlyPlayed(accessToken) {
  const res = await fetch(
    "https://api.spotify.com/v1/me/player/recently-played?limit=10",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json();
}

function transformToTMRNLFormat(items) {
  return items.map(({ track, played_at }) => ({
    title: track.name,
    subtitle: track.artists.map((a) => a.name).join(", "),
    image_url: track.album.images[0]?.url,
    meta: new Date(played_at).toLocaleString(),
  }));
}

async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const token = await getAccessToken();
    const data = await fetchRecentlyPlayed(token);
    const payload = transformToTMRNLFormat(data.items);

    const tmrnlRes = await fetch(TRMNL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-plugin-key": TRMNL_API_KEY,
      },
      body: JSON.stringify({ items: payload }),
    });

    const responseText = await tmrnlRes.text();
    res
      .status(200)
      .json({ success: true, sent: payload.length, tmrnlRes: responseText });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: err.message });
  }
}

export default handler;
