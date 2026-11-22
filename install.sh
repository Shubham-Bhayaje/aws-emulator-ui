#!/usr/bin/env bash
# ==============================================================================
# AWS Emulator & UI - Automated All-In-One Installer & Launcher (POSIX)
# Usage:
#   curl -fsSL https://raw.githubusercontent.com/Shubham-Bhayaje/aws-emulator-ui/main/install.sh | bash
# ==============================================================================

set -e

echo "============================================================"
echo " AWS Emulator & Console UI - Complete Setup Installer"
echo "============================================================"

# Helper function to detect command
has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

# ------------------------------------------------------------------------------
# 1. Check and Install Git
# ------------------------------------------------------------------------------
echo "[1/5] Checking Git installation..."
if has_cmd git; then
  echo "Git is already installed: $(which git)"
else
  echo "Git not found. Attempting automatic installation..."
  if has_cmd apt-get; then
    sudo apt-get update -qq && sudo apt-get install -y git
  elif has_cmd dnf; then
    sudo dnf install -y git
  elif has_cmd yum; then
    sudo yum install -y git
  elif has_cmd brew; then
    brew install git
  elif has_cmd pacman; then
    sudo pacman -Sy --noconfirm git
  elif has_cmd apk; then
    sudo apk add --no-cache git
  else
    echo "[Warning] Could not detect package manager to install Git automatically."
  fi
fi

# ------------------------------------------------------------------------------
# 2. Check and Install Node.js
# ------------------------------------------------------------------------------
echo "[2/5] Checking Node.js installation..."
if has_cmd node && has_cmd npm; then
  echo "Node.js is already installed: $(which node) ($(node -v))"
else
  echo "Node.js not found. Installing Node.js..."
  if has_cmd brew; then
    brew install node
  elif has_cmd apt-get; then
    echo "Configuring NodeSource repository..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif has_cmd dnf; then
    sudo dnf install -y nodejs
  else
    echo "[Notice] Please install Node.js v20+ from: https://nodejs.org/"
  fi
fi

# ------------------------------------------------------------------------------
# 3. Check Docker Engine
# ------------------------------------------------------------------------------
echo "[3/5] Checking Docker engine..."
if has_cmd docker && docker info >/dev/null 2>&1; then
  echo "Docker daemon is active and running."
else
  echo "[Notice] Docker is required to run the AWS Emulator and simulated EC2 containers."
  echo "Please install or start Docker: https://docs.docker.com/get-docker/"
fi

# ------------------------------------------------------------------------------
# 4. Clone or Locate Project Repository
# ------------------------------------------------------------------------------
echo "[4/5] Setting up project repository..."
REPO_URL="https://github.com/Shubham-Bhayaje/aws-emulator-ui.git"
TARGET_DIR="aws-emulator-ui"

if [ -f "package.json" ] && [ -f "start.sh" ]; then
  echo "Already inside repository directory."
elif [ -d "$TARGET_DIR" ]; then
  echo "Repository directory '$TARGET_DIR' already exists. Entering directory..."
  cd "$TARGET_DIR"
  if has_cmd git; then
    git pull --quiet 2>/dev/null || true
  fi
else
  if has_cmd git; then
    echo "Cloning $REPO_URL ..."
    git clone "$REPO_URL" "$TARGET_DIR"
    cd "$TARGET_DIR"
  else
    echo "Git unavailable; downloading repository archive directly from GitHub..."
    curl -fsSL https://github.com/Shubham-Bhayaje/aws-emulator-ui/archive/refs/heads/main.tar.gz | tar -xz
    mv aws-emulator-ui-main "$TARGET_DIR"
    cd "$TARGET_DIR"
  fi
fi

# ------------------------------------------------------------------------------
# 5. Launch AWS Emulator & UI
# ------------------------------------------------------------------------------
echo "[5/5] Launching AWS Emulator & Console UI..."
chmod +x ./start.sh ./stop.sh 2>/dev/null || true
exec ./start.sh
