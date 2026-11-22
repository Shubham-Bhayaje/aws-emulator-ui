# ==============================================================================
# AWS Emulator & UI - Automated All-In-One Installer & Launcher (PowerShell)
# Usage:
#   irm https://raw.githubusercontent.com/Shubham-Bhayaje/aws-emulator-ui/main/install.ps1 | iex
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " AWS Emulator & Console UI - Complete Setup Installer" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

function Refresh-PathEnvironment {
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $defaultGitPaths = "C:\Program Files\Git\cmd;C:\Program Files\Git\bin;C:\Program Files\nodejs"
    $env:Path = "$machinePath;$userPath;$defaultGitPaths"
}

# ------------------------------------------------------------------------------
# 1. Check and Install Git
# ------------------------------------------------------------------------------
Write-Host "[1/5] Checking Git installation..." -ForegroundColor Yellow
$gitCmd = Get-Command git -ErrorAction SilentlyContinue

if (-not $gitCmd) {
    Refresh-PathEnvironment
    $gitCmd = Get-Command git -ErrorAction SilentlyContinue
}

if ($gitCmd) {
    Write-Host "Git is already installed: $($gitCmd.Source)" -ForegroundColor Green
} else {
    Write-Host "Git is not installed. Attempting automatic installation via winget..." -ForegroundColor Yellow
    $hasWinget = Get-Command winget -ErrorAction SilentlyContinue
    if ($hasWinget) {
        try {
            Write-Host "Installing Git for Windows via winget..." -ForegroundColor Yellow
            winget install --id Git.Git -e --source winget --accept-source-agreements --accept-package-agreements --silent
            Refresh-PathEnvironment
            $gitCmd = Get-Command git -ErrorAction SilentlyContinue
        } catch {
            Write-Host "[Warning] Winget installation encountered an error." -ForegroundColor DarkYellow
        }
    }

    if (-not $gitCmd) {
        Write-Host "Downloading standalone Git for Windows installer..." -ForegroundColor Yellow
        $installerUrl = "https://github.com/git-for-windows/git/releases/download/v2.47.1.windows.1/Git-2.47.1-64-bit.exe"
        $installerPath = "$env:TEMP\Git-Installer.exe"
        try {
            Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
            Write-Host "Running silent Git installer..." -ForegroundColor Yellow
            Start-Process -FilePath $installerPath -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL", "/SP-", "/CLOSEAPPLICATIONS" -Wait
            Remove-Item -Force $installerPath -ErrorAction SilentlyContinue
            Refresh-PathEnvironment
            $gitCmd = Get-Command git -ErrorAction SilentlyContinue
        } catch {
            Write-Host "[Warning] Standalone Git installer download failed: $_" -ForegroundColor DarkYellow
        }
    }
}

# ------------------------------------------------------------------------------
# 2. Check and Install Node.js
# ------------------------------------------------------------------------------
Write-Host "[2/5] Checking Node.js installation..." -ForegroundColor Yellow
$nodeCmd = Get-Command node -ErrorAction SilentlyContinue

if (-not $nodeCmd) {
    Refresh-PathEnvironment
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
}

if ($nodeCmd) {
    Write-Host "Node.js is already installed: $($nodeCmd.Source)" -ForegroundColor Green
} else {
    Write-Host "Node.js is not installed. Attempting installation via winget..." -ForegroundColor Yellow
    $hasWinget = Get-Command winget -ErrorAction SilentlyContinue
    if ($hasWinget) {
        try {
            winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements --silent
            Refresh-PathEnvironment
            $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
        } catch {
            Write-Host "[Warning] Winget installation for Node.js failed." -ForegroundColor DarkYellow
        }
    }

    if (-not $nodeCmd) {
        Write-Host "[Action Required] Please install Node.js v20+ from: https://nodejs.org/" -ForegroundColor Red
    }
}

# ------------------------------------------------------------------------------
# 3. Check Docker Engine (Native or WSL)
# ------------------------------------------------------------------------------
Write-Host "[3/5] Checking Docker engine..." -ForegroundColor Yellow
$dockerReady = $false

if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        $null = docker info 2>&1
        $dockerReady = $true
        Write-Host "Native Docker Desktop is running." -ForegroundColor Green
    } catch {}
}

if (-not $dockerReady) {
    $wslCheck = wsl -e which docker 2>$null
    if ($wslCheck) {
        $dockerReady = $true
        Write-Host "Docker engine detected inside WSL." -ForegroundColor Green
    }
}

if (-not $dockerReady) {
    Write-Host "[Notice] Docker is required to run the AWS Emulator and simulated EC2 containers." -ForegroundColor DarkYellow
    Write-Host "If not already installed, please download Docker Desktop: https://docs.docker.com/desktop/setup/install/windows-install/" -ForegroundColor Cyan
}

# ------------------------------------------------------------------------------
# 4. Clone or Locate Project Repository
# ------------------------------------------------------------------------------
Write-Host "[4/5] Setting up project repository..." -ForegroundColor Yellow
$repoUrl = "https://github.com/Shubham-Bhayaje/aws-emulator-ui.git"
$targetDirName = "aws-emulator-ui"

# Check if current directory is already the repository
if ((Test-Path "package.json") -and (Test-Path "start.ps1")) {
    Write-Host "Already inside repository directory." -ForegroundColor Green
} elseif (Test-Path $targetDirName) {
    Write-Host "Repository directory '$targetDirName' already exists. Navigating into directory..." -ForegroundColor Green
    Set-Location $targetDirName
    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-Host "Fetching latest changes..." -ForegroundColor Yellow
        git pull --quiet 2>$null
    }
} else {
    $gitAvailable = Get-Command git -ErrorAction SilentlyContinue
    if ($gitAvailable) {
        Write-Host "Cloning $repoUrl ..." -ForegroundColor Yellow
        git clone $repoUrl $targetDirName
        Set-Location $targetDirName
    } else {
        Write-Host "Git not found in PATH; downloading repository archive directly from GitHub..." -ForegroundColor Yellow
        $zipUrl = "https://github.com/Shubham-Bhayaje/aws-emulator-ui/archive/refs/heads/main.zip"
        $zipFile = "$env:TEMP\aws-emulator-ui.zip"
        Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile -UseBasicParsing
        Expand-Archive -Path $zipFile -DestinationPath "." -Force
        Remove-Item -Force $zipFile -ErrorAction SilentlyContinue
        if (Test-Path "aws-emulator-ui-main") {
            Rename-Item -Path "aws-emulator-ui-main" -NewName $targetDirName
        }
        Set-Location $targetDirName
    }
}

# ------------------------------------------------------------------------------
# 5. Launch AWS Emulator & UI
# ------------------------------------------------------------------------------
Write-Host "[5/5] Launching AWS Emulator & Console UI..." -ForegroundColor Green
if (Test-Path "start.ps1") {
    & .\start.ps1
} else {
    Write-Host "[Error] start.ps1 not found in $(Get-Location)." -ForegroundColor Red
    exit 1
}
