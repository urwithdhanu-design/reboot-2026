@echo off
REM Deploy customer + admin SPAs to Firebase Hosting (API rewrites to Cloud Run).
setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."

if "%GCP_PROJECT%"=="" (
  echo ERROR: Set GCP_PROJECT first, e.g.:
  echo   set GCP_PROJECT=community-hub-6fb1b
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%deploy-firebase.ps1"
exit /b %ERRORLEVEL%
