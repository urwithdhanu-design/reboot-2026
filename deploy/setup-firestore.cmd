@echo off
REM Enable Firestore API and grant Cloud Run access for server-side cache.
setlocal
set "SCRIPT_DIR=%~dp0"
if "%GCP_PROJECT%"=="" set "GCP_PROJECT=insure360-83a36"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%setup-firestore.ps1"
exit /b %ERRORLEVEL%
