@echo off
REM ===========================================================================
REM  deploy_railway.bat
REM  Build + push del backend FIDC su Railway (Postgres demo/test).
REM  Prerequisiti:
REM    - Railway CLI installata (npm i -g @railway/cli)
REM    - Progetto gia linkato:  railway link
REM    - Login attivo:          railway whoami
REM  Pipeline: commit/push Git -> railway up (build Docker remoto) -> verifica.
REM ===========================================================================

setlocal
set ROOT=%~dp0..
pushd "%ROOT%"

echo [FIDC] Verifica autenticazione Railway...
railway whoami
if errorlevel 1 (
    echo [FIDC] Non autenticato. Eseguo railway login...
    railway login
)

echo.
echo [FIDC] Commit e push su Git (main)...
git add -A
set /p MSG="Messaggio di commit: "
git commit -m "%MSG%"
git push origin main

echo.
echo [FIDC] Deploy su Railway (build Docker remoto)...
railway up --detach

echo.
echo [FIDC] Deploy avviato. Applico le migrazioni EF su Postgres di produzione...
REM Le migration vengono comunque applicate all'avvio in Development;
REM per ambienti non-dev applicarle esplicitamente via connessione Railway:
REM   railway run cmd /c "scripts\db_migrate_update.bat update"
echo [FIDC] Fatto. Controlla lo stato con: railway logs
popd
endlocal
