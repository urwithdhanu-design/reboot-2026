@echo off
REM Deploy all GCUL microservices to Cloud Run (with Cloud SQL when configured).
REM
REM   set GCP_PROJECT=community-hub-6fb1b
REM   deploy\deploy-cloud-run.cmd
REM
REM Optional:
REM   set GCUL_USE_CLOUD_SQL=false     (ephemeral H2 on Cloud Run - not recommended)
REM   set GCUL_USE_PUBSUB=true         (after deploy\setup-pubsub.cmd)
REM   deploy\deploy-cloud-run.cmd skipbuild
setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."

if "%GCP_PROJECT%"=="" (
  echo ERROR: Set GCP_PROJECT first, e.g.:
  echo   set GCP_PROJECT=community-hub-6fb1b
  exit /b 1
)

set "ARGS="
if /i "%~1"=="skipbuild" set "ARGS=-SkipBuild"

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%deploy-cloud-run.ps1" %ARGS%
exit /b %ERRORLEVEL%
