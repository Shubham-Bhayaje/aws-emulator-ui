@echo off
REM ==============================================================================
REM AWS Emulator & UI - One-Command Teardown (Windows Batch Wrapper)
REM ==============================================================================

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0stop.ps1"
