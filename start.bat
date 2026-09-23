@echo off
rem Snake Live launcher for Windows: double-click to start the game server for your TikTok LIVE.
setlocal
cd /d "%~dp0"
title Snake Live - keep this window open during the stream

where node >nul 2>&1 || (echo Node.js is not installed. Run install-windows.ps1 first. & pause & exit /b 1)

set "CFG=%USERPROFILE%\.tiktok-snake-user"
if not exist "%CFG%" (
  set /p U=Enter your TikTok username without @ and press Enter: 
  call echo %%U:@=%%> "%CFG%"
)
set /p U=<"%CFG%"

rem stop anything already using the game port
for /f "tokens=5" %%p in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%p >nul 2>&1

git pull -q >nul 2>&1
if not exist node_modules call npm install --silent

echo.
echo  Game:   http://localtest.me:3000   (add this as a Link source in TikTok LIVE Studio)
echo  TikTok: @%U%
echo  To change the username delete %CFG%
echo  Keep this window open during the stream.
echo.
node server.js %U%
pause
