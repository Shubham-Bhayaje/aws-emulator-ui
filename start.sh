#!/usr/bin/env bash
# ==============================================================================
# AWS Emulator & UI - Hardened One-Command Launcher (Linux / macOS / WSL)
# ==============================================================================

set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# Source NVM if present so node/npm are in PATH for non-login shells
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
elif [ -d "$HOME/.nvm/versions/node" ]; then
  NODE_BIN=$(find "$HOME/.nvm/versions/node" -maxdepth 2 -type d -name bin 2>/dev/null | sort -V | tail -n 1)
  if [ -n "$NODE_BIN" ]; then
    export PATH="$NODE_BIN:$PATH"
  fi
fi

echo "============================================================"
echo " AWS Emulator & Management Console UI - One-Command Setup"
echo "============================================================"

# ------------------------------------------------------------------------------
# 1. Preflight Checks
# ------------------------------------------------------------------------------
echo "[1/5] Running preflight system and environment checks..."

# 1a. Docker Installation & Daemon Check
if ! command -v docker >/dev/null 2>&1; then
  echo "[Preflight Error] Docker is not installed or not found in PATH."
  echo "Fix: Follow the Docker Setup Guide in README.md or visit: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "[Preflight Error] Docker daemon is not active or running."
  if grep -qi microsoft /proc/version 2>/dev/null; then
    echo "Fix (WSL): Run 'sudo service docker start' to start Docker Engine,"
    echo "           or open Docker Desktop on Windows if using WSL integration."
  else
    echo "Fix: Start the Docker service ('sudo systemctl start docker' or launch Docker Desktop)."
  fi
  exit 1
fi

# 1b. WSL-Specific Checks (networkingMode & memory)
IS_WSL=0
if grep -qi microsoft /proc/version 2>/dev/null; then
  IS_WSL=1
fi

if [ "$IS_WSL" -eq 1 ]; then
  # Check for mirrored networking mode
  if command -v wslinfo >/dev/null 2>&1; then
    NET_MODE=$(wslinfo --networking-mode 2>/dev/null || echo "")
    if [ "$NET_MODE" = "mirrored" ]; then
      echo ""
      echo "============================================================"
      echo "[Preflight Error] WSL networking mode is set to 'mirrored'."
      echo "============================================================"
      echo "WSL 'networkingMode=mirrored' causes internal loopback and"
      echo "Docker port forwarding connections to time out on this system."
      echo ""
      echo "Required Fix:"
      echo "  1. Open %USERPROFILE%\\.wslconfig in Windows (e.g. C:\\Users\\<user>\\.wslconfig)."
      echo "  2. Remove or comment out 'networkingMode=mirrored' (default is 'nat')."
      echo "  3. In a Windows PowerShell or CMD terminal, run:"
      echo "       wsl --shutdown"
      echo "  4. Re-open WSL and run ./start.sh again."
      echo "============================================================"
      exit 1
    fi
  fi

  # Loopback self-test on 127.0.0.1
  echo "Running 127.0.0.1 loopback self-test..."
  TEST_PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()' 2>/dev/null || echo "8765")
  python3 -m http.server "$TEST_PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
  TEST_PID=$!
  sleep 1

  TEST_OK=0
  if curl -m 3 -sS -o /dev/null -w "%{http_code}" "http://127.0.0.1:${TEST_PORT}/" 2>/dev/null | grep -q "200"; then
    TEST_OK=1
  fi

  kill "$TEST_PID" >/dev/null 2>&1 || true
  wait "$TEST_PID" >/dev/null 2>&1 || true

  if [ "$TEST_OK" -ne 1 ]; then
    echo ""
    echo "============================================================"
    echo "[Preflight Error] Local connections inside WSL are broken."
    echo "============================================================"
    echo "A connection to 127.0.0.1:${TEST_PORT} timed out or was refused."
    echo "This indicates that WSL 2 virtual networking is wedged or"
    echo "that 'networkingMode=mirrored' is causing loopback failures."
    echo ""
    echo "Required Fix:"
    echo "  1. Ensure %USERPROFILE%\\.wslconfig does NOT set 'networkingMode=mirrored'."
    echo "  2. In Windows PowerShell or CMD, restart WSL:"
    echo "       wsl --shutdown"
    echo "  3. Re-open WSL and run ./start.sh again."
    echo "============================================================"
    exit 1
  fi

  # Memory availability check
  if command -v free >/dev/null 2>&1; then
    AVAIL_MEM=$(free -m 2>/dev/null | awk '/^Mem:/{print $7}')
    if [ -n "$AVAIL_MEM" ] && [ "$AVAIL_MEM" -lt 2000 ]; then
      echo ""
      echo "============================================================"
      echo "[Preflight Warning] Available memory is low: only ${AVAIL_MEM} MB available."
      echo "Next.js ('next dev') requires approximately 2.2 GB RAM during compilation."
      echo "Processes consuming the most memory:"
      ps aux --sort=-%mem 2>/dev/null | head -5 || true
      echo ""
      echo "Recommendation to avoid out-of-memory kills:"
      echo "  Add or update %USERPROFILE%\\.wslconfig in Windows:"
      echo "    [wsl2]"
      echo "    memory=5GB"
      echo "    swap=6GB"
      echo "  Then run 'wsl --shutdown' in PowerShell."
      echo "============================================================"
      echo ""
    fi
  fi
fi

echo "Preflight checks passed."

# ------------------------------------------------------------------------------
# 2. AWS Emulator Container Lifecycle
# ------------------------------------------------------------------------------
echo "[2/5] Checking AWS Emulator container..."

# Check if image exists; if not, build it from Dockerfile.emulator
if ! docker image inspect aws-emulator >/dev/null 2>&1 && ! docker image inspect aws-emulator:latest >/dev/null 2>&1; then
  echo "AWS Emulator image not found. Building 'aws-emulator' from Dockerfile.emulator..."
  docker build -t aws-emulator -f Dockerfile.emulator .
fi

# Check container state
CONTAINER_STATUS=$(docker inspect --format '{{.State.Status}}' aws-emulator 2>/dev/null || echo "not_found")

if [ "$CONTAINER_STATUS" = "running" ]; then
  echo "AWS Emulator container 'aws-emulator' is already running."
elif [ "$CONTAINER_STATUS" = "exited" ] || [ "$CONTAINER_STATUS" = "created" ]; then
  echo "Starting existing 'aws-emulator' container..."
  docker start aws-emulator
else
  # Container does not exist; create it (never use --rm)
  echo "Creating and starting 'aws-emulator' container on port 9297..."
  EMU_DIR="$HOME/.aws/emulator"
  mkdir -p "$EMU_DIR"
  docker run -d \
    --name aws-emulator \
    --restart unless-stopped \
    --memory=2g \
    --memory-swap=2g \
    -p 127.0.0.1:9297:9297 \
    --user "$(id -u):$(id -g)" \
    -e HOME="$HOME" \
    -v "$HOME/.aws/emulator:$HOME/.aws/emulator" \
    aws-emulator \
    -p 9297 \
    --telemetry off
fi

# ------------------------------------------------------------------------------
# 3. Emulator Health Check (Up to 30 Seconds)
# ------------------------------------------------------------------------------
echo "[3/5] Waiting up to 30 seconds for AWS Emulator health check on https://127.0.0.1:9297..."
HEALTHY=0
for i in $(seq 1 30); do
  if [ -f "$HOME/.aws/emulator/9297/ca.pem" ]; then
    RESP=$(curl -sS -m 2 --cacert "$HOME/.aws/emulator/9297/ca.pem" https://127.0.0.1:9297/__admin/health 2>/dev/null || true)
    if [ "$RESP" = "ok" ]; then
      HEALTHY=1
      break
    fi
  fi
  sleep 1
done

if [ "$HEALTHY" -ne 1 ]; then
  echo ""
  echo "============================================================"
  echo "[Error] AWS Emulator health check failed after 30 seconds."
  echo "Endpoint https://127.0.0.1:9297/__admin/health did not return 'ok'."
  echo "============================================================"
  echo "Recent container logs (docker logs --tail 20 aws-emulator):"
  docker logs --tail 20 aws-emulator 2>&1 || true
  echo ""
  echo "Running container network diagnostic..."
  CONTAINER_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' aws-emulator 2>/dev/null || true)
  if [ -n "$CONTAINER_IP" ]; then
    DIRECT_RESP=$(curl -sS -m 3 -k "https://${CONTAINER_IP}:9297/__admin/health" 2>/dev/null || true)
    if [ "$DIRECT_RESP" = "ok" ]; then
      echo "[Diagnostic] Emulator is healthy but the published port is not reachable: check WSL networking mode."
      echo "Direct container IP (${CONTAINER_IP}:9297) responded 'ok', but published port 127.0.0.1:9297 timed out."
      echo "Fix: Verify %USERPROFILE%\\.wslconfig uses 'networkingMode=nat', then run 'wsl --shutdown'."
    else
      echo "[Diagnostic] Emulator is not responding even on container IP ${CONTAINER_IP}."
      echo "Check memory and container logs above."
    fi
  fi
  exit 1
fi

echo "AWS Emulator is healthy."

# ------------------------------------------------------------------------------
# 4. Project Dependencies
# ------------------------------------------------------------------------------
if [ ! -d "node_modules" ]; then
  echo "[4/5] Installing project dependencies (npm install)..."
  npm install
else
  echo "[4/5] Project dependencies ready."
fi

# ------------------------------------------------------------------------------
# 5. Launch Next.js Dev Server (bound to 127.0.0.1)
# ------------------------------------------------------------------------------
# Check if UI is already running on port 3000
if curl -s -f --connect-timeout 1 --max-time 2 http://127.0.0.1:3000/api/health >/dev/null 2>&1; then
  echo "[5/5] Console UI is already running on http://127.0.0.1:3000."
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

echo "[5/5] Launching Console UI on http://127.0.0.1:3000 ..."
echo "============================================================"
echo " AWS Management Console UI"
echo "============================================================"
echo " Local URLs:        http://localhost:3000"
echo "                    http://127.0.0.1:3000"
echo " Emulator Endpoint: https://127.0.0.1:9297"

if [ "$IS_WSL" -eq 1 ]; then
  WSL_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
  echo ""
  echo " WSL 2 Environment Detected:"
  if [ -n "$WSL_IP" ]; then
    echo "   Direct WSL IP:   http://${WSL_IP}:3000"
  fi
  echo "   If Windows Chrome shows 'Connection Refused', try http://127.0.0.1:3000"
  echo "   or the direct WSL IP address above."
fi

echo ""
echo " Note: The AWS Emulator writes a new CA certificate (ca.pem) on each restart."
echo " If the emulator container is restarted, you must restart the console UI"
echo " so Next.js reloads the certificate via NODE_EXTRA_CA_CERTS."
echo ""
echo " Server is active. Pages compile on-demand when you open the URL."
echo " Press Ctrl+C in this terminal to stop the server."
echo " To stop all containers and services, run: ./stop.sh"
echo "============================================================"

# Auto-open browser in background
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

export HOST=127.0.0.1
exec node scripts/dev.js
