# Snake Live - one-shot setup for Windows.
# Run in PowerShell:  irm https://raw.githubusercontent.com/landsbetween/tiktok-snake-live/main/install-windows.ps1 | iex
$ErrorActionPreference = 'Stop'
function Refresh-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User') }
function Need($cmd) { -not (Get-Command $cmd -ErrorAction SilentlyContinue) }

Write-Host "== Snake Live setup ==" -ForegroundColor Cyan
if ((Need git) -or (Need node)) {
  if (Need winget) { Write-Host "winget not found. Install 'App Installer' from Microsoft Store, then run this again." -ForegroundColor Red; return }
  if (Need git)  { Write-Host "Installing Git..."; winget install --id Git.Git -e --silent --accept-package-agreements --accept-source-agreements }
  if (Need node) { Write-Host "Installing Node.js LTS..."; winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements }
  Refresh-Path
}

$dir = Join-Path $env:USERPROFILE 'tiktok-snake-live'
if (Test-Path (Join-Path $dir '.git')) { Write-Host "Updating $dir"; git -C $dir pull -q }
else { Write-Host "Downloading the game to $dir"; git clone -q https://github.com/landsbetween/tiktok-snake-live.git $dir }

Push-Location $dir; Write-Host "Installing dependencies..."; npm install --silent; Pop-Location

$cfg = Join-Path $env:USERPROFILE '.tiktok-snake-user'
if (-not (Test-Path $cfg)) { $u = (Read-Host 'Your TikTok username (without @)').TrimStart('@'); Set-Content -Path $cfg -Value $u -NoNewline -Encoding ascii }

$desktop = [Environment]::GetFolderPath('Desktop')
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut((Join-Path $desktop 'Snake Live.lnk'))
$lnk.TargetPath = Join-Path $dir 'start.bat'; $lnk.WorkingDirectory = $dir; $lnk.Save()

Write-Host ""
Write-Host "Done. A 'Snake Live' shortcut is on your Desktop." -ForegroundColor Green
Write-Host "Starting the game now..."
Start-Process -FilePath (Join-Path $dir 'start.bat') -WorkingDirectory $dir
