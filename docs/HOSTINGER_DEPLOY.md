# Deploy KK Enterprise on Hostinger

Website: **https://kk-enterpriseindia.com**

Database (from Hostinger panel):

| Setting  | Value                      |
|----------|----------------------------|
| Database | `u255158670_kk_enterprise` |
| User     | `u255158670_kk`            |
| Host     | `localhost`                |
| Password | *(set when you created the user)* |

---

## Step 1 — Build on your computer

From the project root:

```bash
chmod +x deploy/build-production.sh
./deploy/build-production.sh
```

This builds the React app and copies it into `backend/public/` (`assets/` + `app.html`).

---

## Step 2 — Create production `.env` on the server

On Hostinger, create `.env` inside the Laravel folder (see folder layout below).

Copy from `backend/.env.hostinger.example` and set:

- `APP_KEY` — generate locally: `cd backend && php artisan key:generate --show`
- `DB_PASSWORD` — the MySQL password you chose in Hostinger
- `APP_DEBUG=false`

---

## Step 3 — Upload files (recommended folder layout)

Hostinger home directory example:

```
/home/u255158670/
├── kk-enterprise/              ← Laravel app (NOT web-accessible)
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── public/                 ← contains index.php, assets/, app.html, images/
│   ├── resources/
│   ├── routes/
│   ├── storage/
│   ├── vendor/                 ← run composer install OR upload from local
│   └── .env
└── domains/kk-enterpriseindia.com/
    └── public_html/            ← website document root
        ├── index.php           ← use deploy/hostinger/public_html.index.php
        ├── .htaccess           ← copy from backend/public/.htaccess
        ├── assets/             ← copy from backend/public/assets/
        ├── app.html            ← copy from backend/public/app.html
        ├── images/             ← copy from backend/public/images/
        └── favicon.ico         ← if present
```

### Option A — Easier (single folder)

Upload the entire `backend/` folder. In Hostinger **Websites → Manage → Advanced → Document Root**, point the domain to:

`domains/kk-enterpriseindia.com/public_html/public`

*(Only if Hostinger allows changing document root to a subfolder.)*

### Option B — Standard Hostinger (recommended)

1. Upload `backend/` to `/home/u255158670/kk-enterprise/`
2. Copy **contents** of `backend/public/` into `public_html/`
3. Replace `public_html/index.php` with `deploy/hostinger/public_html.index.php`
4. Edit `$laravelRoot` in that file if your path differs (default: `/home/u255158670/kk-enterprise`)

---

## Step 4 — Install PHP dependencies

Hostinger **Terminal** or SSH:

```bash
cd ~/kk-enterprise
composer install --no-dev --optimize-autoloader
```

If `composer` is not available, run locally and upload the `vendor/` folder:

```bash
cd backend
composer install --no-dev --optimize-autoloader
```

---

## Step 5 — PHP version & permissions

1. Hostinger hPanel → **Advanced → PHP Configuration** → select **PHP 8.2** or **8.3**
2. Set folder permissions:

```bash
chmod -R 775 storage bootstrap/cache
```

---

## Step 6 — Database setup

In Hostinger Terminal:

```bash
cd ~/kk-enterprise
php artisan migrate --seed --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**Default login after seed:**

- Email: `admin@kkenterprise.com`
- Password: `password`

Change the admin password immediately after first login.

### No SSH?

1. Open **phpMyAdmin** from Hostinger
2. Run migrations manually is difficult — prefer Hostinger Terminal
3. Or export your local MySQL database and import via phpMyAdmin

---

## Step 7 — Verify

| URL | Expected |
|-----|----------|
| https://kk-enterpriseindia.com/ | Landing page |
| https://kk-enterpriseindia.com/auth/login | ERP login |
| https://kk-enterpriseindia.com/api/auth/login | API (POST) |

---

## Automatic deploy on push to `main`

GitHub Actions deploys when `backend/`, `frontend/`, or `deploy/` changes on `main` (mobile-only commits are skipped).

### One-time setup

1. **Create a deploy SSH key** on your Mac:

```bash
ssh-keygen -t ed25519 -C "github-kkent-deploy" -f ~/.ssh/kkent_hostinger_deploy -N ""
cat ~/.ssh/kkent_hostinger_deploy.pub
```

2. **Hostinger** → SSH Access → **Add SSH key** → paste the `.pub` content.

3. **GitHub** → repo **Settings → Secrets and variables → Actions** → add:

| Secret | Value |
|--------|--------|
| `HOSTINGER_SSH_KEY` | Full contents of `~/.ssh/kkent_hostinger_deploy` (private key) |

Optional overrides (defaults match your server):

| Secret | Default |
|--------|---------|
| `HOSTINGER_SSH_HOST` | `187.124.102.138` |
| `HOSTINGER_SSH_PORT` | `65002` |
| `HOSTINGER_SSH_USER` | `u255158670` |
| `HOSTINGER_HOME` | `/home/u255158670` |
| `HOSTINGER_PUBLIC_HTML` | `/home/u255158670/domains/kk-enterpriseindia.com/public_html` |

4. Push to `main`. Check **Actions** tab for deploy status.

The workflow builds React, rsyncs only changed files, keeps server `.env` and uploads, then runs `migrate`, `config:cache`, and `route:cache`.

### Manual deploy (same as CI)

```bash
./deploy/build-production.sh
export HOSTINGER_SSH_KEY_FILE="$HOME/.ssh/kkent_hostinger_deploy"
./deploy/upload-hostinger.sh all
```

---

## Updating the site later

On your computer:

```bash
./deploy/build-production.sh
```

Re-upload changed files:

- `public_html/assets/`
- `public_html/app.html`
- `kk-enterprise/` code changes as needed

Then on server:

```bash
cd ~/kk-enterprise
php artisan migrate --force
php artisan config:cache
php artisan route:cache
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 500 error | Check `storage/logs/laravel.log`; set `APP_DEBUG=true` briefly |
| Blank page | Ensure `app.html` and `assets/` exist in `public_html` |
| Database error | Verify `.env` DB name, user, password; host is `localhost` |
| CSS/JS 404 | Re-run `./deploy/build-production.sh` and re-upload `assets/` |
| Login fails | Confirm `APP_URL` matches your domain exactly (https) |

---

## Security checklist

- [ ] `APP_DEBUG=false`
- [ ] Strong `DB_PASSWORD`
- [ ] Change default admin password
- [ ] Do not upload `.env` to Git
