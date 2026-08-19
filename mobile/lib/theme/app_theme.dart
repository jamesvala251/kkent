import 'package:flutter/material.dart';

class AppColors {
  static const navy = Color(0xFF1A237E);
  static const navyDark = Color(0xFF0D1642);
  static const indigo = Color(0xFF3949AB);
  static const canvas = Color(0xFFF4F6FB);
  static const line = Color(0xFFE3E8F0);
  static const muted = Color(0xFF5C6B8A);
  static const ink = Color(0xFF1A1A2E);
  static const success = Color(0xFF2E7D32);
  static const warning = Color(0xFFED6C02);
  static const danger = Color(0xFFD32F2F);
  static const info = Color(0xFF1565C0);
}

ThemeData buildAppTheme() {
  const navy = AppColors.navy;
  final scheme = ColorScheme.fromSeed(
    seedColor: navy,
    primary: navy,
    surface: Colors.white,
  ).copyWith(onPrimary: Colors.white, secondary: AppColors.indigo);

  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.canvas,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.navy,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: Colors.white,
      ),
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.line),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: AppColors.line),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: navy, width: 1.5),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: navy,
        foregroundColor: Colors.white,
        minimumSize: const Size.fromHeight(52),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Colors.white,
      indicatorColor: navy.withValues(alpha: 0.12),
      elevation: 0,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return TextStyle(
          fontSize: 12,
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          color: selected ? navy : AppColors.muted,
        );
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        final selected = states.contains(WidgetState.selected);
        return IconThemeData(color: selected ? navy : AppColors.muted);
      }),
    ),
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.navy,
      foregroundColor: Colors.white,
    ),
    chipTheme: ChipThemeData(
      selectedColor: AppColors.navy.withValues(alpha: 0.12),
      backgroundColor: Colors.white,
      side: const BorderSide(color: AppColors.line),
      labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
      showCheckmark: false,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
    ),
    snackBarTheme: SnackBarThemeData(
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
  );
}
