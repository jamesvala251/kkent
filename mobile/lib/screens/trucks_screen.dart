import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/ui.dart';

class TrucksScreen extends StatefulWidget {
  const TrucksScreen({super.key});

  @override
  State<TrucksScreen> createState() => _TrucksScreenState();
}

class _TrucksScreenState extends State<TrucksScreen> {
  final _search = TextEditingController();
  List<TruckItem> _rows = [];
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
      final rows = await context.read<AuthState>().api.trucks(
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
      appBar: AppBar(title: Text(l.trucks)),
      body: Column(
        children: [
          SearchField(
            controller: _search,
            hint: l.searchTrucksHint,
            onSubmit: _load,
          ),
          Expanded(
            child: AsyncBody<List<TruckItem>>(
              loading: _loading,
              error: _error,
              data: _rows,
              onRetry: _load,
              builder: (rows) {
                if (rows.isEmpty) {
                  return EmptyState(
                    icon: Icons.local_shipping_outlined,
                    title: l.noTrucksFound,
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
                            builder: (_) => TruckDetailScreen(id: row.id),
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
                                      row.truckNumber,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      [
                                        row.brand,
                                        row.model,
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

class TruckDetailScreen extends StatefulWidget {
  const TruckDetailScreen({super.key, required this.id});

  final int id;

  @override
  State<TruckDetailScreen> createState() => _TruckDetailScreenState();
}

class _TruckDetailScreenState extends State<TruckDetailScreen> {
  TruckItem? _truck;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final truck = await context.read<AuthState>().api.truck(widget.id);
      if (!mounted) return;
      setState(() {
        _truck = truck;
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
      appBar: AppBar(title: Text(_truck?.truckNumber ?? l.truck)),
      body: AsyncBody<TruckItem>(
        loading: _loading,
        error: _error,
        data: _truck,
        onRetry: _load,
        builder: (truck) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
          children: [
            SectionCard(
              title: l.vehicle,
              children: [
                Kv(l.number, truck.truckNumber),
                Kv(l.brand, truck.brand),
                Kv(l.model, truck.model),
                Kv(l.capacity, truck.capacity),
                Kv(l.fuel, truck.fuelType),
                Kv(l.owner, truck.owner),
                Kv(l.km, truck.currentKm?.toString()),
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
                      StatusChip(truck.status ?? '—'),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SectionCard(
              title: l.documents,
              children: [
                Kv(l.insurance, formatDate(truck.insuranceExpiry)),
                Kv(l.fitness, formatDate(truck.fitnessExpiry)),
                Kv(l.permit, formatDate(truck.permitExpiry)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
