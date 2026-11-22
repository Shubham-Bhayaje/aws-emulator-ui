#!/usr/bin/env bash
# ==============================================================================
# AWS Emulator & UI - One-Command Launcher (Linux / macOS / WSL)
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

echo "============================================================"
echo " AWS Emulator & Management Console UI - One-Command Setup"
echo "============================================================"

# 1. Verify Docker is installed and daemon is running
if ! command -v docker >/dev/null 2>&1; then
  echo "[Error] Docker is not installed or not in PATH."
  echo "Please install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[Error] Docker daemon is not running."
  echo "Please start Docker and retry."
  exit 1
fi
echo "[1/4] Docker daemon verified."

# 2. Ensure AWS Emulator container is running on port 9297
echo "[2/4] Checking AWS Emulator status..."
if [ -n "$(docker ps -q --filter "name=aws-emulator" 2>/dev/null)" ]; then
  echo "AWS Emulator container is already running."
else
  echo "Starting AWS Emulator container on port 9297..."
  docker rm -f aws-emulator >/dev/null 2>&1 || true
  EMU_DIR="$HOME/.aws/emulator"
  mkdir -p "$EMU_DIR"
  docker run -d --rm -p 127.0.0.1:9297:9297 -v "$EMU_DIR:/home/emulator/.aws/emulator" --name aws-emulator aws-emulator:latest -p 9297 --telemetry off
  sleep 2
fi

# 3. Ensure Node.js dependencies are installed
if [ ! -d "node_modules" ]; then
  echo "[3/4] Installing project dependencies (npm install)..."
  npm install
else
  echo "[3/4] Project dependencies ready."
fi

# 4. Check if UI is already running on port 3000
if curl -s -f --connect-timeout 1 --max-time 2 http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
  echo "[4/4] Console UI is already running on http://localhost:3000."
  echo "Opening web console in browser..."
  (
    if command -v cmd.exe >/dev/null 2>&1; then
      cmd.exe /c start http://localhost:3000 >/dev/null 2>&1 || true
    elif command -v wslview >/dev/null 2>&1; then
      wslview http://localhost:3000 >/dev/null 2>&1 || true
    elif command -v open >/dev/null 2>&1; then
      open http://localhost:3000 >/dev/null 2>&1 || true
    elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open http://localhost:3000 >/dev/null 2>&1 || true
    fi
  ) &
  exit 0
fi

echo "[4/4] Launching Console UI on http://localhost:3000 ..."
echo "============================================================"
echo " AWS Management Console UI"
echo "============================================================"
echo " Web Console URL:    http://localhost:3000"
echo " Emulator Endpoint:  https://127.0.0.1:9297"

if grep -qi microsoft /proc/version 2>/dev/null; then
  WSL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo " WSL 2 Environment Detected:"
  echo "   Access URL:       http://localhost:3000"
  if [ -n "$WSL_IP" ]; then
    echo "   Direct WSL IP:    http://${WSL_IP}:3000"
  fi
  echo "   If Windows Chrome shows Connection Refused, run natively on"
  echo "   Windows via 'start.bat' or enable 'networkingMode=mirrored'."
fi

echo ""
echo " Server is active. Pages compile on-demand when you open the URL."
echo " Press Ctrl+C in this terminal to stop the server."
echo " To stop all containers and services, run: ./stop.sh"
echo "============================================================"

# Auto-open browser in background so it never blocks
(
  if command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start http://localhost:3000 >/dev/null 2>&1 || true
  elif command -v wslview >/dev/null 2>&1; then
    wslview http://localhost:3000 >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open http://localhost:3000 >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open http://localhost:3000 >/dev/null 2>&1 || true
  fi
) &

exec node scripts/dev.js
