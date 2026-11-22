# ==============================================================================
# AWS Emulator & UI - One-Command Launcher (Windows PowerShell)
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " AWS Emulator & Management Console UI - One-Command Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Determine Docker Command (Native Windows or WSL)
$dockerPrefix = ""
if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        $null = docker info 2>&1
        $dockerPrefix = "docker"
    } catch {
        # Native docker daemon not responding
    }
}

if (-not $dockerPrefix) {
    $wslCheck = wsl -e which docker 2>$null
    if ($wslCheck) {
        $dockerPrefix = "wsl -e docker"
        Write-Host "[1/4] Docker engine detected inside WSL." -ForegroundColor Green
    } else {
        Write-Host "[Error] Docker is not installed or not running." -ForegroundColor Red
        Write-Host "Please install or start Docker Desktop: https://docs.docker.com/desktop/setup/install/windows-install/"
        exit 1
    }
} else {
    Write-Host "[1/4] Native Windows Docker engine detected." -ForegroundColor Green
}

# 2. Ensure AWS Emulator container is running on port 9297
Write-Host "[2/4] Checking AWS Emulator status on port 9297..." -ForegroundColor Yellow
$emulatorPortOpen = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 9297)
    $emulatorPortOpen = $true
    $tcp.Close()
} catch {
    $emulatorPortOpen = $false
}

if ($emulatorPortOpen) {
    Write-Host "AWS Emulator is already running on port 9297." -ForegroundColor Green
} else {
    Write-Host "Starting AWS Emulator container on port 9297..." -ForegroundColor Yellow
    $emuDir = "$env:USERPROFILE\.aws\emulator"
    New-Item -ItemType Directory -Force $emuDir | Out-Null

    if ($dockerPrefix -eq "docker") {
        docker run -d --rm -p 127.0.0.1:9297:9297 -v "${emuDir}:/home/emulator/.aws/emulator" --name aws-emulator aws-emulator:latest -p 9297 --telemetry off
    } else {
        $wslEmuDir = (wsl -e wslpath -u $emuDir).Trim()
        wsl -e docker run -d --rm -p 127.0.0.1:9297:9297 -v "${wslEmuDir}:/home/emulator/.aws/emulator" --name aws-emulator aws-emulator:latest -p 9297 --telemetry off
    }
    Start-Sleep -Seconds 2
}

# 3. Ensure Node dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "[3/4] Installing project dependencies (npm install)..." -ForegroundColor Yellow
    npm install
} else {
    Write-Host "[3/4] Project dependencies ready." -ForegroundColor Green
}

# 4. Check if UI is already running on port 3000
$uiPortOpen = $false
try {
    $tcpUi = New-Object System.Net.Sockets.TcpClient
    $tcpUi.Connect("127.0.0.1", 3000)
    $uiPortOpen = $true
    $tcpUi.Close()
} catch {
    $uiPortOpen = $false
}

if ($uiPortOpen) {
    Write-Host "[4/4] Console UI is already running on http://localhost:3000." -ForegroundColor Green
    Write-Host "Opening web console in browser..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000"
    exit 0
}

Write-Host "[4/4] Launching Console UI on http://localhost:3000 ..." -ForegroundColor Yellow
Write-Host "============================================================" -ForegroundColor Green
Write-Host " AWS Management Console UI" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host " Web Console URL:    http://localhost:3000" -ForegroundColor Cyan
Write-Host " Emulator Endpoint:  https://127.0.0.1:9297" -ForegroundColor Cyan
Write-Host ""
Write-Host " Press Ctrl+C in this terminal to stop the server." -ForegroundColor Gray
Write-Host " To stop all containers and services, run: .\stop.ps1" -ForegroundColor Gray
Write-Host "============================================================" -ForegroundColor Green

# Open browser and launch server
Start-Process "http://localhost:3000"
node scripts/dev.js
