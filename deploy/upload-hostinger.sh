#!/usr/bin/env bash
# Upload KK Enterprise to Hostinger via SSH (incremental rsync).
#
# Server layout (kk-enterpriseindia.com):
#   public_html/
#     backend/     ← Laravel app
#     assets/      ← React build
#     index.html   ← React entry
#     index.php    ← Laravel front controller
#
# First time setup:
#   1. Hostinger hPanel → Advanced → SSH Access → Enable SSH
#   2. Add a deploy SSH public key in Hostinger
#   3. export HOSTINGER_SSH="u255158670@187.124.102.138"
#   4. export HOSTINGER_SSH_PORT="65002"
#   5. export HOSTINGER_SSH_KEY_FILE="$HOME/.ssh/kkent_hostinger_deploy"
#
# Usage:
#   ./deploy/upload-hostinger.sh backend      # upload Laravel app only
#   ./deploy/upload-hostinger.sh public       # upload public_html files only
#   ./deploy/upload-hostinger.sh all          # upload both + run remote setup

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SSH_HOST="${HOSTINGER_SSH:-u255158670@187.124.102.138}"
SSH_PORT="${HOSTINGER_SSH_PORT:-65002}"
REMOTE_USER_HOME="${HOSTINGER_HOME:-/home/u255158670}"
REMOTE_PUBLIC="${HOSTINGER_PUBLIC_HTML:-${REMOTE_USER_HOME}/domains/kk-enterpriseindia.com/public_html}"
REMOTE_APP="${REMOTE_PUBLIC}/backend"
SSH_IDENTITY="${HOSTINGER_SSH_KEY_FILE:-}"

SSH_OPTS=(-p "${SSH_PORT}" -o StrictHostKeyChecking=accept-new -o BatchMode=yes)
RSYNC_SSH="ssh -p ${SSH_PORT} -o StrictHostKeyChecking=accept-new -o BatchMode=yes"

if [[ -n "${SSH_IDENTITY}" ]]; then
  SSH_OPTS+=(-i "${SSH_IDENTITY}")
  RSYNC_SSH="ssh -p ${SSH_PORT} -i ${SSH_IDENTITY} -o StrictHostKeyChecking=accept-new -o BatchMode=yes"
fi

upload_backend() {
  echo "==> Uploading Laravel backend to ${SSH_HOST}:${REMOTE_APP}"
  ssh "${SSH_OPTS[@]}" "${SSH_HOST}" "mkdir -p ${REMOTE_APP}"

  rsync -avz --progress -e "${RSYNC_SSH}" \
    --exclude '.env' \
    --exclude '.env.*' \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude 'storage/app/public/*' \
    --exclude 'storage/logs/*' \
    --exclude 'storage/framework/cache/data/*' \
    --exclude 'storage/framework/sessions/*' \
    --exclude 'storage/framework/views/*' \
    "${ROOT}/backend/" "${SSH_HOST}:${REMOTE_APP}/"
}

upload_public() {
  echo "==> Uploading public_html files to ${SSH_HOST}:${REMOTE_PUBLIC}"
  ssh "${SSH_OPTS[@]}" "${SSH_HOST}" "mkdir -p ${REMOTE_PUBLIC}/assets ${REMOTE_PUBLIC}/images"

  scp "${SSH_OPTS[@]}" "${ROOT}/deploy/hostinger/public_html/index.php" "${SSH_HOST}:${REMOTE_PUBLIC}/index.php"
  scp "${SSH_OPTS[@]}" "${ROOT}/deploy/hostinger/public_html/.htaccess" "${SSH_HOST}:${REMOTE_PUBLIC}/.htaccess"
  scp "${SSH_OPTS[@]}" "${ROOT}/backend/public/app.html" "${SSH_HOST}:${REMOTE_PUBLIC}/app.html"
  scp "${SSH_OPTS[@]}" "${ROOT}/backend/public/app.html" "${SSH_HOST}:${REMOTE_PUBLIC}/index.html"

  if [[ -f "${ROOT}/backend/public/robots.txt" ]]; then
    scp "${SSH_OPTS[@]}" "${ROOT}/backend/public/robots.txt" "${SSH_HOST}:${REMOTE_PUBLIC}/robots.txt"
  fi

  rsync -avz --delete --progress -e "${RSYNC_SSH}" \
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
if command -v composer >/dev/null 2>&1; then
  composer install --no-dev --optimize-autoloader
else
  echo "composer not found — ensure vendor/ was uploaded"
fi
chmod -R 775 storage bootstrap/cache
php artisan storage:link 2>/dev/null || true
php artisan migrate --force
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
