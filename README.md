# TikTok · Tune My Feed (demo prototype)

A clickable TikTok-style app (plain HTML/CSS/JS, no build step) that adds one new feature: **Tune My Feed**. Long-press any video, tap *Tune My Feed*, set how much of each topic you want, and the upcoming For You videos are re-ranked right away.

This is a concept prototype for a demo. It is not affiliated with TikTok. 

## Run it

**On your laptop** (from this folder):

```bash
python3 -m http.server 8000 --bind 0.0.0.0
```

Then open http://localhost:8000. On a laptop it shows inside an iPhone frame.

**On your iPhone** (same Wi-Fi as the laptop, with the server above running):
1. Find your laptop's IP: `ipconfig getifaddr en0` (for example `192.168.1.5`).
2. On the iPhone, open Safari and go to `http://192.168.1.5:8000`.
3. Tap Share → **Add to Home Screen** → open it from the home screen. It now runs full-screen with no Safari bars, like a real app.

If macOS asks whether Python can accept incoming connections, click **Allow**.

## Files

| File | What it is |
|---|---|
| `index.html` | App shell (feed, top bar, bottom nav, phone frame) |
| `styles.css` | All visuals |
| `app.js` | Feed, gestures, sheets, screens, ranking engine, demo panel |
| `icons.js` | Inline SVG icons |
| `data/videos.json` | The 45 videos (topic, creator, caption, sound, counts) |
| `data/videos.js` | Copy of the JSON, used only if you open `index.html` directly without the server |
| `videos/` | 720×1280 H.264 clips with music (≈3 MB each) plus a `.jpg` poster for each |
| `img/avatars/` | Creator avatars (cropped from the clips) |
| `DEMO.md` | 60-second walkthrough script |

**To swap in your own clips:** drop a vertical `.mp4` and a `.jpg` poster into `videos/`, then add or edit an entry in `data/videos.json`. `topic` must be one of `food, travel, music, fitness, pets, comedy`. If you edit the JSON, regenerate the fallback with:

```bash
python3 -c "import json;d=json.load(open('data/videos.json'));open('data/videos.js','w').write('window.VIDEOS_FALLBACK = '+json.dumps(d,ensure_ascii=False)+';\n')"
```

## Demo controls
- **Demo panel:** press `D` (laptop), tap the video with two fingers (phone), or triple-tap the status bar. It shows the topic mix of the next 10 videos before and after your last save, and has a **Reset demo** button.
- **Laptop keys:** ↑/↓ or the scroll wheel = swipe, Space = pause, L = like, M = mute, H = long-press menu, Esc = back.

## Credits
Video clips and music are from [Mixkit](https://mixkit.co) under the free Mixkit license. Track names are shown as each video's sound. Font: TikTok Sans (Google Fonts).
