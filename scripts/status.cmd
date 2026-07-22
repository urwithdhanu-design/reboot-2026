@echo off
REM Show local API ports + H2 vs Cloud SQL (same as scripts\status-local-apis.cmd).
call "%~dp0status-local-apis.cmd" %*
