import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/ui.dart';

class CustomersScreen extends StatefulWidget {
  const CustomersScreen({super.key});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  final _search = TextEditingController();
  List<CustomerItem> _rows = [];
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
      final rows = await context.read<AuthState>().api.customers(
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
      appBar: AppBar(title: Text(l.customers)),
      body: Column(
        children: [
          SearchField(
            controller: _search,
            hint: l.searchCustomersHint,
            onSubmit: _load,
          ),
          Expanded(
            child: AsyncBody<List<CustomerItem>>(
              loading: _loading,
              error: _error,
              data: _rows,
              onRetry: _load,
              builder: (rows) {
                if (rows.isEmpty) {
                  return EmptyState(
                    icon: Icons.people_outline,
                    title: l.noCustomersFound,
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
                            builder: (_) => CustomerDetailScreen(id: row.id),
                          ),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 14,
                            vertical: 6,
                          ),
                          leading: CircleAvatar(
                            backgroundColor: AppColors.navy.withValues(
                              alpha: 0.1,
                            ),
                            foregroundColor: AppColors.navy,
                            child: Text(
                              row.name.isEmpty
                                  ? '?'
                                  : row.name[0].toUpperCase(),
                            ),
                          ),
                          title: Text(
                            row.name,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          subtitle: Text(
                            [row.companyName, row.mobile, row.city]
                                .where((v) => v != null && v.isNotEmpty)
                                .join('  ·  '),
                          ),
                          trailing: const Icon(
                            Icons.chevron_right,
                            color: AppColors.muted,
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

class CustomerDetailScreen extends StatefulWidget {
  const CustomerDetailScreen({super.key, required this.id});

  final int id;

  @override
  State<CustomerDetailScreen> createState() => _CustomerDetailScreenState();
}

class _CustomerDetailScreenState extends State<CustomerDetailScreen> {
  CustomerLedger? _ledger;
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
      final ledger = await context.read<AuthState>().api.customerLedger(
        widget.id,
      );
      if (!mounted) return;
      setState(() {
        _ledger = ledger;
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
      appBar: AppBar(title: Text(_ledger?.customer.name ?? l.customer)),
      body: AsyncBody<CustomerLedger>(
        loading: _loading,
        error: _error,
        data: _ledger,
        onRetry: _load,
        builder: (ledger) {
          return RefreshIndicator(
            onRefresh: _load,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              children: [
                Card(
                  color: AppColors.navy,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Expanded(
                          child: _LedgerStat(
                            label: l.billed,
                            value: money(ledger.billed),
                          ),
                        ),
                        Expanded(
                          child: _LedgerStat(
                            label: l.paid,
                            value: money(ledger.paid),
                          ),
                        ),
                        Expanded(
                          child: _LedgerStat(
                            label: l.due,
                            value: money(ledger.outstanding),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                SectionCard(
                  title: l.contact,
                  children: [
                    Kv(l.mobile, ledger.customer.mobile),
                    Kv(l.email, ledger.customer.email),
                    Kv(l.city, ledger.customer.city),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  l.recentTrips,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                if (ledger.trips.isEmpty)
                  Text(
                    l.noTrips,
                    style: const TextStyle(color: AppColors.muted),
                  )
                else
                  ...ledger.trips
                      .take(8)
                      .map(
                        (trip) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            title: Text(
                              trip.tripNumber,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            subtitle: Text(
                              '${formatDate(trip.startDate)}  ·  ${trip.fromLocation ?? ''} → ${trip.toLocation ?? ''}',
                            ),
                            trailing: MoneyText(trip.totalFreight),
                          ),
                        ),
                      ),
                const SizedBox(height: 12),
                Text(
                  l.recentInvoices,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                if (ledger.invoices.isEmpty)
                  Text(
                    l.noInvoices,
                    style: const TextStyle(color: AppColors.muted),
                  )
                else
                  ...ledger.invoices
                      .take(8)
                      .map(
                        (invoice) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            title: Text(
                              invoice.invoiceNumber,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            subtitle: Text(formatDate(invoice.invoiceDate)),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                MoneyText(invoice.totalAmount),
                                const SizedBox(height: 4),
                                StatusChip(invoice.paymentStatus),
                              ],
                            ),
                          ),
                        ),
                      ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _LedgerStat extends StatelessWidget {
  const _LedgerStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.7),
            fontSize: 12,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w800,
            fontSize: 13,
          ),
        ),
      ],
    );
  }
}
