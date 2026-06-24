@echo off
title Instalar Laravel como Servicio de Windows

net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Running as Admin...
) else (
    echo [INFO] Requesting Admin rights...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo ========================================================
echo   INSTALANDO LARAVEL WINLABCLOUD COMO SERVICIO
echo ========================================================
echo.

set NSSM="C:\Users\micro\AppData\Local\Microsoft\WinGet\Packages\NSSM.NSSM_Microsoft.Winget.Source_8wekyb3d8bbwe\nssm-2.24-101-g897c7ad\win64\nssm.exe"
set PHP="C:\Users\micro\AppData\Local\Microsoft\WinGet\Packages\PHP.PHP.8.3_Microsoft.Winget.Source_8wekyb3d8bbwe\php.exe"

echo [1/4] Deteniendo servicio previo...
net stop LaravelWinLabCloud >nul 2>&1
%NSSM% remove LaravelWinLabCloud confirm >nul 2>&1

echo [2/4] Registrando nuevo servicio...
%NSSM% install LaravelWinLabCloud %PHP% "artisan serve --port=8000"
if %errorLevel% neq 0 (
    echo [Error] No se pudo instalar el servicio.
    pause
    exit /b
)

echo [3/4] Configurando servicio...
%NSSM% set LaravelWinLabCloud AppDirectory "C:\www\winlabcloud"
%NSSM% set LaravelWinLabCloud Description "Servidor Laravel en segundo plano para WinLab Cloud"
%NSSM% set LaravelWinLabCloud Start SERVICE_AUTO_START

echo [4/4] Levantando el servicio...
net start LaravelWinLabCloud

echo.
echo ========================================================
echo   [OK] Laravel registrado e iniciado.
echo ========================================================
echo.
timeout /t 5
exit
