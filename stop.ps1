# ==============================================================================
# AWS Emulator & UI - One-Command Teardown (Windows PowerShell)
# ==============================================================================

Write-Host "Stopping AWS Emulator & Console UI..." -ForegroundColor Yellow

# 1. Stop local Node server listening on port 3000
try {
    $portProcesses = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    if ($portProcesses) {
        foreach ($pidToStop in $portProcesses) {
            Stop-Process -Id $pidToStop -Force -ErrorAction SilentlyContinue
        }
        Write-Host "Stopped console UI server process." -ForegroundColor Green
    }
} catch {
    # Ignore
}

# 2. Stop Docker Emulator and EC2 containers (via native Docker or WSL)
$dockerPrefix = ""
if (Get-Command docker -ErrorAction SilentlyContinue) {
    try {
        $null = docker info 2>&1
        $dockerPrefix = "docker"
    } catch {}
}
if (-not $dockerPrefix) {
    $wslCheck = wsl -e which docker 2>$null
    if ($wslCheck) {
        $dockerPrefix = "wsl -e docker"
    }
}

if ($dockerPrefix) {
    # Stop emulator container
    if ($dockerPrefix -eq "docker") {
        docker rm -f aws-emulator 2>$null | Out-Null
        $instances = docker ps -q --filter "name=ec2-instance-" 2>$null
        if ($instances) {
            docker rm -f $instances 2>$null | Out-Null
        }
    } else {
        wsl -e docker rm -f aws-emulator 2>$null | Out-Null
        $rawInstances = wsl -e docker ps -q --filter "name=ec2-instance-" 2>$null
        if ($rawInstances) {
            wsl -e bash -c 'docker rm -f $(docker ps -q --filter "name=ec2-instance-") 2>/dev/null || true'
        }
    }
    Write-Host "Stopped AWS Emulator and simulated EC2 containers." -ForegroundColor Green
}

Write-Host "All services stopped successfully." -ForegroundColor Green
