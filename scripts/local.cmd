@echo off
REM GCUL local development — single entry point (run from repo root).
setlocal EnableDelayedExpansion
set "SCRIPT_DIR=%~dp0"
set "LIB=%SCRIPT_DIR%local\_lib"
cd /d "%SCRIPT_DIR%.."

set "CMD=%~1"
if "%CMD%"=="" set "CMD=help"
shift

set "PY="
set "FORCE="
set "TARGET="

:parse
if "%~1"=="" goto run
if /i "%~1"=="python" (set "PY=-IncludePython" & shift & goto parse)
if /i "%~1"=="force" (set "FORCE=-Force" & shift & goto parse)
if /i "%~1"=="local" (set "TARGET=local" & shift & goto parse)
if /i "%~1"=="cloud" (set "TARGET=cloud" & shift & goto parse)
if /i "%~1"=="ui" (set "ONLY_UI=1" & shift & goto parse)
shift
goto parse

:run
if /i "%CMD%"=="help" goto help
if /i "%CMD%"=="setup" goto setup
if /i "%CMD%"=="start" goto start
if /i "%CMD%"=="cloud" goto cloud
if /i "%CMD%"=="apis" goto apis
if /i "%CMD%"=="ui" goto ui
if /i "%CMD%"=="status" goto status
if /i "%CMD%"=="stop" goto stop
if /i "%CMD%"=="target" goto target
echo Unknown command: %CMD%
goto help

:help
powershell -NoProfile -ExecutionPolicy Bypass -Command ". '%LIB%\common.ps1'; Show-Help"
exit /b 0

:setup
powershell -NoProfile -ExecutionPolicy Bypass -File "%LIB%\setup.ps1"
exit /b %ERRORLEVEL%

:start
powershell -NoProfile -ExecutionPolicy Bypass -File "%LIB%\start-local.ps1" %PY%
exit /b %ERRORLEVEL%

:cloud
powershell -NoProfile -ExecutionPolicy Bypass -File "%LIB%\start-cloud.ps1"
exit /b %ERRORLEVEL%

:apis
powershell -NoProfile -ExecutionPolicy Bypass -File "%LIB%\start-apis.ps1" %PY% %FORCE%
exit /b %ERRORLEVEL%

:ui
powershell -NoProfile -ExecutionPolicy Bypass -File "%LIB%\start-ui.ps1" %FORCE%
exit /b %ERRORLEVEL%

:status
powershell -NoProfile -ExecutionPolicy Bypass -File "%LIB%\status.ps1"
exit /b %ERRORLEVEL%

:stop
if defined ONLY_UI (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%LIB%\stop-ui.ps1"
) else (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%LIB%\stop.ps1" %PY%
)
exit /b %ERRORLEVEL%

:target
if "%TARGET%"=="" (
  echo Usage: local-dev.cmd target local ^| cloud
  if exist ".local-dev\api-target.env" type ".local-dev\api-target.env"
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%LIB%\api-target.ps1" -Target %TARGET%
exit /b %ERRORLEVEL%
