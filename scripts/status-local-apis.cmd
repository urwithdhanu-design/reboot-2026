@echo off
REM Show ports + H2 vs Cloud SQL for each local Java API.
setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%status-local-apis.ps1"
exit /b %ERRORLEVEL%
