@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul || (
  echo Node.js is required. Install Node.js 20 or newer, then run this file again.
  pause
  exit /b 1
)
start "CHARACTER STUDIO" cmd /c "timeout /t 2 >nul & start http://127.0.0.1:4173/"
node server.mjs
pause
