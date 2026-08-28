import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../utils/trip_share.dart';
import '../widgets/ui.dart';
import 'trip_form_screen.dart';

class TripsScreen extends StatefulWidget {
  const TripsScreen({super.key});

  @override
  State<TripsScreen> createState() => _TripsScreenState();
}

class _TripsScreenState extends State<TripsScreen> {
  final _search = TextEditingController();
  List<TripItem> _rows = [];
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
      final rows = await context.read<AuthState>().api.trips(
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
    final canCreate = context.watch<AuthState>().can('trips.create');
    return Stack(
      children: [
        Column(
          children: [
            SearchField(
              controller: _search,
              hint: l.searchTripsHint,
              onSubmit: _load,
            ),
            Expanded(
              child: AsyncBody<List<TripItem>>(
                loading: _loading,
                error: _error,
                data: _rows,
                onRetry: _load,
                emptyMessage: l.noTripsFound,
                builder: (rows) {
                  if (rows.isEmpty) {
                    return EmptyState(
                      icon: Icons.route,
                      title: l.noTripsFound,
                      message: l.tryAnotherSearch,
                    );
                  }
                  return RefreshIndicator(
                    onRefresh: _load,
                    child: ListView.builder(
                      padding: const EdgeInsets.only(top: 4, bottom: 88),
                      itemCount: rows.length,
                      itemBuilder: (context, index) {
                        final trip = rows[index];
                        return ListCard(
                          onTap: () async {
                            await Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => TripDetailScreen(id: trip.id),
                              ),
                            );
                            _load();
                          },
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    trip.tripNumber,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                                MoneyText(trip.totalFreight),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '${trip.fromLocation ?? '—'}  →  ${trip.toLocation ?? '—'}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              [
                                    trip.customerName,
                                    formatDate(trip.startDate),
                                    trip.truckNumber,
                                  ]
                                  .where(
                                    (v) => v != null && v.toString().isNotEmpty,
                                  )
                                  .join('  ·  '),
                              style: const TextStyle(
                                color: AppColors.muted,
                                fontSize: 13,
                              ),
                            ),
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
        if (canCreate)
          Positioned(
            right: 16,
            bottom: 16,
            child: FloatingActionButton.extended(
              heroTag: 'fab-trips',
              onPressed: () async {
                final saved = await Navigator.of(context).push<TripItem>(
                  MaterialPageRoute(builder: (_) => const TripFormScreen()),
                );
                if (saved == null || !mounted) return;
                _load();
                final share = await showDialog<bool>(
                  context: context,
                  builder: (context) {
                    final loc = AppLocalizations.of(context);
                    return AlertDialog(
                      title: Text(loc.shareTrip),
                      content: Text(loc.shareTripAfterSave),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: Text(loc.cancel),
                        ),
                        FilledButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: Text(loc.shareTrip),
                        ),
                      ],
                    );
                  },
                );
                if (share == true && mounted) {
                  await showTripShareSheet(context, saved);
                }
              },
              icon: const Icon(Icons.add),
              label: Text(l.add),
            ),
          ),
      ],
    );
  }
}

Future<void> showTripShareSheet(BuildContext context, TripItem trip) async {
  final l = AppLocalizations.of(context);
  await showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (sheetContext) {
      return SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              title: Text(l.shareTrip),
              subtitle: Text(
                trip.customerMobile?.trim().isNotEmpty == true
                    ? trip.customerMobile!
                    : l.shareNoCustomerMobile,
              ),
            ),
            ListTile(
              leading: const Icon(Icons.chat_outlined),
              title: Text(l.shareWhatsApp),
              onTap: () async {
                Navigator.pop(sheetContext);
                final ok = await openWhatsApp(
                  text: tripShareMessage(l, trip),
                  phone: trip.customerMobile,
                );
                if (!ok && context.mounted) {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text(l.cannotOpenWhatsApp)));
                }
              },
            ),
            ListTile(
              leading: const Icon(Icons.sms_outlined),
              title: Text(l.shareSms),
              onTap: () async {
                Navigator.pop(sheetContext);
                final ok = await openSms(
                  text: tripShareMessage(l, trip),
                  phone: trip.customerMobile,
                );
                if (!ok && context.mounted) {
                  ScaffoldMessenger.of(
                    context,
                  ).showSnackBar(SnackBar(content: Text(l.cannotOpenSms)));
                }
              },
            ),
          ],
        ),
      );
    },
  );
}

class TripDetailScreen extends StatefulWidget {
  const TripDetailScreen({super.key, required this.id});

  final int id;

  @override
  State<TripDetailScreen> createState() => _TripDetailScreenState();
}

class _TripDetailScreenState extends State<TripDetailScreen> {
  TripItem? _trip;
  bool _loading = true;
  String? _error;

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
      final trip = await context.read<AuthState>().api.trip(widget.id);
      if (!mounted) return;
      setState(() {
        _trip = trip;
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

  Future<void> _delete() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) {
        final l = AppLocalizations.of(context);
        return AlertDialog(
          title: Text(l.deleteTrip),
          content: Text(l.deleteTripConfirm),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(l.cancel),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(l.delete),
            ),
          ],
        );
      },
    );
    if (ok != true || !mounted) return;
    try {
      await context.read<AuthState>().api.deleteTrip(widget.id);
      if (!mounted) return;
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _share() async {
    final trip = _trip;
    if (trip == null) return;
    await showTripShareSheet(context, trip);
  }

  Future<void> _edit() async {
    final trip = _trip;
    if (trip == null) return;
    final saved = await Navigator.of(context).push<TripItem>(
      MaterialPageRoute(builder: (_) => TripFormScreen(trip: trip)),
    );
    if (saved != null) _load();
  }

  @override
  Widget build(BuildContext context) {
    final canDelete = context.watch<AuthState>().can('trips.delete');
    final canEdit = context.watch<AuthState>().can('trips.edit');
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(_trip?.tripNumber ?? l.trip),
        actions: [
          IconButton(
            onPressed: _trip == null ? null : _share,
            icon: const Icon(Icons.share_outlined),
            tooltip: l.shareTrip,
          ),
          if (canEdit)
            IconButton(
              onPressed: _trip == null ? null : _edit,
              icon: const Icon(Icons.edit_outlined),
              tooltip: l.editTrip,
            ),
          if (canDelete)
            IconButton(
              onPressed: _trip == null ? null : _delete,
              icon: const Icon(Icons.delete_outline),
            ),
        ],
      ),
      body: AsyncBody<TripItem>(
        loading: _loading,
        error: _error,
        data: _trip,
        onRetry: _load,
        builder: (trip) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
          children: [
            SectionCard(
              title: l.route,
              children: [
                Kv(l.date, formatDate(trip.startDate)),
                Kv(l.from, trip.fromLocation),
                Kv(l.to, trip.toLocation),
                Kv(l.customer, trip.customerName),
                Kv(l.truck, trip.truckNumber),
                Kv(l.driver, trip.driverName),
              ],
            ),
            const SizedBox(height: 12),
            SectionCard(
              title: l.load,
              children: [
                Kv(l.material, trip.material),
                Kv(
                  l.weight,
                  trip.weight == null ? null : l.weightTons('${trip.weight}'),
                ),
                Kv(l.km, trip.totalKm?.toString()),
                Kv(l.remarks, trip.remarks),
              ],
            ),
            const SizedBox(height: 12),
            SectionCard(
              title: l.money,
              children: [
                Kv(l.freight, null, moneyValue: trip.totalFreight),
                Kv(l.expense, null, moneyValue: trip.totalExpense),
                Kv(l.profit, null, moneyValue: trip.profit, highlight: true),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
