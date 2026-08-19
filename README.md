# KK Enterprise - Transport & Equipment Management ERP

Enterprise-grade ERP for transport, fleet, and Hitachi equipment management.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19 + Vite + TypeScript |
| Mobile | Flutter (Android APK / iOS) |
| UI | Material UI (MUI) |
| State | Redux Toolkit |
| Charts | ApexCharts |
| Forms | React Hook Form + Yup |
| Backend | Laravel 12 |
| Database | MySQL / SQLite |
| Auth | Laravel Sanctum |
| PDF | DomPDF |
| Excel | Laravel Excel |

## Project Structure

```
kkent/
├── backend/          # Laravel REST API
├── frontend/         # React SPA
└── mobile/           # Flutter admin app
```

## Quick Start

### Backend

```bash
cd backend
cp .env.example .env
# Configure DB_CONNECTION=mysql for production

php artisan migrate --seed
php artisan storage:link
php artisan serve
```

**Default login:** `admin@kkenterprise.com` / `password`

API: `http://localhost:8000/api`

Swagger docs: `http://localhost:8000/api/documentation`

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App: `http://localhost:5173`

### Mobile admin (Flutter)

```bash
cd mobile
flutter pub get
flutter run
```

Android emulator talks to `http://10.0.2.2:8020/api`. See `mobile/README.md` for APK builds and production URL.

## API Modules

- Authentication (Login, Logout, Profile, Password Reset)
- Dashboard (Stats, Charts, Tables)
- Customers (CRUD, Ledger, Outstanding)
- Drivers (CRUD, Documents, Salary)
- Trucks (CRUD, Documents)
- Hitachi Machines (CRUD)
- Trips (CRUD, Auto Calculations)
- Expenses (CRUD, Categories)
- Salaries (CRUD, Advances)
- Invoices (CRUD, PDF)
- Maintenance (CRUD, Reminders)
- Reports (Daily, Monthly, Profit, etc.)
- Notifications
- Settings
- Global Search
- Audit Logs

## Architecture

- **Repository Pattern** - Data access layer
- **Service Layer** - Business logic
- **API Resources** - Response transformation
- **Form Requests** - Validation
- **Spatie Permissions** - Role-based access

## Roles

Super Admin, Admin, Manager, Accountant, Operator, Driver

## Deploy to Hostinger

See **[docs/HOSTINGER_DEPLOY.md](docs/HOSTINGER_DEPLOY.md)** for full upload steps.

Quick build:

```bash
./deploy/build-production.sh
```


See [docs/ER_DIAGRAM.md](docs/ER_DIAGRAM.md)
