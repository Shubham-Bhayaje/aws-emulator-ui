#!/usr/bin/env bash
# ==============================================================================
# AWS Emulator & UI - One-Command Teardown (Linux / macOS / WSL)
# ==============================================================================

echo "============================================================"
echo " Stopping AWS Emulator & Console UI..."
echo "============================================================"

# 1. Kill Next.js and dev server processes belonging to this project
echo "[1/2] Stopping web console processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "scripts/dev.js" 2>/dev/null || true

# Also free port 3000 if occupied
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp >/dev/null 2>&1 || true
elif command -v lsof >/dev/null 2>&1; then
  PID=$(lsof -ti :3000 2>/dev/null)
  if [ -n "$PID" ]; then
    kill -9 "$PID" 2>/dev/null || true
  fi
fi

# 2. Stop and remove AWS Emulator container and simulated EC2 instance containers
echo "[2/2] Stopping and removing Docker containers..."
if command -v docker >/dev/null 2>&1; then
  if [ -n "$(docker ps -a -q --filter "name=aws-emulator" 2>/dev/null)" ]; then
    echo "Removing 'aws-emulator' container..."
    docker rm -f aws-emulator >/dev/null 2>&1 || true
  fi

  INSTANCES=$(docker ps -a -q --filter "name=ec2-instance-" 2>/dev/null)
  if [ -n "$INSTANCES" ]; then
    echo "Removing simulated EC2 instance containers..."
    docker rm -f $INSTANCES >/dev/null 2>&1 || true
  fi
fi

echo ""
echo "============================================================"
echo " All services and containers stopped successfully."
echo " Reminder: The AWS Emulator keeps all state in memory."
echo " Stopping and removing the container has erased all emulated"
echo " AWS resources (EC2 instances, S3 buckets, SQS queues, etc.)."
echo "============================================================"
