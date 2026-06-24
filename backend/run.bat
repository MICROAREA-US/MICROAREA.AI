@echo off
title Servidor Multi-sitio Microarea

echo =======================================================
echo     INICIANDO SERVIDOR WEB MULTI-SITIO (CADDY + NODEJS + LARAVEL) 
echo =======================================================
echo.
echo   🏠 Principal (Puerto 8000): http://localhost:8000
echo   🏠 WinLab Cloud (Puerto 8089): http://localhost:8089 (ewinlab.ai)
echo   🏠 WinLab (Puerto 8081):    http://localhost:8081
echo   🏠 EosWin (Puerto 8082):    http://localhost:8082
echo   🏠 MaConta (Puerto 8083):   http://localhost:8083
echo   🏠 MaGest (Puerto 8084):    http://localhost:8084
echo   🏠 LexNext (Puerto 8085):   http://localhost:8085
echo   🏠 Poshability (Puerto 8086): http://localhost:8086
echo   🏠 Cloud (Puerto 8087):       http://localhost:8087
echo   🏠 Manuales (Puerto 8088):    http://localhost:8088
echo.
echo   Presione CTRL+C en esta ventana para detener todos los servidores.
echo =======================================================
echo.

:: 1. Iniciar la API de Node.js en segundo plano
echo [1/3] Iniciando motor central NodeJS en puerto 3000...
start "NodeJS MultiTenant" /B node server/index.js

:: 2. Iniciar Laravel para WinLab Cloud en segundo plano (Puerto 8000)
echo [2/3] Iniciando Laravel (WinLab Cloud) en puerto 8000...
start "Laravel WinLabCloud" /D "C:\www\winlabcloud" /B "C:\Users\micro\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe" artisan serve --port=8000

:: 3. Iniciar Caddy en primer plano
echo [3/3] Levantando servidor web Caddy (Puertos 8081-8084, 8089)...
echo.
caddy run --config Caddyfile

:: Al presionar CTRL+C y salir del script, detendrá los procesos asociados.
echo Deteniendo servidores...
taskkill /IM node.exe /F >nul 2>&1
taskkill /IM php.exe /F >nul 2>&1
echo [✓] Servidores detenidos correctamente.
pause
