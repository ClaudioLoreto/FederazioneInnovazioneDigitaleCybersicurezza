@echo off
REM ===========================================================================
REM  start_local_dev.bat
REM  Avvia l'ambiente di sviluppo completo FIDC:
REM   1) Postgres in Docker (porta 5433)
REM   2) Backend .NET API (FIDC.Api) su http://localhost:5000
REM   3) Frontend Angular su http://localhost:4200
REM  Ogni servizio parte in una finestra dedicata, cosi i log restano separati.
REM ===========================================================================

setlocal
set ROOT=%~dp0..
echo.
echo [FIDC] Avvio ambiente di sviluppo locale...
echo.

REM --- 1) Database Postgres (Docker) ----------------------------------------
echo [1/3] Avvio Postgres (Docker, porta 5433)...
pushd "%ROOT%"
docker compose up -d postgres
popd

REM --- 2) Backend .NET -------------------------------------------------------
echo [2/3] Avvio backend .NET (FIDC.Api)...
start "FIDC API" cmd /k "cd /d %ROOT%\backend\FIDC.Api && set ASPNETCORE_ENVIRONMENT=Development && dotnet run"

REM --- 3) Frontend Angular ---------------------------------------------------
echo [3/3] Avvio frontend Angular...
start "FIDC Frontend" cmd /k "cd /d %ROOT%\frontend && npm start"

echo.
echo [FIDC] Ambiente avviato.
echo   - API      : http://localhost:5000/swagger
echo   - Frontend : http://localhost:4200
echo.
endlocal
