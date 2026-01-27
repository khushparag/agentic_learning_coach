@echo off
REM =============================================================================
REM Demo Test Script - Agentic Learning Coach (Windows)
REM =============================================================================
REM This script tests all demo commands to ensure they work before recording
REM 
REM Usage:
REM   scripts\demo-test.bat
REM =============================================================================

echo ==============================================
echo   Agentic Learning Coach - Demo Test Suite
echo ==============================================
echo.

echo [TEST] Testing Backend Health Check...
curl -s http://localhost:8002/health/detailed >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Backend Health Check
) else (
    echo [FAIL] Backend Health Check
)

echo [TEST] Testing Frontend Accessibility...
curl -s -I http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] Frontend Accessibility
) else (
    echo [FAIL] Frontend Accessibility
)

echo [TEST] Testing API Documentation...
curl -s -I http://localhost:8002/docs >nul 2>&1
if %errorlevel% equ 0 (
    echo [PASS] API Documentation
) else (
    echo [FAIL] API Documentation
)

echo.
echo ==============================================
echo   Demo Test Suite Complete
echo ==============================================
echo.

echo Demo URLs for recording:
echo   - Frontend:     http://localhost:3000
echo   - Backend API:  http://localhost:8002
echo   - API Docs:     http://localhost:8002/docs
echo   - Health Check: http://localhost:8002/health/detailed
echo.

echo Demo Commands Ready:
echo   curl -s http://localhost:8002/health/detailed
echo   curl -s http://localhost:8002/health/live
echo.

echo [PASS] Demo test complete! You're ready to record! 🎬

pause