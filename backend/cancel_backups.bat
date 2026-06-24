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

echo Deteniendo y eliminando la tarea programada MicroareaDailyBackup...
schtasks /delete /tn "MicroareaDailyBackup" /f

echo Tarea eliminada correctamente!
timeout /t 5
exit
