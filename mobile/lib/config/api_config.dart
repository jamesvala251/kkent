import 'dart:io';

import 'package:flutter/foundation.dart';

class ApiConfig {
  ApiConfig._();

  /// Override at build time:
  /// `flutter run --dart-define=API_BASE_URL=https://your-domain.com/api`
  static const String fromDefine = String.fromEnvironment('API_BASE_URL');

  static String get baseUrl {
    if (fromDefine.isNotEmpty) return fromDefine;
    if (kIsWeb) return 'http://127.0.0.1:8020/api';
    if (Platform.isAndroid) return 'http://10.0.2.2:8020/api';
    return 'http://127.0.0.1:8020/api';
  }
}
