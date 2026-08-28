# KK Enterprise admin app (Flutter)

Android/iOS client for the Laravel API at **https://kk-enterpriseindia.com**.

Local debug login (seeded): `admin@kkenterprise.com` / `password`.
Live login: use your Hostinger admin account.

## API targets

| Mode | API |
|------|-----|
| Debug (`flutter run`) | Local — Android emulator `http://10.0.2.2:8020/api`, iOS/macOS `http://127.0.0.1:8020/api` |
| Release APK | Live — `https://kk-enterpriseindia.com/api` |
| Override | `--dart-define=API_BASE_URL=...` |

Force live API while debugging:

```bash
flutter run --dart-define=USE_LIVE_API=true
# or
flutter run --dart-define=API_BASE_URL=https://kk-enterpriseindia.com/api
```

## Run (local API)

Start the API first (`backend`, typically `http://127.0.0.1:8020`).

```bash
cd mobile
flutter pub get
flutter run
```

Physical phone against your Mac:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8020/api
```

## Client APK (live API)

```bash
cd mobile
flutter build apk --release
```

Release builds use `https://kk-enterpriseindia.com/api` automatically.

Optional explicit URL:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://kk-enterpriseindia.com/api
```

Output: `mobile/build/app/outputs/flutter-apk/app-release.apk`

Permissions follow the same role matrix as web (`dashboard.view`, `trips.*`, `invoices.*`, `expenses.*`, `customers.view`).
