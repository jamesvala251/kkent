import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../state/auth_state.dart';
import '../widgets/company_logo.dart';
import 'dashboard_screen.dart';
import 'expenses_screen.dart';
import 'invoices_screen.dart';
import 'more_screen.dart';
import 'notifications_screen.dart';
import 'profile_screen.dart';
import 'search_screen.dart';
import 'trips_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthState>().refreshUnread();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    final l = AppLocalizations.of(context);
    final tabs = <_Tab>[
      if (auth.can('dashboard.view'))
        _Tab(
          _TabKind.home,
          l.tabHome,
          Icons.dashboard_outlined,
          Icons.dashboard,
          const DashboardScreen(),
        ),
      if (auth.can('trips.view'))
        _Tab(
          _TabKind.trips,
          l.tabTrips,
          Icons.route_outlined,
          Icons.route,
          const TripsScreen(),
        ),
      if (auth.can('invoices.view'))
        _Tab(
          _TabKind.invoices,
          l.tabInvoices,
          Icons.receipt_long_outlined,
          Icons.receipt_long,
          const InvoicesScreen(),
        ),
      if (auth.can('expenses.view'))
        _Tab(
          _TabKind.expenses,
          l.tabExpenses,
          Icons.payments_outlined,
          Icons.payments,
          const ExpensesScreen(),
        ),
      _Tab(
        _TabKind.more,
        l.tabMore,
        Icons.grid_view_outlined,
        Icons.grid_view,
        const MoreScreen(),
      ),
    ];

    if (tabs.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: Text(l.appTitle)),
        body: Center(child: Text(l.noModulePermissions)),
      );
    }

    final safeIndex = _index.clamp(0, tabs.length - 1);
    final current = tabs[safeIndex];

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 8,
        leadingWidth: 96,
        leading: const Padding(
          padding: EdgeInsets.only(left: 12, top: 8, bottom: 8),
          child: CompanyLogo(
            height: 28,
            backgroundColor: Colors.white,
            padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
          ),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(current.kind == _TabKind.home ? l.appTitle : current.label),
            if (current.kind == _TabKind.home)
              Text(
                auth.user?.name ?? 'Admin',
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.white.withValues(alpha: 0.75),
                  fontWeight: FontWeight.w400,
                ),
              ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: l.search,
            onPressed: () {
              Navigator.of(
                context,
              ).push(MaterialPageRoute(builder: (_) => const SearchScreen()));
            },
            icon: const Icon(Icons.search),
          ),
          IconButton(
            tooltip: l.notifications,
            onPressed: () async {
              await Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const NotificationsScreen()),
              );
              if (context.mounted) {
                context.read<AuthState>().refreshUnread();
              }
            },
            icon: Badge(
              isLabelVisible: auth.unreadCount > 0,
              label: Text('${auth.unreadCount}'),
              child: const Icon(Icons.notifications_outlined),
            ),
          ),
          PopupMenuButton<String>(
            icon: CircleAvatar(
              radius: 16,
              backgroundColor: Colors.white.withValues(alpha: 0.18),
              child: Text(
                (auth.user?.name.isNotEmpty == true ? auth.user!.name[0] : 'A')
                    .toUpperCase(),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                  fontSize: 13,
                ),
              ),
            ),
            onSelected: (value) {
              if (value == 'profile') {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const ProfileScreen()),
                );
              }
              if (value == 'logout') {
                auth.logout();
              }
            },
            itemBuilder: (context) {
              return [
                PopupMenuItem(
                  enabled: false,
                  child: Text(auth.user?.email ?? ''),
                ),
                const PopupMenuDivider(),
                PopupMenuItem(value: 'profile', child: Text(l.profile)),
                PopupMenuItem(value: 'logout', child: Text(l.signOut)),
              ];
            },
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: IndexedStack(
        index: safeIndex,
        children: tabs.map((tab) => tab.page).toList(),
      ),
      bottomNavigationBar: tabs.length < 2
          ? null
          : NavigationBar(
              selectedIndex: safeIndex,
              onDestinationSelected: (value) => setState(() => _index = value),
              destinations: [
                for (final tab in tabs)
                  NavigationDestination(
                    icon: Icon(tab.icon),
                    selectedIcon: Icon(tab.selectedIcon),
                    label: tab.label,
                  ),
              ],
            ),
    );
  }
}

class _Tab {
  const _Tab(this.kind, this.label, this.icon, this.selectedIcon, this.page);

  final _TabKind kind;
  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final Widget page;
}

enum _TabKind { home, trips, invoices, expenses, more }
