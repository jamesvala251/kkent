import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../widgets/language_picker.dart';
import 'customers_screen.dart';
import 'diesel_screen.dart';
import 'drivers_screen.dart';
import 'outstanding_screen.dart';
import 'profile_screen.dart';
import 'trucks_screen.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final l = AppLocalizations.of(context);
    final tiles = <_MoreTile>[
      if (auth.can('customers.view'))
        _MoreTile(
          l.customers,
          l.moreCustomersSubtitle,
          Icons.people_outline,
          () => const CustomersScreen(),
        ),
      if (auth.can('trucks.view'))
        _MoreTile(
          l.trucks,
          l.moreTrucksSubtitle,
          Icons.local_shipping_outlined,
          () => const TrucksScreen(),
        ),
      if (auth.can('drivers.view'))
        _MoreTile(
          l.drivers,
          l.moreDriversSubtitle,
          Icons.badge_outlined,
          () => const DriversScreen(),
        ),
      if (auth.can('diesel.view'))
        _MoreTile(
          l.diesel,
          l.moreDieselSubtitle,
          Icons.local_gas_station_outlined,
          () => const DieselScreen(),
        ),
      if (auth.can('reports.view') || auth.can('invoices.view'))
        _MoreTile(
          l.outstanding,
          l.moreOutstandingSubtitle,
          Icons.account_balance_wallet_outlined,
          () => const OutstandingScreen(),
        ),
      _MoreTile(
        l.profile,
        l.moreProfileSubtitle,
        Icons.person_outline,
        () => const ProfileScreen(),
      ),
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
      children: [
        Text(
          auth.user?.name ?? l.account,
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
        ),
        const SizedBox(height: 4),
        Text(
          auth.user?.email ?? '',
          style: const TextStyle(color: AppColors.muted),
        ),
        const SizedBox(height: 16),
        const Card(
          child: Padding(
            padding: EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: LanguagePicker(),
          ),
        ),
        const SizedBox(height: 10),
        for (final tile in tiles)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Card(
              clipBehavior: Clip.antiAlias,
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppColors.navy.withValues(alpha: 0.1),
                  child: Icon(tile.icon, color: AppColors.navy),
                ),
                title: Text(
                  tile.title,
                  style: const TextStyle(fontWeight: FontWeight.w700),
                ),
                subtitle: Text(tile.subtitle),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(
                  context,
                ).push(MaterialPageRoute(builder: (_) => tile.page())),
              ),
            ),
          ),
      ],
    );
  }
}

class _MoreTile {
  const _MoreTile(this.title, this.subtitle, this.icon, this.page);

  final String title;
  final String subtitle;
  final IconData icon;
  final Widget Function() page;
}
