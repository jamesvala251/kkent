import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/ui.dart';

class DriversScreen extends StatefulWidget {
  const DriversScreen({super.key});

  @override
  State<DriversScreen> createState() => _DriversScreenState();
}

class _DriversScreenState extends State<DriversScreen> {
  final _search = TextEditingController();
  List<DriverItem> _rows = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await context.read<AuthState>().api.drivers(
        search: _search.text.trim(),
      );
      if (!mounted) return;
      setState(() {
        _rows = rows;
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
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.drivers)),
      body: Column(
        children: [
          SearchField(
            controller: _search,
            hint: l.searchDriversHint,
            onSubmit: _load,
          ),
          Expanded(
            child: AsyncBody<List<DriverItem>>(
              loading: _loading,
              error: _error,
              data: _rows,
              onRetry: _load,
              builder: (rows) {
                if (rows.isEmpty) {
                  return EmptyState(
                    icon: Icons.badge_outlined,
                    title: l.noDriversFound,
                    message: l.tryAnotherSearch,
                  );
                }
                return RefreshIndicator(
                  onRefresh: _load,
                  child: ListView.builder(
                    padding: const EdgeInsets.only(top: 4, bottom: 24),
                    itemCount: rows.length,
                    itemBuilder: (context, index) {
                      final row = rows[index];
                      return ListCard(
                        onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(
                            builder: (_) => DriverDetailScreen(id: row.id),
                          ),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      row.name,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      [
                                        row.mobile,
                                        row.assignedTruck,
                                      ].whereType<String>().join(' · '),
                                      style: const TextStyle(
                                        color: AppColors.muted,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (row.status != null) StatusChip(row.status!),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class DriverDetailScreen extends StatefulWidget {
  const DriverDetailScreen({super.key, required this.id});

  final int id;

  @override
  State<DriverDetailScreen> createState() => _DriverDetailScreenState();
}

class _DriverDetailScreenState extends State<DriverDetailScreen> {
  DriverItem? _driver;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final driver = await context.read<AuthState>().api.driver(widget.id);
      if (!mounted) return;
      setState(() {
        _driver = driver;
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
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(_driver?.name ?? l.driver)),
      body: AsyncBody<DriverItem>(
        loading: _loading,
        error: _error,
        data: _driver,
        onRetry: _load,
        builder: (driver) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
          children: [
            SectionCard(
              title: l.driver,
              children: [
                Kv(l.name, driver.name),
                Kv(l.mobile, driver.mobile),
                Kv(l.truck, driver.assignedTruck),
                Kv(l.license, driver.licenseNumber),
                Kv(l.licenseExpiry, formatDate(driver.licenseExpiry)),
                Kv(l.monthlySalary, null, moneyValue: driver.monthlySalary),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 110,
                        child: Text(
                          l.status,
                          style: TextStyle(
                            color: AppColors.muted,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      StatusChip(driver.status ?? '—'),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
