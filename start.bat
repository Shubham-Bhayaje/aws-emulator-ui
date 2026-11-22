@echo off
REM ==============================================================================
REM AWS Emulator & UI - One-Command Launcher (Windows Batch Wrapper)
REM ==============================================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1"
if %ERRORLEVEL% NEQ 0 (
    pause
)
