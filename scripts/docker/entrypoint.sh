#!/usr/bin/env bash
set -e

PORT="${PORT:-3000}"
EMULATOR_PORT="${EMULATOR_PORT:-9297}"
SHARE_DIR="${AWS_EMULATOR_SHARE:-/root/.aws/emulator}"
CA_FILE="${SHARE_DIR}/${EMULATOR_PORT}/ca.pem"
CRED_FILE="${SHARE_DIR}/${EMULATOR_PORT}/emulator_credentials"
CONFIG_FILE="${SHARE_DIR}/${EMULATOR_PORT}/config"

echo "[AWS Emulator UI] Initializing container..."

# If emulator endpoint is provided, wait for CA certificate
if [ -n "$AWS_ENDPOINT_URL" ]; then
  echo "[AWS Emulator UI] Target endpoint: $AWS_ENDPOINT_URL"
  echo "[AWS Emulator UI] Waiting for CA certificate at $CA_FILE ..."
  for i in $(seq 1 30); do
    if [ -s "$CA_FILE" ]; then
      break
    fi
    sleep 1
  done

  if [ -s "$CA_FILE" ]; then
    echo "[AWS Emulator UI] CA certificate found: $CA_FILE"
    export NODE_EXTRA_CA_CERTS="$CA_FILE"
  else
    echo "[AWS Emulator UI] Warning: CA certificate not found within 30s. Starting anyway..."
  fi

  if [ -s "$CRED_FILE" ]; then
    export AWS_SHARED_CREDENTIALS_FILE="$CRED_FILE"
  fi

  if [ -s "$CONFIG_FILE" ]; then
    export AWS_CONFIG_FILE="$CONFIG_FILE"
  fi
fi

export AWS_EC2_METADATA_DISABLED="true"
export HOST="0.0.0.0"

echo "[AWS Emulator UI] Starting Next.js server on http://0.0.0.0:${PORT} ..."
exec npm start -- -p "${PORT}" -H 0.0.0.0
