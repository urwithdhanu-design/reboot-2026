@echo off
REM Install gcul-messaging into the local Maven repo (required before building Java services).
setlocal
cd /d "%~dp0.."
if not exist "apps\services\kyc-service\mvnw.cmd" (
  echo Missing mvnw — run from repo root after cloning.
  exit /b 1
)
call apps\services\kyc-service\mvnw.cmd -q -f apps\libs\gcul-messaging\pom.xml install -DskipTests
exit /b %ERRORLEVEL%
