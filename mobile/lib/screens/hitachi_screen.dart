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

class HitachiScreen extends StatefulWidget {
  const HitachiScreen({super.key});

  @override
  State<HitachiScreen> createState() => _HitachiScreenState();
}

class _HitachiScreenState extends State<HitachiScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<HitachiItem> _machines = [];
  List<HitachiRentalItem> _rentals = [];
  Object? _page;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _error = null;
    });
    try {
      final api = context.read<AuthState>().api;
      final machines = await api.hitachis();
      final rentals = await api.hitachiRentals();
      if (!mounted) return;
      setState(() {
        _machines = machines;
        _rentals = rentals;
        _page = true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _page = _page ?? null;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final auth = context.watch<AuthState>();
    return Scaffold(
      appBar: AppBar(
        title: Text(l.hitachi),
        bottom: TabBar(
          controller: _tabs,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: [
            Tab(text: l.machines),
            Tab(text: l.rentals),
          ],
        ),
      ),
      floatingActionButton: auth.can('hitachi.create')
          ? FloatingActionButton(
              heroTag: 'fab-hitachi',
              onPressed: () async {
                final machine = _tabs.index == 0;
                final ok = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(
                    builder: (_) => machine
                        ? const HitachiFormScreen()
                        : HitachiRentalFormScreen(machines: _machines),
                  ),
                );
                if (ok == true) _load();
              },
              child: const Icon(Icons.add),
            )
          : null,
      body: AsyncBody(
        loading: _page == null && _error == null,
        error: _error,
        data: _error != null ? null : _page,
        onRetry: _load,
        builder: (_) => TabBarView(
          controller: _tabs,
          children: [
            RefreshIndicator(
              onRefresh: _load,
              child: _machines.isEmpty
                  ? ListView(
                      children: [
                        EmptyState(
                          icon: Icons.precision_manufacturing_outlined,
                          title: l.noMachines,
                          message: l.tryAnotherSearch,
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.only(top: 8, bottom: 88),
                      itemCount: _machines.length,
                      itemBuilder: (context, index) {
                        final row = _machines[index];
                        return ListCard(
                          onTap: () async {
                            final ok = await Navigator.of(context).push<bool>(
                              MaterialPageRoute(
                                builder: (_) => HitachiFormScreen(machine: row),
                              ),
                            );
                            if (ok == true) _load();
                          },
                          child: ListTile(
                            title: Text(
                              row.machineNumber,
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                            subtitle: Text(
                              [
                                row.model,
                                row.registrationNumber,
                              ].whereType<String>().join(' · '),
                            ),
                            trailing: row.status == null
                                ? null
                                : StatusChip(row.status!),
                          ),
                        );
                      },
                    ),
            ),
            RefreshIndicator(
              onRefresh: _load,
              child: _rentals.isEmpty
                  ? ListView(
                      children: [
                        EmptyState(
                          icon: Icons.handshake_outlined,
                          title: l.noRentals,
                          message: l.tryAnotherSearch,
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.only(top: 8, bottom: 88),
                      itemCount: _rentals.length,
                      itemBuilder: (context, index) {
                        final row = _rentals[index];
                        return ListCard(
                          onTap: () async {
                            final ok = await Navigator.of(context).push<bool>(
                              MaterialPageRoute(
                                builder: (_) => HitachiRentalFormScreen(
                                  machines: _machines,
                                  rental: row,
                                ),
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
                                        row.rentalNumber,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        '${row.machineNumber ?? '—'}  ·  ${row.customerName ?? '—'}',
                                        style: const TextStyle(
                                          color: AppColors.muted,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    MoneyText(row.totalAmount),
                                    if (row.status != null)
                                      StatusChip(row.status!),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class HitachiFormScreen extends StatefulWidget {
  const HitachiFormScreen({super.key, this.machine});

  final HitachiItem? machine;

  @override
  State<HitachiFormScreen> createState() => _HitachiFormScreenState();
}

class _HitachiFormScreenState extends State<HitachiFormScreen> {
  final _number = TextEditingController();
  final _reg = TextEditingController();
  final _model = TextEditingController();
  final _owner = TextEditingController();
  final _hourly = TextEditingController();
  final _daily = TextEditingController();
  final _monthly = TextEditingController();
  String _status = 'active';
  String _fuel = 'diesel';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final machine = widget.machine;
    if (machine != null) {
      _number.text = machine.machineNumber;
      _reg.text = machine.registrationNumber ?? '';
      _model.text = machine.model ?? '';
      _owner.text = machine.owner ?? '';
      _hourly.text = machine.hourlyRate?.toString() ?? '';
      _daily.text = machine.dailyRate?.toString() ?? '';
      _monthly.text = machine.monthlyRate?.toString() ?? '';
      _status = machine.status ?? 'active';
      _fuel = machine.fuelType ?? 'diesel';
    }
  }

  @override
  void dispose() {
    _number.dispose();
    _reg.dispose();
    _model.dispose();
    _owner.dispose();
    _hourly.dispose();
    _daily.dispose();
    _monthly.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l = AppLocalizations.of(context);
    if (_number.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l.requiredField)));
      return;
    }
    setState(() => _saving = true);
    final data = {
      'machine_number': _number.text.trim(),
      'registration_number': _reg.text.trim(),
      'model': _model.text.trim(),
      'owner': _owner.text.trim(),
      'fuel_type': _fuel,
      'hourly_rate': double.tryParse(_hourly.text.trim()) ?? 0,
      'daily_rate': double.tryParse(_daily.text.trim()) ?? 0,
      'monthly_rate': double.tryParse(_monthly.text.trim()) ?? 0,
      'status': _status,
    };
    try {
      final api = context.read<AuthState>().api;
      if (widget.machine == null) {
        await api.createHitachi(data);
      } else {
        await api.updateHitachi(widget.machine!.id, data);
      }
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final auth = context.watch<AuthState>();
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.machine == null ? l.addMachine : l.editMachine),
        actions: [
          if (widget.machine != null && auth.can('hitachi.delete'))
            IconButton(
              onPressed: () async {
                if (!await confirmDelete(context)) return;
                try {
                  await context.read<AuthState>().api.deleteHitachi(
                    widget.machine!.id,
                  );
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
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          TextField(
            controller: _number,
            decoration: InputDecoration(labelText: l.machineNumber),
          ),
          const FormGap(),
          TextField(
            controller: _reg,
            decoration: InputDecoration(labelText: l.registration),
          ),
          const FormGap(),
          TextField(
            controller: _model,
            decoration: InputDecoration(labelText: l.model),
          ),
          const FormGap(),
          TextField(
            controller: _owner,
            decoration: InputDecoration(labelText: l.owner),
          ),
          const FormGap(),
          StatusDropdown(
            label: l.fuel,
            value: _fuel,
            items: const [
              ('diesel', 'Diesel'),
              ('petrol', 'Petrol'),
              ('cng', 'CNG'),
              ('electric', 'Electric'),
            ],
            onChanged: (value) => setState(() => _fuel = value),
          ),
          const FormGap(),
          TextField(
            controller: _hourly,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: l.hourlyRate, prefixText: '₹ '),
          ),
          const FormGap(),
          TextField(
            controller: _daily,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: l.dailyRate, prefixText: '₹ '),
          ),
          const FormGap(),
          TextField(
            controller: _monthly,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: l.monthlyRate, prefixText: '₹ '),
          ),
          const FormGap(),
          StatusDropdown(
            label: l.status,
            value: _status,
            items: [
              ('active', l.statusActive),
              ('inactive', l.statusInactive),
              ('maintenance', l.statusMaintenance),
              ('breakdown', l.statusBreakdown),
            ],
            onChanged: (value) => setState(() => _status = value),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? l.saving : l.save),
          ),
          if (widget.machine != null) ...[
            const SizedBox(height: 16),
            DocumentsPanel(
              type: 'hitachi',
              entityId: widget.machine!.id,
              canEdit: auth.can('hitachi.edit'),
            ),
          ],
        ],
      ),
    );
  }
}

class HitachiRentalFormScreen extends StatefulWidget {
  const HitachiRentalFormScreen({
    super.key,
    required this.machines,
    this.rental,
  });

  final List<HitachiItem> machines;
  final HitachiRentalItem? rental;

  @override
  State<HitachiRentalFormScreen> createState() => _HitachiRentalFormScreenState();
}

class _HitachiRentalFormScreenState extends State<HitachiRentalFormScreen> {
  List<CustomerItem> _customers = [];
  int? _hitachiId;
  int? _customerId;
  String _billing = 'daily';
  String _status = 'booked';
  String _start = isoDate(DateTime.now());
  String? _end;
  final _site = TextEditingController();
  final _operator = TextEditingController();
  final _qty = TextEditingController();
  final _advance = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final rental = widget.rental;
    _hitachiId = rental?.hitachiId ??
        (widget.machines.isEmpty ? null : widget.machines.first.id);
    _customerId = rental?.customerId;
    if (rental != null) {
      _billing = rental.billingType;
      _status = rental.status ?? 'booked';
      _start = dateInput(rental.startDate);
      _end = dateInput(rental.endDate);
      _site.text = rental.siteLocation ?? '';
      _operator.text = rental.operatorName ?? '';
      _qty.text = (rental.days ?? rental.hours ?? rental.months)?.toString() ?? '';
      _advance.text = rental.advanceReceived?.toString() ?? '';
    }
    _loadCustomers();
  }

  Future<void> _loadCustomers() async {
    try {
      final rows = await context.read<AuthState>().api.customers();
      if (!mounted) return;
      setState(() {
        _customers = rows;
        _customerId ??= rows.isEmpty ? null : rows.first.id;
      });
    } catch (_) {}
  }

  @override
  void dispose() {
    _site.dispose();
    _operator.dispose();
    _qty.dispose();
    _advance.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l = AppLocalizations.of(context);
    if (_hitachiId == null || _customerId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l.requiredField)));
      return;
    }
    setState(() => _saving = true);
    final qty = double.tryParse(_qty.text.trim()) ?? 0;
    final data = {
      'hitachi_id': _hitachiId,
      'customer_id': _customerId,
      'billing_type': _billing,
      'start_date': _start,
      'end_date': _end,
      'site_location': _site.text.trim(),
      'operator_name': _operator.text.trim(),
      'status': _status,
      'advance_received': double.tryParse(_advance.text.trim()) ?? 0,
      if (_billing == 'hourly') 'hours': qty,
      if (_billing == 'daily') 'days': qty,
      if (_billing == 'monthly') 'months': qty,
    };
    try {
      final api = context.read<AuthState>().api;
      if (widget.rental == null) {
        await api.createHitachiRental(data);
      } else {
        await api.updateHitachiRental(widget.rental!.id, data);
      }
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.rental == null ? l.addRental : l.editRental),
        actions: [
          if (widget.rental != null &&
              context.watch<AuthState>().can('hitachi.delete'))
            IconButton(
              onPressed: () async {
                if (!await confirmDelete(context)) return;
                try {
                  await context.read<AuthState>().api.deleteHitachiRental(
                    widget.rental!.id,
                  );
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
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          InputDecorator(
            decoration: InputDecoration(labelText: l.machineNumber),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                isExpanded: true,
                value: _hitachiId,
                items: [
                  for (final machine in widget.machines)
                    DropdownMenuItem(
                      value: machine.id,
                      child: Text(machine.machineNumber),
                    ),
                ],
                onChanged: (value) => setState(() => _hitachiId = value),
              ),
            ),
          ),
          const FormGap(),
          InputDecorator(
            decoration: InputDecoration(labelText: l.customer),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                isExpanded: true,
                value: _customerId,
                items: [
                  for (final customer in _customers)
                    DropdownMenuItem(
                      value: customer.id,
                      child: Text(customer.name),
                    ),
                ],
                onChanged: (value) => setState(() => _customerId = value),
              ),
            ),
          ),
          const FormGap(),
          StatusDropdown(
            label: l.billingType,
            value: _billing,
            items: [
              ('hourly', l.hourly),
              ('daily', l.daily),
              ('monthly', l.billingMonthly),
            ],
            onChanged: (value) => setState(() => _billing = value),
          ),
          const FormGap(),
          TextField(
            controller: _qty,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: _billing == 'hourly'
                  ? l.hours
                  : _billing == 'monthly'
                  ? l.months
                  : l.days,
            ),
          ),
          const FormGap(),
          DatePickerTile(
            label: l.startDate,
            value: _start,
            optional: false,
            onChanged: (value) => setState(() => _start = value ?? _start),
          ),
          const FormGap(),
          DatePickerTile(
            label: l.endDate,
            value: _end,
            onChanged: (value) => setState(() => _end = value),
          ),
          const FormGap(),
          TextField(
            controller: _site,
            decoration: InputDecoration(labelText: l.site),
          ),
          const FormGap(),
          TextField(
            controller: _operator,
            decoration: InputDecoration(labelText: l.operator),
          ),
          const FormGap(),
          TextField(
            controller: _advance,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: l.advance, prefixText: '₹ '),
          ),
          const FormGap(),
          StatusDropdown(
            label: l.status,
            value: _status,
            items: [
              ('booked', l.statusBooked),
              ('running', l.statusRunning),
              ('completed', l.statusCompleted),
              ('cancelled', l.statusCancelled),
            ],
            onChanged: (value) => setState(() => _status = value),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? l.saving : l.save),
          ),
        ],
      ),
    );
  }
}
