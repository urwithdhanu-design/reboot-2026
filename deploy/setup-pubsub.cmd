@echo off
REM Create Pub/Sub topics, pull subscriptions, and IAM for Cloud Run service accounts.
REM
REM   set GCP_PROJECT=community-hub-6fb1b
REM   deploy\setup-pubsub.cmd
REM
REM Optional:
REM   deploy\setup-pubsub.cmd nosubs     (topics + IAM only, no subscriptions)
setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."

if "%GCP_PROJECT%"=="" (
  echo ERROR: Set GCP_PROJECT first, e.g.:
  echo   set GCP_PROJECT=community-hub-6fb1b
  exit /b 1
)

set "ARGS=-CreateSubscriptions"
if /i "%~1"=="nosubs" set "ARGS="

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%setup-pubsub.ps1" %ARGS%
exit /b %ERRORLEVEL%
