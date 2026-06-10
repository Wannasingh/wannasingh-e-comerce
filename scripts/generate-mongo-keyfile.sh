#!/usr/bin/env bash
# =============================================================================
# scripts/generate-mongo-keyfile.sh
# Generates the MongoDB keyfile required for replica set authentication.
# Run this ONCE before starting docker-compose for the first time.
# =============================================================================
set -euo pipefail

KEYFILE_PATH="$(dirname "$0")/../docker/mongo/keyfile"

if [ -f "$KEYFILE_PATH" ]; then
  echo "⚠️  Keyfile already exists at $KEYFILE_PATH — skipping generation."
  exit 0
fi

echo "🔑 Generating MongoDB replica set keyfile..."
openssl rand -base64 756 > "$KEYFILE_PATH"
chmod 400 "$KEYFILE_PATH"

echo "✅ Keyfile generated at: $KEYFILE_PATH"
echo ""
echo "Next steps:"
echo "  1. docker compose up -d"
echo "  2. Wait for mongo-init to complete"
echo "  3. pnpm install"
