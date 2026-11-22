@echo off
REM ==============================================================================
REM AWS Emulator & UI - Complete Setup Installer (Windows Batch Wrapper)
REM ==============================================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if %ERRORLEVEL% NEQ 0 (
    pause
)
