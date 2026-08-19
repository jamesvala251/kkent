import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import '../models/models.dart';
import '../services/api_client.dart';
import '../services/kkent_api.dart';
import '../utils/permissions.dart';

class AuthState extends ChangeNotifier {
  AuthState() {
    api = KkentApi(
      ApiClient(
        tokenProvider: () => token,
        onUnauthorized: () {
          if (token != null) {
            _clearLocal();
            notifyListeners();
          }
        },
      ),
    );
  }

  static const _storage = FlutterSecureStorage();

  late final KkentApi api;
  bool ready = false;
  bool busy = false;
  String? token;
  UserAccount? user;
  String? error;
  int unreadCount = 0;

  bool get isLoggedIn => token != null && token!.isNotEmpty;

  bool can(String permission) {
    final account = user;
    if (account == null) return false;
    return hasPermission(account.roles, account.permissions, permission);
  }

  Future<void> restore() async {
    token = await _storage.read(key: 'token');
    final rawUser = await _storage.read(key: 'user');
    if (rawUser != null) {
      try {
        user = UserAccount.fromJson(jsonDecode(rawUser));
      } catch (_) {
        user = null;
      }
    }
    if (isLoggedIn) {
      try {
        user = await api.me();
        await _persist();
        await refreshUnread();
      } catch (_) {
        _clearLocal();
      }
    }
    ready = true;
    notifyListeners();
  }

  Future<void> refreshUnread() async {
    if (!isLoggedIn) {
      unreadCount = 0;
      return;
    }
    try {
      unreadCount = await api.unreadNotificationCount();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> applyUser(UserAccount next) async {
    user = next;
    await _persist();
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    busy = true;
    error = null;
    notifyListeners();
    try {
      final result = await api.login(email.trim(), password);
      token = result.token;
      await _persist();
      user = await api.me();
      await _persist();
      await refreshUnread();
      busy = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      error = e.message;
      busy = false;
      notifyListeners();
      return false;
    } catch (_) {
      error = 'Login failed';
      busy = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      if (isLoggedIn) await api.logout();
    } catch (_) {}
    _clearLocal();
    notifyListeners();
  }

  Future<void> _persist() async {
    if (token != null) await _storage.write(key: 'token', value: token);
    if (user != null) {
      await _storage.write(key: 'user', value: jsonEncode(user!.toJson()));
    }
  }

  void _clearLocal() {
    token = null;
    user = null;
    unreadCount = 0;
    _storage.delete(key: 'token');
    _storage.delete(key: 'user');
  }
}
