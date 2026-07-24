@echo off
REM [legacy] Start Java APIs — prefer: local-dev.cmd apis
setlocal
call "%~dp0local.cmd" apis %*
exit /b %ERRORLEVEL%
