import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/ui.dart';

class DieselScreen extends StatefulWidget {
  const DieselScreen({super.key});

  @override
  State<DieselScreen> createState() => _DieselScreenState();
}

class _DieselScreenState extends State<DieselScreen> {
  DieselSummary? _summary;
  List<DieselPurchaseItem> _purchases = [];
  List<DieselIssueItem> _issues = [];
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
      final api = context.read<AuthState>().api;
      final summary = await api.dieselSummary();
      final purchases = await api.dieselPurchases();
      final issues = await api.dieselIssues();
      if (!mounted) return;
      setState(() {
        _summary = summary;
        _purchases = purchases;
        _issues = issues;
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
    final canCreate = context.watch<AuthState>().can('diesel.create');
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.diesel)),
      floatingActionButton: canCreate
          ? FloatingActionButton.extended(
              onPressed: () async {
                final added = await showModalBottomSheet<bool>(
                  context: context,
                  showDragHandle: true,
                  builder: (_) => const _DieselActionsSheet(),
                );
                if (added == true) _load();
              },
              icon: const Icon(Icons.add),
              label: Text(l.add),
            )
          : null,
      body: AsyncBody<DieselSummary>(
        loading: _loading,
        error: _error,
        data: _summary,
        onRetry: _load,
        builder: (summary) {
          return RefreshIndicator(
            onRefresh: _load,
            child: ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              children: [
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 1.25,
                  children: [
                    StatTile(
                      label: l.stockLitres,
                      value: summary.stockBalance.toStringAsFixed(1),
                      icon: Icons.local_gas_station,
                      color: AppColors.navy,
                    ),
                    StatTile(
                      label: l.issuedLitres,
                      value: summary.totalOut.toStringAsFixed(1),
                      icon: Icons.outbox_outlined,
                      color: AppColors.warning,
                    ),
                    StatTile(
                      label: l.purchasedLitres,
                      value: summary.totalIn.toStringAsFixed(1),
                      icon: Icons.inventory_2_outlined,
                      color: AppColors.info,
                    ),
                    StatTile(
                      label: l.spend,
                      value: money(summary.totalExpense),
                      icon: Icons.payments_outlined,
                      color: AppColors.indigo,
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                Text(
                  l.recentPurchases,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                if (_purchases.isEmpty)
                  Text(
                    l.noPurchasesYet,
                    style: const TextStyle(color: AppColors.muted),
                  ),
                for (final row in _purchases.take(8))
                  Card(
                    child: ListTile(
                      title: Text(
                        '${row.quantity.toStringAsFixed(1)} L  ·  ${money(row.totalAmount)}',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        '${formatDate(row.purchaseDate)}  ·  ${row.supplier ?? l.supplier}',
                      ),
                      trailing: Text(
                        l.litresLeft(row.remainingQuantity.toStringAsFixed(1)),
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                  ),
                const SizedBox(height: 18),
                Text(
                  l.recentIssues,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                if (_issues.isEmpty)
                  Text(
                    l.noIssuesYet,
                    style: const TextStyle(color: AppColors.muted),
                  ),
                for (final row in _issues.take(8))
                  Card(
                    child: ListTile(
                      title: Text(
                        '${row.quantity.toStringAsFixed(1)} L  ·  ${row.truckNumber ?? l.truck}',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(formatDate(row.issueDate)),
                      trailing: MoneyText(row.totalAmount),
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

class _DieselActionsSheet extends StatelessWidget {
  const _DieselActionsSheet();

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.add_shopping_cart_outlined),
            title: Text(l.recordPurchase),
            onTap: () async {
              final ok = await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const DieselPurchaseForm()),
              );
              if (context.mounted) Navigator.pop(context, ok == true);
            },
          ),
          ListTile(
            leading: const Icon(Icons.local_shipping_outlined),
            title: Text(l.issueToTruck),
            onTap: () async {
              final ok = await Navigator.of(context).push<bool>(
                MaterialPageRoute(builder: (_) => const DieselIssueForm()),
              );
              if (context.mounted) Navigator.pop(context, ok == true);
            },
          ),
        ],
      ),
    );
  }
}

class DieselPurchaseForm extends StatefulWidget {
  const DieselPurchaseForm({super.key});

  @override
  State<DieselPurchaseForm> createState() => _DieselPurchaseFormState();
}

class _DieselPurchaseFormState extends State<DieselPurchaseForm> {
  final _qty = TextEditingController();
  final _rate = TextEditingController();
  final _supplier = TextEditingController();
  final _bill = TextEditingController();
  DateTime _date = DateTime.now();
  bool _saving = false;

  @override
  void dispose() {
    _qty.dispose();
    _rate.dispose();
    _supplier.dispose();
    _bill.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final qty = double.tryParse(_qty.text.trim());
    final rate = double.tryParse(_rate.text.trim());
    if (qty == null || rate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).qtyRateRequired)),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await context.read<AuthState>().api.createDieselPurchase(
        date: _date.toIso8601String().split('T').first,
        quantity: qty,
        ratePerLiter: rate,
        supplier: _supplier.text.trim(),
        billNumber: _bill.text.trim(),
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.dieselPurchase)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          Card(
            child: ListTile(
              title: Text(
                l.date,
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
              subtitle: Text(formatDate(_date.toIso8601String())),
              trailing: const Icon(Icons.calendar_today_outlined),
              onTap: () async {
                final picked = await showDatePicker(
                  context: context,
                  initialDate: _date,
                  firstDate: DateTime(2020),
                  lastDate: DateTime.now().add(const Duration(days: 1)),
                );
                if (picked != null) setState(() => _date = picked);
              },
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _qty,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: l.quantityLitres),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _rate,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: l.ratePerLitre,
              prefixText: '₹ ',
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _supplier,
            decoration: InputDecoration(labelText: l.supplierOptional),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _bill,
            decoration: InputDecoration(labelText: l.billNumberOptional),
          ),
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? l.saving : l.savePurchase),
          ),
        ],
      ),
    );
  }
}

class DieselIssueForm extends StatefulWidget {
  const DieselIssueForm({super.key});

  @override
  State<DieselIssueForm> createState() => _DieselIssueFormState();
}

class _DieselIssueFormState extends State<DieselIssueForm> {
  final _qty = TextEditingController();
  final _notes = TextEditingController();
  DateTime _date = DateTime.now();
  List<TruckItem> _trucks = [];
  int? _truckId;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTrucks();
  }

  @override
  void dispose() {
    _qty.dispose();
    _notes.dispose();
    super.dispose();
  }

  Future<void> _loadTrucks() async {
    try {
      final trucks = await context.read<AuthState>().api.trucks();
      if (!mounted) return;
      setState(() {
        _trucks = trucks;
        _truckId = trucks.isEmpty ? null : trucks.first.id;
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

  Future<void> _save() async {
    final qty = double.tryParse(_qty.text.trim());
    if (_truckId == null || qty == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppLocalizations.of(context).truckQtyRequired)),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await context.read<AuthState>().api.createDieselIssue(
        date: _date.toIso8601String().split('T').first,
        quantity: qty,
        truckId: _truckId!,
        notes: _notes.text.trim(),
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.issueDiesel)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              children: [
                Card(
                  child: ListTile(
                    title: Text(
                      l.date,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: Text(formatDate(_date.toIso8601String())),
                    trailing: const Icon(Icons.calendar_today_outlined),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _date,
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now().add(const Duration(days: 1)),
                      );
                      if (picked != null) setState(() => _date = picked);
                    },
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<int>(
                        isExpanded: true,
                        value: _truckId,
                        hint: Text(l.truck),
                        items: _trucks
                            .map(
                              (truck) => DropdownMenuItem(
                                value: truck.id,
                                child: Text(truck.truckNumber),
                              ),
                            )
                            .toList(),
                        onChanged: (value) => setState(() => _truckId = value),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _qty,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(labelText: l.quantityLitres),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _notes,
                  decoration: InputDecoration(labelText: l.notesOptional),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _saving ? null : _save,
                  child: Text(_saving ? l.saving : l.issueDiesel),
                ),
              ],
            ),
    );
  }
}
