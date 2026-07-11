# Local environment setup (share with colleagues)

`.env` files are **not** in Git (they contain secrets). Share these **example** files instead.

## Quick setup after cloning

```bash
git clone https://github.com/jamesvala251/kkent.git
cd kkent
```

### Backend

```bash
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --port=8020
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Local URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8020/api |
| Login | http://localhost:5173/auth/login |

**Default login:** `admin@kkenterprise.com` / `password`

## Database (local MySQL)

Create database first:

```sql
CREATE DATABASE kk_enterprise;
```

Then in `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=kk_enterprise
DB_USERNAME=root
DB_PASSWORD=          # your local MySQL password, if any
```

### SQLite alternative (no MySQL)

In `backend/.env`:

```env
DB_CONNECTION=sqlite
# comment out DB_HOST, DB_DATABASE, DB_USERNAME, DB_PASSWORD
```

Then:

```bash
touch database/database.sqlite
php artisan migrate --seed
```

## Files to share

| Share this | Colleague copies to |
|------------|---------------------|
| `backend/.env.example` | `backend/.env` |
| `frontend/.env.example` | `frontend/.env` |

**Do not share:**

- `backend/.env.production` (server password)
- Your personal `backend/.env` with real keys

## Production (Hostinger)

See `docs/HOSTINGER_DEPLOY.md` and `backend/.env.hostinger.example`.
