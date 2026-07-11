#!/usr/bin/env bash
# Build React frontend and copy into Laravel public/ for single-domain Hostinger deploy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DOMAIN="${1:-https://kk-enterpriseindia.com}"

echo "==> Building frontend for ${DOMAIN}"
cd "${ROOT}/frontend"

cat > .env.production <<EOF
VITE_API_URL=${DOMAIN}/api
EOF

npm run build:deploy

echo "==> Copying build into backend/public"
rm -rf "${ROOT}/backend/public/assets" "${ROOT}/backend/public/app.html"
cp -r dist/assets "${ROOT}/backend/public/assets"
cp dist/index.html "${ROOT}/backend/public/app.html"

if [ -f dist/favicon.ico ]; then
  cp dist/favicon.ico "${ROOT}/backend/public/favicon.ico"
fi
if [ -f dist/vite.svg ]; then
  cp dist/vite.svg "${ROOT}/backend/public/vite.svg"
fi

echo "==> Done. Upload the backend folder to Hostinger (see docs/HOSTINGER_DEPLOY.md)."
