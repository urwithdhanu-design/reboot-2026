@echo off
REM Provision + deploy entire GCUL stack to insure360-83a36 (single GCP/Firebase project).
setlocal
set "GCP_PROJECT=insure360-83a36"
set "GCUL_FIREBASE_PROJECT=insure360-83a36"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0migrate-to-insure360.ps1" %*
exit /b %ERRORLEVEL%
