// TikTok Live Snake — server
// Connects to TikTok LIVE (no login needed), listens for gifts/follows/likes
// and relays them to the game over WebSocket. Serves public/ as static files.

const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = Number(process.env.PORT || 3000);
const USERNAME = (process.argv[2] || process.env.TIKTOK_USER || '').replace(/^@/, '');
const APPLES_PER_DIAMOND = Number(process.env.APPLES_PER_DIAMOND || 1); // 1 💎 = 1 🍎
const APPLES_PER_FOLLOW = Number(process.env.APPLES_PER_FOLLOW || 1);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Stream-wide state: top supporters (coins = diamonds)
const supporters = new Map(); // uniqueId -> {name, avatar, coins}
let tiktokStatus = { connected: false, username: USERNAME, error: null };

function broadcast(msg) {
  const s = JSON.stringify(msg);
  for (const c of wss.clients) if (c.readyState === 1) c.send(s);
}

function userInfo(u = {}) {
  return {
    id: u.uniqueId || u.userId || 'anon',
    name: u.nickname || u.uniqueId || 'Anonymous',
    avatar:
      u.profilePicture?.url?.[0] ||
      u.profilePicture?.urls?.[0] ||
      u.avatarThumb?.urlList?.[0] ||
      u.avatarThumb?.url?.[0] ||
      null,
  };
}

function addCoins(user, coins) {
  const cur = supporters.get(user.id) || { ...user, coins: 0 };
  cur.coins += coins;
  cur.name = user.name;
  if (user.avatar) cur.avatar = user.avatar;
  supporters.set(user.id, cur);
}

function handleGift(user, giftName, diamonds, count) {
  const coins = Math.max(1, diamonds) * count;
  addCoins(user, coins);
  broadcast({
    type: 'gift',
    user,
    giftName,
    diamonds,
    count,
    coins,
    apples: Math.max(1, Math.round(coins * APPLES_PER_DIAMOND)),
  });
}
function handleFollow(user) {
  broadcast({ type: 'follow', user, apples: APPLES_PER_FOLLOW });
}
function handleLike(user, likes) {
  broadcast({ type: 'like', user, likes });
}
function handleChat(user, text) {
  broadcast({ type: 'chat', user, text });
}
function handleJoin(user) {
  broadcast({ type: 'join', user });
}

wss.on('connection', (ws) => {
  ws.send(
    JSON.stringify({
      type: 'snapshot',
      supporters: [...supporters.values()],
      tiktok: tiktokStatus,
      config: { applesPerDiamond: APPLES_PER_DIAMOND, applesPerFollow: APPLES_PER_FOLLOW },
    })
  );
});

// Test events without a live stream: curl -X POST localhost:3000/api/sim -H 'content-type: application/json' -d '{"type":"gift","diamonds":5}'
app.post('/api/sim', (req, res) => {
  const b = req.body || {};
  const user = { id: b.id || 'tester', name: b.name || 'Tester', avatar: b.avatar || null };
  if (b.type === 'gift') handleGift(user, b.giftName || 'Rose', Number(b.diamonds || 1), Number(b.count || 1));
  else if (b.type === 'follow') handleFollow(user);
  else if (b.type === 'like') handleLike(user, Number(b.likes || 1));
  else if (b.type === 'chat') handleChat(user, String(b.text || 'wow'));
  else if (b.type === 'join') handleJoin(user);
  else return res.status(400).json({ ok: false, error: 'unknown type' });
  res.json({ ok: true });
});
app.get('/api/status', (_req, res) => res.json({ tiktok: tiktokStatus, supporters: supporters.size }));

async function connectTikTok() {
  if (!USERNAME) {
    console.log('ℹ️  No TikTok username given. Usage: node server.js <username>. Demo mode is active (keys G/F/L in the game).');
    return;
  }
  const { TikTokLiveConnection, WebcastEvent } = require('tiktok-live-connector');
  const conn = new TikTokLiveConnection(USERNAME, {
    processInitialData: false,
    enableExtendedGiftInfo: true,
    fetchRoomInfoOnConnect: true,
  });

  conn.on(WebcastEvent.GIFT, (d) => {
    // Streakable gifts (giftType 1) are counted once the streak ends
    const giftType = d.giftDetails?.giftType ?? d.giftType;
    if (giftType === 1 && !d.repeatEnd) return;
    const diamonds =
      d.diamondCount ?? d.giftDetails?.diamondCount ?? d.extendedGiftInfo?.diamond_count ?? 1;
    const name = d.giftDetails?.giftName ?? d.giftName ?? d.extendedGiftInfo?.name ?? 'Gift';
    const count = Number(d.repeatCount || 1);
    handleGift(userInfo(d.user), name, Number(diamonds), count);
  });
  conn.on(WebcastEvent.FOLLOW, (d) => handleFollow(userInfo(d.user)));
  conn.on(WebcastEvent.LIKE, (d) => handleLike(userInfo(d.user), Number(d.likeCount || 1)));
  conn.on(WebcastEvent.CHAT, (d) => handleChat(userInfo(d.user), d.comment || ''));
  conn.on(WebcastEvent.MEMBER, (d) => handleJoin(userInfo(d.user)));
  conn.on(WebcastEvent.STREAM_END, () => {
    tiktokStatus = { ...tiktokStatus, connected: false, error: 'stream ended' };
    broadcast({ type: 'tiktok', ...tiktokStatus });
  });
  conn.on('disconnected', () => {
    tiktokStatus = { ...tiktokStatus, connected: false };
    broadcast({ type: 'tiktok', ...tiktokStatus });
    console.log('⚠️  Disconnected, reconnecting in 10s');
    setTimeout(tryConnect, 10000);
  });
  conn.on('error', (e) => console.error('TikTok error:', e?.message || e));

  async function tryConnect() {
    try {
      const state = await conn.connect();
      tiktokStatus = { connected: true, username: USERNAME, error: null, roomId: state.roomId };
      console.log(`✅ Connected to @${USERNAME}, roomId ${state.roomId}`);
    } catch (e) {
      tiktokStatus = { connected: false, username: USERNAME, error: e?.message || String(e) };
      console.error('❌ Connection failed:', tiktokStatus.error, '- retrying in 20s');
      setTimeout(tryConnect, 20000);
    }
    broadcast({ type: 'tiktok', ...tiktokStatus });
  }
  tryConnect();
}

server.listen(PORT, () => {
  console.log(`🐍 Game: http://localhost:${PORT}  (add as OBS Browser Source, 1080x1920)`);
  connectTikTok();
});
