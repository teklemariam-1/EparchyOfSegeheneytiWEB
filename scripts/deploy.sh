#!/usr/bin/env bash
# deploy/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
# Remote deployment script for the Eparchy of Segeneyti website.
# This script is executed ON THE SERVER by the GitHub Actions deploy workflow.
#
# Prerequisites on the server:
#   - Node.js 20+, npm, PM2 installed globally
#   - .env.production.local present at $DEPLOY_PATH (never committed to Git)
#   - PostgreSQL running and migrated at least once
#
# Usage (manual):
#   cd /var/www/eparchy-segeneyti
#   bash scripts/deploy.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:-/var/www/eparchy-segeneyti}"
APP_NAME="eparchy-segeneyti"
LOG_PREFIX="[deploy $(date '+%Y-%m-%d %H:%M:%S')]"

log() { echo "$LOG_PREFIX $*"; }

cd "$DEPLOY_PATH"

log "=== Starting deployment ==="
log "Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'n/a')"

# ── 1. Install / update dependencies ─────────────────────────────────────────
log "Installing npm dependencies..."
npm ci --omit=dev

# ── 2. Run Payload database migrations ───────────────────────────────────────
log "Running database migrations..."
npm run migrate

# ── 3. Build Next.js ──────────────────────────────────────────────────────────
log "Building Next.js application..."
NODE_ENV=production npm run build

# ── 4. Generate Payload types (keeps CMS types in sync) ──────────────────────
log "Generating Payload types..."
npm run generate:types || log "WARN: generate:types failed (non-fatal)"

# ── 5. Reload PM2 (zero-downtime rolling restart) ────────────────────────────
log "Reloading PM2 process..."
if pm2 list | grep -q "$APP_NAME"; then
  pm2 reload "$APP_NAME" --update-env
else
  log "Starting new PM2 process..."
  pm2 start ecosystem.config.cjs --env production
fi

# ── 6. Save PM2 process list (persists across server reboots) ─────────────────
pm2 save

# ── 7. Quick self-health check ────────────────────────────────────────────────
log "Waiting for app to become ready..."
sleep 5
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" http://127.0.0.1:3000/ || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
  log "✓ App is healthy (HTTP 200)"
else
  log "✗ Health check returned HTTP $HTTP_STATUS — check pm2 logs"
  exit 1
fi

log "=== Deployment complete ==="
