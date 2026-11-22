#!/usr/bin/env bash
# ==============================================================================
# AWS Emulator & UI - One-Command Teardown (Linux / macOS / WSL)
# ==============================================================================

echo "Stopping AWS Emulator & Console UI..."

# 1. Stop background dev server on port 3000
if command -v fuser >/dev/null 2>&1; then
  fuser -k 3000/tcp >/dev/null 2>&1 || true
elif command -v lsof >/dev/null 2>&1; then
  PID=$(lsof -ti :3000 2>/dev/null)
  if [ -n "$PID" ]; then
    kill -9 $PID 2>/dev/null || true
  fi
fi

# 2. Stop Docker Emulator and active EC2 instance containers
if command -v docker >/dev/null 2>&1; then
  docker rm -f aws-emulator >/dev/null 2>&1 || true
  INSTANCES=$(docker ps -q --filter "name=ec2-instance-" 2>/dev/null)
  if [ -n "$INSTANCES" ]; then
    docker rm -f $INSTANCES >/dev/null 2>&1 || true
  fi
fi

echo "All services stopped successfully."
