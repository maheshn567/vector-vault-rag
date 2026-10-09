#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="postgresql"

if docker info >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Stopping container '$CONTAINER_NAME'..."
  docker stop "$CONTAINER_NAME"
else
  echo "Container '$CONTAINER_NAME' is not running (or Docker isn't up)."
fi

echo "Stopping Docker Desktop..."
systemctl stop --user docker-desktop

echo "Done."
