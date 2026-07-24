@echo off
REM [legacy] Show status — prefer: local-dev.cmd status
setlocal
call "%~dp0local.cmd" status
exit /b %ERRORLEVEL%
