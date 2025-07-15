// api/spotify.js
import fetch from "node-fetch";

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } =
  process.env;

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
  const seen = new Set();
  return items
    .filter(({ track }) => {
      if (seen.has(track.id)) return false;
      seen.add(track.id);
      return true;
    })
    .map(({ track, played_at }, index, arr) => ({
      title: track.name,
      subtitle: track.artists.map((a) => a.name).join(", "),
      image_url: track.album.images[0]?.url,
      meta: `Track ${arr.length - index}`,
    }));
}

// Vercel handler
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const token = await getAccessToken();
    const data = await fetchRecentlyPlayed(token);
    const payload = transformToTMRNLFormat(data.items);

    res.status(200).json({ items: payload });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
}
