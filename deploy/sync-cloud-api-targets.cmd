@echo off
REM Refresh deploy/cloud-api.targets.json from live Cloud Run (customer + admin dev proxy).
setlocal
set "SCRIPT_DIR=%~dp0"
if "%GCP_PROJECT%"=="" set "GCP_PROJECT=community-hub-6fb1b"
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%sync-cloud-api-targets.ps1"
exit /b %ERRORLEVEL%
