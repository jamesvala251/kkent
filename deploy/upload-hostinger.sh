#!/usr/bin/env bash
# Upload KK Enterprise to Hostinger via SSH (run from your Mac).
#
# First time setup:
#   1. Hostinger hPanel → Advanced → SSH Access → Enable SSH
#   2. Copy SSH host, username, and port from that page
#   3. export HOSTINGER_SSH="u255158670@your-ssh-host.hostinger.com"
#   4. export HOSTINGER_SSH_PORT="65002"   # check Hostinger panel — often 65002
#
# Usage:
#   ./deploy/upload-hostinger.sh backend      # upload Laravel app
#   ./deploy/upload-hostinger.sh public       # upload public_html files
#   ./deploy/upload-hostinger.sh all          # upload both

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH_HOST="${HOSTINGER_SSH:-}"
SSH_PORT="${HOSTINGER_SSH_PORT:-65002}"
REMOTE_USER_HOME="${HOSTINGER_HOME:-/home/u255158670}"
REMOTE_APP="${REMOTE_USER_HOME}/kk-enterprise"
REMOTE_PUBLIC="${REMOTE_USER_HOME}/domains/kk-enterpriseindia.com/public_html"

if [[ -z "${SSH_HOST}" ]]; then
  echo "Error: Set HOSTINGER_SSH first."
  echo '  export HOSTINGER_SSH="u255158670@YOUR-SSH-HOST"'
  echo '  export HOSTINGER_SSH_PORT="65002"'
  exit 1
fi

SSH_OPTS=(-p "${SSH_PORT}" -o StrictHostKeyChecking=accept-new)
RSYNC_SSH="ssh -p ${SSH_PORT} -o StrictHostKeyChecking=accept-new"

upload_backend() {
  echo "==> Uploading Laravel backend to ${SSH_HOST}:${REMOTE_APP}"
  ssh "${SSH_OPTS[@]}" "${SSH_HOST}" "mkdir -p ${REMOTE_APP}"

  rsync -avz --progress -e "${RSYNC_SSH}" \
    --exclude '.env' \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'storage/logs/*' \
    --exclude 'storage/framework/cache/*' \
    --exclude 'storage/framework/sessions/*' \
    --exclude 'storage/framework/views/*' \
    "${ROOT}/backend/" "${SSH_HOST}:${REMOTE_APP}/"

  echo "==> Uploading production .env"
  if [[ -f "${ROOT}/backend/.env.production" ]]; then
    scp "${SSH_OPTS[@]}" "${ROOT}/backend/.env.production" "${SSH_HOST}:${REMOTE_APP}/.env"
  else
    echo "Warning: backend/.env.production not found — upload .env manually"
  fi
}

upload_public() {
  echo "==> Uploading public_html files to ${SSH_HOST}:${REMOTE_PUBLIC}"
  ssh "${SSH_OPTS[@]}" "${SSH_HOST}" "mkdir -p ${REMOTE_PUBLIC}/assets ${REMOTE_PUBLIC}/images"

  scp "${SSH_OPTS[@]}" "${ROOT}/deploy/hostinger/public_html.index.php" "${SSH_HOST}:${REMOTE_PUBLIC}/index.php"
  scp "${SSH_OPTS[@]}" "${ROOT}/backend/public/.htaccess" "${SSH_HOST}:${REMOTE_PUBLIC}/.htaccess"
  scp "${SSH_OPTS[@]}" "${ROOT}/backend/public/app.html" "${SSH_HOST}:${REMOTE_PUBLIC}/app.html"
  scp "${SSH_OPTS[@]}" "${ROOT}/backend/public/robots.txt" "${SSH_HOST}:${REMOTE_PUBLIC}/robots.txt"

  rsync -avz --progress -e "${RSYNC_SSH}" \
    "${ROOT}/backend/public/assets/" "${SSH_HOST}:${REMOTE_PUBLIC}/assets/"

  if [[ -d "${ROOT}/backend/public/images" ]]; then
    rsync -avz --progress -e "${RSYNC_SSH}" \
      "${ROOT}/backend/public/images/" "${SSH_HOST}:${REMOTE_PUBLIC}/images/"
  fi
}

run_remote_setup() {
  echo "==> Running Laravel setup on server"
  ssh "${SSH_OPTS[@]}" "${SSH_HOST}" <<EOF
set -e
cd ${REMOTE_APP}
composer install --no-dev --optimize-autoloader 2>/dev/null || echo "Run composer install manually if needed"
chmod -R 775 storage bootstrap/cache
php artisan storage:link 2>/dev/null || true
php artisan config:cache
php artisan route:cache
php artisan view:cache
echo "Server setup complete."
EOF
}

TARGET="${1:-all}"

case "${TARGET}" in
  backend) upload_backend ;;
  public)  upload_public ;;
  all)
    upload_backend
    upload_public
    run_remote_setup
    ;;
  *)
    echo "Usage: $0 [backend|public|all]"
    exit 1
    ;;
esac

echo "Done. Open https://kk-enterpriseindia.com"
