@echo off
:: Comprobar privilegios de Administrador
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Executing as Administrator...
) else (
    echo [INFO] Requesting Administrator permissions...
    powershell -Command "Start-Process '%~dpnx0' -Verb RunAs"
    exit /b
)

:: Run everything and log to create_shares.log
(
echo === EJECUCION SCRIPT: %date% %time% ===
echo Creando directorio local C:\copiaSeguridad...
if not exist "C:\copiaSeguridad" (
    mkdir "C:\copiaSeguridad"
    echo [o] C:\copiaSeguridad creado.
) else (
    echo [!] C:\copiaSeguridad ya existe.
)

echo.
echo Creando recurso compartido "Backup" en la red local...
:: Eliminar recurso compartido existente si ya existe para evitar errores
net share Backup /delete 2>&1
net share backup /delete 2>&1

:: Intentar compartir C:\copiaSeguridad como Backup en Espanol
echo Intentando compartir en Espanol...
net share Backup=C:\copiaSeguridad /grant:Todos,full 2>&1
echo Errorlevel despues de Todos: %errorlevel%

if %errorlevel% neq 0 (
    :: Si falla, intentar en Ingles
    echo Intentando compartir en Ingles...
    net share Backup=C:\copiaSeguridad /grant:everyone,full 2>&1
    echo Errorlevel despues de everyone: %errorlevel%
    
    if %errorlevel% neq 0 (
        echo [!] Error al aplicar permisos. Compartiendo sin restricciones...
        net share Backup=C:\copiaSeguridad 2>&1
        echo Errorlevel despues de compartir sin permisos: %errorlevel%
    ) else (
        echo [o] Recurso compartido "Backup" creado con exito (everyone).
    )
) else (
    echo [o] Recurso compartido "Backup" creado con exito (Todos).
)
echo === FIN SCRIPT ===
) > C:\www\modern-suite\create_shares.log 2>&1

echo.
echo [o] Carpeta y recurso compartido "Backup" procesados. Log escrito en C:\www\modern-suite\create_shares.log.
pause
exit
