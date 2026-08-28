import 'dart:io';

import 'package:flutter/foundation.dart';

class ApiConfig {
  ApiConfig._();

  /// Live Hostinger API (release / client APK default).
  static const String liveBaseUrl = 'https://kk-enterpriseindia.com/api';

  /// Override at build/run time, e.g.:
  /// `flutter run --dart-define=API_BASE_URL=https://kk-enterpriseindia.com/api`
  /// `flutter build apk --release` already uses [liveBaseUrl] when this is empty.
  static const String fromDefine = String.fromEnvironment('API_BASE_URL');

  /// Force live API even in debug:
  /// `flutter run --dart-define=USE_LIVE_API=true`
  static const bool useLiveApi = bool.fromEnvironment(
    'USE_LIVE_API',
    defaultValue: false,
  );

  static String get baseUrl {
    if (fromDefine.isNotEmpty) return fromDefine;
    if (useLiveApi || kReleaseMode) return liveBaseUrl;
    if (kIsWeb) return 'http://127.0.0.1:8020/api';
    if (Platform.isAndroid) return 'http://10.0.2.2:8020/api';
    return 'http://127.0.0.1:8020/api';
  }

  static String get origin {
    return baseUrl.replaceFirst(RegExp(r'/api/?$'), '');
  }

  static String storageUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    if (path.startsWith('http')) return path;
    return '$origin/storage/${path.replaceFirst(RegExp(r'^/+'), '')}';
  }
}
