@echo off
REM GCUL local development — single entry point.
REM   local-dev.cmd help
REM   local-dev.cmd setup
REM   local-dev.cmd start
REM   local-dev.cmd refresh-messaging
REM   local-dev.cmd cloud
setlocal
set "ROOT=%~dp0"
if exist "%ROOT%scripts\local.cmd" (
  call "%ROOT%scripts\local.cmd" %*
) else (
  echo ERROR: scripts\local.cmd not found. Run from repo root.
  exit /b 1
)
exit /b %ERRORLEVEL%
