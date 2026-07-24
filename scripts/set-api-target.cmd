@echo off
REM [legacy] Set API target — prefer: local-dev.cmd target local|cloud
setlocal
if "%~1"=="" (
  call "%~dp0local.cmd" target
  exit /b %ERRORLEVEL%
)
call "%~dp0local.cmd" target %1
exit /b %ERRORLEVEL%
