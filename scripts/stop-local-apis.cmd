@echo off
REM [legacy] Stop Java APIs (not UIs) — prefer: local-dev.cmd stop
setlocal
set "ARGS="
:parse
if "%~1"=="" goto run
if /i "%~1"=="python" set "ARGS=-IncludePython"
shift
goto parse
:run
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0local\_lib\stop-apis.ps1" %ARGS%
exit /b %ERRORLEVEL%
