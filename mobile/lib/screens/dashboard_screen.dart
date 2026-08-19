import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/ui.dart';
import 'customers_screen.dart';
import 'outstanding_screen.dart';
import 'trucks_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  DashboardStats? _stats;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final stats = await context.read<AuthState>().api.dashboardStats();
      if (!mounted) return;
      setState(() {
        _stats = stats;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AsyncBody<DashboardStats>(
      loading: _loading,
      error: _error,
      data: _stats,
      onRetry: _load,
      builder: (stats) {
        final l = AppLocalizations.of(context);
        return RefreshIndicator(
          onRefresh: _load,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
            children: [
              Card(
                color: AppColors.navy,
                child: Padding(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l.thisMonth,
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.75),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        money(stats.monthlyProfit),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 28,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        l.profit,
                        style: const TextStyle(color: Colors.white70),
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: _MiniMoney(
                              label: l.income,
                              value: money(stats.monthlyIncome),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: _MiniMoney(
                              label: l.expenses,
                              value: money(stats.monthlyExpenses),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                l.overview,
                style: const TextStyle(
                  fontWeight: FontWeight.w800,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 10),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.25,
                children: [
                  StatTile(
                    label: l.pendingInvoices,
                    value: '${stats.pendingInvoices}',
                    icon: Icons.receipt_long,
                    color: AppColors.warning,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const OutstandingScreen(),
                      ),
                    ),
                  ),
                  StatTile(
                    label: l.trips,
                    value: '${stats.totalTrips}',
                    icon: Icons.route,
                    color: AppColors.indigo,
                  ),
                  StatTile(
                    label: l.customers,
                    value: '${stats.totalCustomers}',
                    icon: Icons.people,
                    color: AppColors.info,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const CustomersScreen(),
                      ),
                    ),
                  ),
                  StatTile(
                    label: l.trucks,
                    value: '${stats.totalTrucks}',
                    icon: Icons.local_shipping,
                    color: AppColors.navy,
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const TrucksScreen()),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _MiniMoney extends StatelessWidget {
  const _MiniMoney({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}
