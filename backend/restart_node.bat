@echo off
:: Comprobar privilegios de Administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Ejecutando como Administrador...
) else (
    echo [INFO] Solicitando permisos de Administrador...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

echo Deteniendo proceso de Node.js viejo...
taskkill /F /IM node.exe

echo Iniciando servidor Node.js nuevo...
cd /d C:\www\modern-suite
start "NodeJS MultiTenant" /B "C:\Program Files\nodejs\node.exe" server/index.js

echo Servidor Node.js reiniciado correctamente!
timeout /t 3
exit
