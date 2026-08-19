import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'l10n/app_localizations.dart';
import 'screens/home_shell.dart';
import 'screens/login_screen.dart';
import 'state/auth_state.dart';
import 'state/locale_state.dart';
import 'theme/app_theme.dart';
import 'widgets/company_logo.dart';

class KkentApp extends StatelessWidget {
  const KkentApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) {
            final locale = LocaleState();
            locale.restore();
            return locale;
          },
        ),
        ChangeNotifierProvider(
          create: (_) {
            final auth = AuthState();
            auth.restore();
            return auth;
          },
        ),
      ],
      child: Consumer<LocaleState>(
        builder: (context, locales, _) {
          return MaterialApp(
            title: 'KK Enterprise',
            debugShowCheckedModeBanner: false,
            theme: buildAppTheme(),
            locale: locales.ready ? locales.locale : const Locale('en'),
            supportedLocales: AppLocalizations.supportedLocales,
            localizationsDelegates: AppLocalizations.localizationsDelegates,
            home: const _Gate(),
          );
        },
      ),
    );
  }
}

class _Gate extends StatelessWidget {
  const _Gate();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final locales = context.watch<LocaleState>();
    if (!auth.ready || !locales.ready) {
      return const Scaffold(
        backgroundColor: Colors.white,
        body: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CompanyLogo(height: 72),
              SizedBox(height: 24),
              CircularProgressIndicator(color: AppColors.navy),
            ],
          ),
        ),
      );
    }
    return auth.isLoggedIn ? const HomeShell() : const LoginScreen();
  }
}
