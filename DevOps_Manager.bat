@echo off
REM ===========================================================================
REM  DevOps_Manager.bat  —  FIDC (Federazione Innovazione, Digitale e Cybersicurezza)
REM  Un UNICO script interattivo per gestire l'intero ciclo di sviluppo.
REM  Menu:
REM    [1] Start Local Dev Server (.NET API + Angular + Postgres Docker)
REM    [2] Run EF Core Migrations (applica le migration al DB)
REM    [3] Deploy to Railway / Docker
REM    [4] Exit
REM ===========================================================================

setlocal EnableExtensions EnableDelayedExpansion
title FIDC - DevOps Manager
cd /d "%~dp0"
set "ROOT=%~dp0"
set "API_DIR=%ROOT%backend\FIDC.Api"
set "DAL_DIR=%ROOT%backend\FIDC.Dal"
set "WEB_DIR=%ROOT%frontend"

:MENU
cls
echo ===============================================================
echo            F I D C   -   D E V O P S   M A N A G E R
echo    Federazione Innovazione, Digitale e Cybersicurezza
echo ===============================================================
echo.
echo    [1]  Start Local Dev Server   (.NET API + Angular + Postgres)
echo    [2]  Run EF Core Migrations   (aggiorna lo schema del DB)
echo    [3]  Deploy to Railway/Docker
echo    [4]  Exit
echo.
echo ===============================================================
set "CHOICE="
set /p "CHOICE=Seleziona un'opzione [1-4]: "

if "%CHOICE%"=="1" goto START_DEV
if "%CHOICE%"=="2" goto MIGRATE
if "%CHOICE%"=="3" goto DEPLOY
if "%CHOICE%"=="4" goto END
echo.
echo  [!] Scelta non valida. Riprova.
timeout /t 2 >nul
goto MENU

REM ---------------------------------------------------------------------------
:START_DEV
cls
echo [FIDC] Avvio ambiente di sviluppo locale...
echo.

echo  [1/3] Avvio Postgres (Docker, porta 5433)...
docker compose up -d postgres
if errorlevel 1 (
  echo  [!] Docker non disponibile o compose fallito. Verifica Docker Desktop.
  echo      Puoi comunque usare SQL Server locale impostando Database:Provider.
)

echo  [2/3] Avvio backend .NET (FIDC.Api su https://localhost:5001)...
start "FIDC API" cmd /k "cd /d "%API_DIR%" && set ASPNETCORE_ENVIRONMENT=Development && dotnet run"

echo  [3/3] Avvio frontend Angular (http://localhost:4200)...
start "FIDC Frontend" cmd /k "cd /d "%WEB_DIR%" && npm start"

echo.
echo  [OK] Ambiente avviato in finestre dedicate:
echo       - API + Swagger : https://localhost:5001/swagger
echo       - Frontend      : http://localhost:4200
echo.
pause
goto MENU

REM ---------------------------------------------------------------------------
:MIGRATE
cls
echo [FIDC] Esecuzione migrazioni EF Core...
echo.
where dotnet-ef >nul 2>&1
if errorlevel 1 (
  echo  [i] Strumento dotnet-ef non trovato: installazione globale in corso...
  dotnet tool install --global dotnet-ef
)
echo.
set "EFPROV="
set /p "EFPROV=Provider [1=Postgres (dev/Docker), 2=SqlServer (prod)]: "
if "%EFPROV%"=="2" (
  set "FIDC_DB_PROVIDER=SqlServer"
) else (
  set "FIDC_DB_PROVIDER=Postgres"
)
echo.
echo  Provider selezionato: %FIDC_DB_PROVIDER%
echo  Applico le migration al database...
pushd "%API_DIR%"
dotnet ef database update --project "%DAL_DIR%" --startup-project "%API_DIR%"
popd
echo.
if errorlevel 1 ( echo  [!] Migrazione fallita. Controlla la connection string.) else ( echo  [OK] Database aggiornato.)
echo.
pause
goto MENU

REM ---------------------------------------------------------------------------
:DEPLOY
cls
echo [FIDC] Deploy su Railway / Docker...
echo.
echo    [a]  Railway CLI  (railway up --detach)
echo    [b]  Docker build + compose up (stack completo)
echo    [c]  Annulla
echo.
set "DOPT="
set /p "DOPT=Scegli la modalita di deploy [a/b/c]: "

if /I "%DOPT%"=="a" (
  where railway >nul 2>&1
  if errorlevel 1 (
    echo  [!] Railway CLI non trovata. Installa con: npm i -g @railway/cli
    pause
    goto MENU
  )
  echo  Avvio deploy Railway...
  railway up --detach
  if errorlevel 1 ( echo  [!] Deploy Railway fallito. Esegui 'railway login' e riprova.) else ( echo  [OK] Deploy Railway avviato.)
  pause
  goto MENU
)

if /I "%DOPT%"=="b" (
  echo  Build delle immagini e avvio dello stack Docker...
  docker compose build
  docker compose up -d
  if errorlevel 1 ( echo  [!] Docker compose fallito. Verifica Docker Desktop e il file compose.) else ( echo  [OK] Stack Docker attivo.)
  pause
  goto MENU
)

echo  Operazione annullata.
timeout /t 2 >nul
goto MENU

REM ---------------------------------------------------------------------------
:END
cls
echo Grazie per aver usato FIDC DevOps Manager. A presto!
echo.
endlocal
exit /b 0
