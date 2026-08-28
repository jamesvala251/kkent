import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/documents_panel.dart';
import '../widgets/forms.dart';
import '../widgets/ui.dart';
import 'driver_form_screen.dart';

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
    final canCreate = context.watch<AuthState>().can('drivers.create');
    return Scaffold(
      appBar: AppBar(title: Text(l.drivers)),
      floatingActionButton: canCreate
          ? FloatingActionButton(
              heroTag: 'fab-drivers',
              onPressed: () async {
                final ok = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(builder: (_) => const DriverFormScreen()),
                );
                if (ok == true) _load();
              },
              child: const Icon(Icons.add),
            )
          : null,
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
                    padding: const EdgeInsets.only(top: 4, bottom: 88),
                    itemCount: rows.length,
                    itemBuilder: (context, index) {
                      final row = rows[index];
                      return ListCard(
                        onTap: () async {
                          final ok = await Navigator.of(context).push<bool>(
                            MaterialPageRoute(
                              builder: (_) => DriverDetailScreen(id: row.id),
                            ),
                          );
                          if (ok == true) _load();
                        },
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
    final auth = context.watch<AuthState>();
    return Scaffold(
      appBar: AppBar(
        title: Text(_driver?.name ?? l.driver),
        actions: [
          if (auth.can('drivers.edit') && _driver != null)
            IconButton(
              onPressed: () async {
                final ok = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(
                    builder: (_) => DriverFormScreen(driver: _driver),
                  ),
                );
                if (ok == true) _load();
              },
              icon: const Icon(Icons.edit_outlined),
            ),
          if (auth.can('drivers.delete') && _driver != null)
            IconButton(
              onPressed: () async {
                if (!await confirmDelete(context)) return;
                try {
                  await context.read<AuthState>().api.deleteDriver(widget.id);
                  if (!mounted) return;
                  Navigator.pop(context, true);
                } catch (e) {
                  if (mounted) showError(context, e);
                }
              },
              icon: const Icon(Icons.delete_outline),
            ),
        ],
      ),
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
                Kv(l.address, driver.address),
                Kv(l.truck, driver.assignedTruck),
                Kv(l.license, driver.licenseNumber),
                Kv(l.licenseExpiry, formatDate(driver.licenseExpiry)),
                Kv(l.salaryType, driver.salaryType),
                Kv(l.monthlySalary, null, moneyValue: driver.monthlySalary),
                Kv(l.emergencyContact, driver.emergencyContact),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 110,
                        child: Text(
                          l.status,
                          style: const TextStyle(
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
            const SizedBox(height: 12),
            DocumentsPanel(
              type: 'driver',
              entityId: driver.id,
              canEdit: auth.can('drivers.edit'),
            ),
          ],
        ),
      ),
    );
  }
}
