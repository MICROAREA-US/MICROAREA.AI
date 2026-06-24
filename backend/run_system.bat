@echo off
if exist "C:\www\modern-suite\set_pass.bat" call "C:\www\modern-suite\set_pass.bat"
echo [1/1] Iniciando servidores Web (Node y Caddy)...
cd /d C:\www\modern-suite
start "NodeJS MultiTenant" /B "C:\Program Files\nodejs\node.exe" server/index.js
"C:\Users\ponon\AppData\Local\Microsoft\WinGet\Links\caddy.exe" run --config Caddyfile
