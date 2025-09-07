v8: Intro with provided image, speech bubbles for jokes, cats enemies, floating CAVO intermission, boss with taunts, Bouajab ending.

Mobile + Taunts + Audio (this build)
- Mobile-friendly: responsive canvas + rotate hint in portrait.
- Touch controls: drag to move, single touch to fire.
- Ettifaq Mode: press T to toggle special theme + football chants.
- Streak taunts: quick triple kills show fun lines (or football lines in Ettifaq mode).
- Pre-boss announcement: shows a short overlay before the boss appears.
- Audio: YouTube BGM (0O3olZEo0HU) after Start; falls back to assets/bgm.mp3 or a synth loop.
- Mute: press M or click the speaker button in HUD.

Controls
- Move: Arrow Keys or drag/touch
- Shoot: Space or single touch/hold
- Toggle Ettifaq: T
- Mute/Unmute: M (or HUD button)

Run locally
- Easiest: open index.html in a desktop browser
- Or serve: python3 -m http.server 8080 (then http://127.0.0.1:8080)

Deploy
- GitHub Pages: push the folder, enable Pages (root). Result is a shareable URL.
- Netlify: drag-and-drop the folder to Netlify for an instant URL.

Optional assets
- Place background music at assets/bgm.mp3 to override the synth fallback if YouTube is blocked.
