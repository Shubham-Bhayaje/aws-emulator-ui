#!/usr/bin/env bash
# ==============================================================================
# AWS Emulator Helper Script: ./scripts/emulator.sh {start|stop|status|env}
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT=9297
NAME="aws-emulator"
SHARE="$HOME/.aws/emulator"

case "$1" in
  start)
    mkdir -p "$SHARE"
    
    # Build image if it doesn't exist
    if ! docker image inspect $NAME >/dev/null 2>&1; then
      echo "Building AWS Emulator Docker image ($NAME)..."
      docker build -t $NAME -f "$DIR/Dockerfile.emulator" "$DIR" || exit 1
    fi

    # Remove existing container if any
    docker rm -f $NAME >/dev/null 2>&1

    echo "Starting AWS Emulator on 127.0.0.1:$PORT..."
    docker run -d --rm \
      --name $NAME \
      --memory=2g \
      --memory-swap=2g \
      -p 127.0.0.1:$PORT:$PORT \
      --user "$(id -u):$(id -g)" \
      -e HOME="$HOME" \
      -v "$SHARE:$SHARE" \
      $NAME -p $PORT --telemetry off

    echo "Waiting for emulator to generate certificates and credentials..."
    for i in $(seq 1 20); do
      if [ -f "$SHARE/$PORT/ca.pem" ]; then
        break
      fi
      sleep 1
    done

    if [ -f "$SHARE/$PORT/ca.pem" ]; then
      echo "AWS Emulator is ready!"
      echo ""
      echo "To configure your current terminal for AWS CLI, run:"
      echo "  eval \"\$($0 env)\""
    else
      echo "Warning: CA cert not detected yet. Check logs with: docker logs $NAME"
    fi
    ;;

  stop)
    echo "Stopping $NAME..."
    docker stop $NAME && echo "Stopped (in-memory emulator data cleared)."
    ;;

  status)
    docker ps --filter "name=$NAME"
    ;;

  env)
    echo "export AWS_SHARED_CREDENTIALS_FILE=$SHARE/$PORT/emulator_credentials"
    echo "export AWS_CONFIG_FILE=$SHARE/$PORT/config"
    echo "export AWS_CA_BUNDLE=$SHARE/$PORT/ca.pem"
    echo "export AWS_EC2_METADATA_DISABLED=true"
    ;;

  *)
    echo "Usage: $0 {start|stop|status|env}"
    echo ""
    echo "Commands:"
    echo "  start   - Builds Docker image (if missing) and starts emulator in background"
    echo "  stop    - Stops the running emulator container"
    echo "  status  - Shows whether emulator container is running"
    echo "  env     - Outputs AWS CLI environment variables to export"
    exit 1
    ;;
esac
