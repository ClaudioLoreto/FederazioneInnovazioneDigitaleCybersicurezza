@echo off
REM ===========================================================================
REM  db_migrate_update.bat
REM  Gestisce le migrazioni EF Core per ENTRAMBI i provider.
REM  Uso:
REM    db_migrate_update.bat add NomeMigrazione   -> crea una nuova migration
REM    db_migrate_update.bat update               -> applica le migration (dev/Postgres)
REM    db_migrate_update.bat update sqlserver      -> applica su SQL Server (prod)
REM  Le migration sono UNICHE e vivono nel progetto FIDC.Dal.
REM ===========================================================================

setlocal
set ROOT=%~dp0..
set DAL=%ROOT%\backend\FIDC.Dal
set API=%ROOT%\backend\FIDC.Api

REM Verifica presenza del tool dotnet-ef
where dotnet-ef >nul 2>nul
if errorlevel 1 (
    echo [FIDC] Installo dotnet-ef globale...
    dotnet tool install --global dotnet-ef
)

if /I "%1"=="add" (
    if "%2"=="" (
        echo [ERRORE] Specificare il nome della migrazione: db_migrate_update.bat add NomeMigrazione
        goto :eof
    )
    echo [FIDC] Creazione migrazione "%2"...
    dotnet ef migrations add %2 --project "%DAL%" --startup-project "%API%"
    goto :eof
)

if /I "%1"=="update" (
    if /I "%2"=="sqlserver" (
        echo [FIDC] Applico migrazioni su SQL Server ^(produzione^)...
        set FIDC_DB_PROVIDER=SqlServer
        dotnet ef database update --project "%DAL%" --startup-project "%API%" -- --environment Production
    ) else (
        echo [FIDC] Applico migrazioni su Postgres ^(dev/test^)...
        set FIDC_DB_PROVIDER=Postgres
        dotnet ef database update --project "%DAL%" --startup-project "%API%" -- --environment Development
    )
    goto :eof
)

echo Uso:
echo   db_migrate_update.bat add NomeMigrazione
echo   db_migrate_update.bat update [sqlserver]
endlocal
