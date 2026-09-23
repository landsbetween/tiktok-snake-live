# Snake Live — TikTok LIVE interactive game

An auto-playing snake for vertical TikTok live streams. The snake follows a fixed
trajectory around the board. Gifts drop apples onto the field (1 💎 = 1 🍎), a follow
gives +1 🍎, every 50 likes drop one apple and there is always at least one apple on the board.
A high like rate sets the board on fire (edges first, then the whole field at ~400 likes/min). Bomb gifts (GG, Fireworks, ... configurable) blow up the tail instead.
The trajectory is a random maze generated fresh every round. The snake eats, grows, fills the board, then a Top Supporters / Top Likes
leaderboard is shown and a new round starts.

## Run
```bash
npm install
node server.js <tiktok_username>     # e.g. node server.js mr.gd
```
Open http://localhost:3000 or add it to OBS as a **Browser Source 1080×1920**.

Without a username the game runs in demo mode: **G** gift, **F** follow, **L** like,
**C** chat, **B** bomb, **K** like storm, **E** end round. Sounds are synthesized with Web Audio; in a normal browser click once to unlock audio (OBS plays automatically). `http://localhost:3000/?demo=1` generates random events.

## Config (env)
- `APPLES_PER_DIAMOND=1` — apples per diamond
- `APPLES_PER_FOLLOW=1` — apples per follow
- `BOMB_GIFTS=GG,Fireworks,Boxing Gloves,Rocket` — gift names that cut the tail (by diamonds × count)
- `PORT=3000`

Board size (`COLS`/`ROWS`), round length (`ROUND_MS`) and speed (`STEP_MS_*`) are
constants at the top of the script in `public/index.html`.

## Simulate events via API
```bash
curl -X POST localhost:3000/api/sim -H 'content-type: application/json' \
  -d '{"type":"gift","name":"Lisa","diamonds":30,"giftName":"Donut"}'
```

## Notes
- Uses the unofficial [tiktok-live-connector](https://github.com/zerodytrash/TikTok-Live-Connector).
  The stream must already be live; the server retries every 20s otherwise.
- Supporter totals live in server memory and reset on restart.
