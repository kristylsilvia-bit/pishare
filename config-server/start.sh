#!/usr/bin/env bash
# Starts the Hermes config server. Invoked by the systemd unit and usable by hand.
set -euo pipefail

# Always run from this script's directory so relative paths + .env resolve.
cd "$(dirname "$0")"

# Install production deps on first run (no node_modules committed).
if [ ! -d node_modules ]; then
  echo "[hermes-config] Installing dependencies…"
  npm install --omit=dev
fi

exec node server.js
