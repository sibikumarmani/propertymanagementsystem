#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

docker compose down -v
docker compose up --build -d mysql backend agent-python frontend

echo "Local database volume was reset and services were rebuilt."
