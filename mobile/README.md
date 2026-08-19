# KK Enterprise admin app (Flutter)

Android/iOS client for the existing Laravel API. Same login as the web app (`admin@kkenterprise.com` / `password` on local).

## What it covers

- Sign in with Sanctum
- Dashboard month stats
- Trips (search, view, delete)
- Invoices (filter by payment status, view)
- Expenses (list + add)
- Customers and ledger
- Notifications

## Run

Start the API first (`backend`, typically `http://127.0.0.1:8020`).

```bash
cd mobile
flutter pub get
flutter run
```

Android emulator uses `http://10.0.2.2:8020/api` automatically. iOS simulator uses `http://127.0.0.1:8020/api`.

Physical phone: pass your machine LAN URL:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8020/api
```

Production:

```bash
flutter run --dart-define=API_BASE_URL=https://your-domain.com/api
```

## APK

```bash
cd mobile
flutter build apk --release --dart-define=API_BASE_URL=https://your-domain.com/api
```

Output: `mobile/build/app/outputs/flutter-apk/app-release.apk`

Permissions follow the same role matrix as web (`dashboard.view`, `trips.*`, `invoices.*`, `expenses.*`, `customers.view`).
