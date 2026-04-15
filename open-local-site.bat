@echo off
cd /d "%~dp0"
start "FotoTochka Local Server" cmd /k python -m http.server 8000
timeout /t 2 /nobreak >nul
start "" http://localhost:8000
