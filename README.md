# 🎵 TRMNL + Spotify Plugin: Recently Played Display

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/import)
![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Powered by Spotify](https://img.shields.io/badge/Powered%20by-Spotify-1ED760.svg)

This project exposes a lightweight serverless API that returns a JSON payload of your **recently played Spotify tracks**, formatted for use in a [TRMNL](https://usetrmnl.com/) private plugin. TRMNL polls the endpoint periodically and displays an album art grid on the device.

## 🔧 Tech Stack

- **Vercel Serverless Function** (`api/spotify.js`)
- **Spotify Web API** (OAuth with refresh token)
- **JSON output** formatted to TRMNL’s expected schema
- No front-end or Express server required

---

## 🧩 What It Does

- Authenticates via Spotify refresh token
- Fetches the last 10 recently played tracks
- Transforms data into:
  - `title`: track name
  - `subtitle`: artist(s)
  - `image_url`: album cover
  - `meta`: timestamp (played_at)
- Returns as JSON at a public `/api/spotify` endpoint

### Example Output

```json
{
  "items": [
    {
      "title": "Peace Piece",
      "subtitle": "Bill Evans",
      "image_url": "https://...",
      "meta": "7/14/2025, 2:10 PM"
    }
  ]
}
```

---

## 🖼️ Example Use Case

The plugin can be configured in TRMNL with polling every 5–15 minutes, rendering a grid wall of album art with track info underneath — ideal for a semi-static visual display that evolves throughout the day.

---

## 🚀 Setup

1. Clone this repo
2. Add a `.env` file locally (or define in Vercel Dashboard):

   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   SPOTIFY_REFRESH_TOKEN=your_refresh_token
   ```

3. Deploy to [Vercel](https://vercel.com)
4. Use your live endpoint in your TRMNL plugin:

   ```
   https://your-app.vercel.app/api/spotify
   ```

---

## 🧠 Ideas for Expansion

- Show top albums or artists from `top/tracks` or `top/artists`
- Group album wall by day
- Visualize listening stats or genre bubbles
- Add caching to reduce Spotify API calls

---

## 📄 License

MIT License

```text
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
