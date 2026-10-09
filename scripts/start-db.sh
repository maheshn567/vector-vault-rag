#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="postgresql"
MAX_WAIT_SECONDS=60

echo "Starting Docker Desktop..."
systemctl start --user docker-desktop

echo "Waiting for the Docker daemon to respond..."
waited=0
until docker info >/dev/null 2>&1; do
  if [ "$waited" -ge "$MAX_WAIT_SECONDS" ]; then
    echo "Docker daemon did not come up within ${MAX_WAIT_SECONDS}s." >&2
    exit 1
  fi
  sleep 2
  waited=$((waited + 2))
done
echo "Docker is ready."

if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Container '$CONTAINER_NAME' is already running."
elif docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
  echo "Starting existing container '$CONTAINER_NAME'..."
  docker start "$CONTAINER_NAME"
else
  echo "No container named '$CONTAINER_NAME' found." >&2
  echo "Run: docker ps -a   to see what containers exist." >&2
  exit 1
fi

echo "Done. '$CONTAINER_NAME' status:"
docker ps --filter "name=$CONTAINER_NAME" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}"
