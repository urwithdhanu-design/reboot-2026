@echo off
REM Set API target for local Vite dev (customer + admin read .local-dev\api-target.env).
REM   scripts\set-api-target.cmd local
REM   scripts\set-api-target.cmd cloud
setlocal
if "%~1"=="" (
  echo Usage: scripts\set-api-target.cmd local ^| cloud
  if exist "%~dp0..\.local-dev\api-target.env" type "%~dp0..\.local-dev\api-target.env"
  exit /b 1
)
set "TARGET=%~1"
if /i not "%TARGET%"=="local" if /i not "%TARGET%"=="cloud" (
  echo ERROR: use local or cloud
  exit /b 1
)
set "FILE=%~dp0..\.local-dev\api-target.env"
> "%FILE%" echo # Shared dev API target
>>"%FILE%" echo VITE_API_TARGET=%TARGET%
echo Wrote %FILE% = %TARGET%
echo Restart: cd apps\web ^& npm run dev  (and apps\admin if needed)
exit /b 0
