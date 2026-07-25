@echo off
REM Deploy customer + admin SPAs to Firebase Hosting (static; no Cloud Run rewrites).
setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%deploy-firebase-hosting.ps1" %*
exit /b %ERRORLEVEL%
