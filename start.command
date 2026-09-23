#!/bin/zsh
# Snake Live launcher: double-click to start the game server connected to your TikTok LIVE.
cd "$HOME/IdeaProjects/tiktok-snake-live"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
CFG="$HOME/.tiktok-snake-user"
if [ ! -s "$CFG" ]; then
  echo "Введи свій нік у TikTok (без @) і натисни Enter:"
  read -r U; U="${U#@}"; echo "$U" > "$CFG"
fi
U="$(cat "$CFG")"
# stop anything already using the game port
lsof -ti tcp:3000 | xargs kill 2>/dev/null
[ -d node_modules ] || npm install
git pull -q 2>/dev/null
echo "▶ Гра: http://localhost:3000   TikTok: @$U"
echo "  Щоб змінити нік: видали файл $CFG"
echo "  Не закривай це вікно під час ефіру."
node server.js "$U"
