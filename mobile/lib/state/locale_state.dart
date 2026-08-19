import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';

class LocaleState extends ChangeNotifier {
  static const _storage = FlutterSecureStorage();
  static const _key = 'locale';

  Locale locale = const Locale('en');
  bool ready = false;

  Future<void> restore() async {
    await initializeDateFormatting('en_IN');
    await initializeDateFormatting('gu_IN');
    final saved = await _storage.read(key: _key);
    if (saved == 'gu' || saved == 'en') {
      locale = Locale(saved!);
    }
    _applyFormatting();
    ready = true;
    notifyListeners();
  }

  Future<void> setLanguage(String code) async {
    locale = Locale(code);
    await _storage.write(key: _key, value: code);
    _applyFormatting();
    notifyListeners();
  }

  void _applyFormatting() {
    Intl.defaultLocale = locale.languageCode == 'gu' ? 'gu_IN' : 'en_IN';
  }
}
