@echo off
REM Stop GCUL local APIs on ports 8081-8088.
REM   stop-local-apis.cmd
REM   stop-local-apis.cmd python
setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."

set "ARGS="
if /i "%~1"=="python" set "ARGS=-IncludePython"

powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%stop-local-apis.ps1" %ARGS%
exit /b %ERRORLEVEL%
