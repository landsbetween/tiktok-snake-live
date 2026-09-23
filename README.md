# Snake Live — TikTok LIVE interactive game

An auto-playing snake for vertical TikTok live streams. The snake follows a fixed
trajectory around the board. Gifts drop apples onto the field (1 💎 = 1 🍎), a follow
gives +1 🍎, every 50 likes drop one apple and there is always at least one apple on the board.
A high like rate sets the board on fire (edges first, then the whole field at ~400 likes/min). Bomb gifts (GG, Fireworks, ... configurable) blow up the tail instead.
The trajectory is a random maze generated fresh every round. Every round also picks a new map (7 worlds: Mystic Forest, Sunny Desert, Frozen Peaks, Lava Lands, Candy Land, Neon City, Green Meadow; force one with `?map=Candy%20Land`), a new snake skin (8 color/pattern themes) and a new fruit type (9 fruits); the skins and fruits lists sit at the top of the 3D code in `public/index.html`. The snake eats, grows, fills the board, then a Top Supporters / Top Likes
leaderboard is shown and a new round starts.

## Run
```bash
npm install
node server.js <tiktok_username>     # e.g. node server.js mr.gd
```
Open http://localhost:3000 or add it to OBS as a **Browser Source 1080×1920**.

Without a username the game runs in demo mode (add `?debug=1` to see the key hints and connection status): **G** gift, **F** follow, **L** like,
**C** chat, **B** bomb, **K** like storm, **E** end round. Sounds: a real apple-bite crunch when the snake eats and "Thanks for the follow!" followed by "Thanks Obama" on every follow; in a normal browser click once to unlock audio (OBS plays automatically). Add `?fruit=Strawberries` (any fruit name) to force a fruit for testing. `http://localhost:3000/?demo=1` generates random events.

## Config (env)
- `APPLES_PER_DIAMOND=1` — apples per diamond
- `APPLES_PER_FOLLOW=1` — apples per follow
- `BOMB_GIFTS=GG,Fireworks,Boxing Gloves,Rocket` — gift names that cut the tail (by diamonds × count)
- `PORT=3000`

Board size (`COLS`/`ROWS`), round length (`ROUND_MS`) and speed (`STEP_MS_*`) are
constants at the top of the script in `public/index.html`.

## Thank every follower in the LIVE chat
The server can post a message into your TikTok LIVE chat on every follow. TikTok requires an
authenticated session for that, so set:
- `TIKTOK_SESSION_ID` and `TIKTOK_TARGET_IDC` — your account's `sessionid` and `tt-target-idc` cookies
  (log into tiktok.com in a browser, copy them from DevTools → Application → Cookies; keep them secret)
- `EULER_API_KEY` — a sign API key from https://www.eulerstream.com (required by the library for sending)
- `FOLLOW_CHAT_MSG` — optional template, default `Thanks for the follow, @{name}! 🍎 +1 apple for the snake`
  (`{name}` = username, `{nickname}` = display name); `CHAT_MIN_GAP_MS=3000` spaces messages out

```bash
TIKTOK_SESSION_ID=... TIKTOK_TARGET_IDC=useast1a EULER_API_KEY=... node server.js your_handle
```
Without these variables the game still works; follows are only shown in the on-screen feed.

## Simulate events via API
```bash
curl -X POST localhost:3000/api/sim -H 'content-type: application/json' \
  -d '{"type":"gift","name":"Lisa","diamonds":30,"giftName":"Donut"}'
```

## Notes
- Uses the unofficial [tiktok-live-connector](https://github.com/zerodytrash/TikTok-Live-Connector).
  The stream must already be live; the server retries every 20s otherwise.
- Supporter totals live in server memory and reset on restart.
