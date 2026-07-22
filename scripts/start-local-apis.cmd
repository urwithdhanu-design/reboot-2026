@echo off
REM Start all 8 GCUL Java microservices (ports 8081-8088).
REM   start-local-apis.cmd
REM   start-local-apis.cmd status
REM   start-local-apis.cmd python
REM   start-local-apis.cmd python status
REM   start-local-apis.cmd force
setlocal
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%.."

set "INC="
set "STAT="
set "FORCE="

:parse
if "%~1"=="" goto run
if /i "%~1"=="status" (set "STAT=-Status" & shift & goto parse)
if /i "%~1"=="python" (set "INC=-IncludePython" & shift & goto parse)
if /i "%~1"=="force" (set "FORCE=-Force" & shift & goto parse)
shift
goto parse

:run
powershell -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%start-local-apis.ps1" %INC% %STAT% %FORCE%
exit /b %ERRORLEVEL%
