@echo off
REM [legacy] Install gcul-messaging — prefer: local-dev.cmd setup
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0local\_lib\setup.ps1" -MessagingOnly
exit /b %ERRORLEVEL%
