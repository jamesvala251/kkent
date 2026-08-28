import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/forms.dart';
import '../widgets/ui.dart';

class SalaryScreen extends StatefulWidget {
  const SalaryScreen({super.key});

  @override
  State<SalaryScreen> createState() => _SalaryScreenState();
}

class _SalaryScreenState extends State<SalaryScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;
  List<DriverItem> _drivers = [];
  List<SalaryAdvanceItem> _advances = [];
  List<SalaryItem> _salaries = [];
  List<SalaryReconRow> _recon = [];
  bool _loading = true;
  String? _error;
  String _month = isoDate(DateTime.now()).substring(0, 7);
  int _tabIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _tabs.addListener(() {
      if (_tabIndex != _tabs.index) {
        setState(() => _tabIndex = _tabs.index);
      }
    });
    _load();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final api = context.read<AuthState>().api;
      final drivers = await api.drivers();
      final advances = await api.salaryAdvances();
      final salaries = await api.salaries();
      final recon = await api.salaryReconcile(_month);
      if (!mounted) return;
      setState(() {
        _drivers = drivers;
        _advances = advances;
        _salaries = salaries;
        _recon = recon;
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
    final canCreate = context.watch<AuthState>().can('salaries.create');
    return Scaffold(
      appBar: AppBar(
        title: Text(l.salary),
        bottom: TabBar(
          controller: _tabs,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          tabs: [
            Tab(text: l.advances),
            Tab(text: l.monthlyPay),
            Tab(text: l.thisMonth),
          ],
        ),
      ),
      floatingActionButton: canCreate
          ? FloatingActionButton(
              heroTag: 'fab-salary',
              onPressed: () async {
                final advance = _tabs.index != 1;
                final ok = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(
                    builder: (_) => advance
                        ? SalaryAdvanceForm(drivers: _drivers)
                        : SalaryPayForm(drivers: _drivers),
                  ),
                );
                if (ok == true) _load();
              },
              child: const Icon(Icons.add),
            )
          : null,
      body: AsyncBody(
        loading: _loading,
        error: _error,
        data: true,
        onRetry: _load,
        builder: (_) => TabBarView(
          controller: _tabs,
          children: [
            RefreshIndicator(
              onRefresh: _load,
              child: _advances.isEmpty
                  ? ListView(
                      children: [
                        EmptyState(
                          icon: Icons.payments_outlined,
                          title: l.noAdvances,
                          message: l.addAdvanceHint,
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.only(top: 8, bottom: 88),
                      itemCount: _advances.length,
                      itemBuilder: (context, index) {
                        final row = _advances[index];
                        return ListCard(
                          onTap: canCreate
                              ? () async {
                                  if (!await confirmDelete(context)) return;
                                  try {
                                    await context
                                        .read<AuthState>()
                                        .api
                                        .deleteSalaryAdvance(row.id);
                                    _load();
                                  } catch (e) {
                                    if (context.mounted) showError(context, e);
                                  }
                                }
                              : null,
                          child: ListTile(
                            title: Text(
                              row.driverName ?? l.driver,
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                            subtitle: Text(
                              '${formatDate(row.advanceDate)}  ·  ${row.remarks ?? ''}',
                            ),
                            trailing: MoneyText(row.amount),
                          ),
                        );
                      },
                    ),
            ),
            RefreshIndicator(
              onRefresh: _load,
              child: _salaries.isEmpty
                  ? ListView(
                      children: [
                        EmptyState(
                          icon: Icons.account_balance_wallet_outlined,
                          title: l.noSalaries,
                          message: l.addSalaryHint,
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.only(top: 8, bottom: 88),
                      itemCount: _salaries.length,
                      itemBuilder: (context, index) {
                        final row = _salaries[index];
                        return ListCard(
                          child: ListTile(
                            title: Text(
                              row.driverName ?? l.driver,
                              style: const TextStyle(fontWeight: FontWeight.w800),
                            ),
                            subtitle: Text(
                              '${row.month}/${row.year}  ·  ${row.salaryType ?? ''}',
                            ),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                MoneyText(row.netAmount),
                                StatusChip(row.paymentStatus),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
                children: [
                  Text(l.reconcileMonth, style: const TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Text(_month, style: const TextStyle(color: AppColors.muted)),
                  const SizedBox(height: 12),
                  for (final row in _recon)
                    Card(
                      child: ListTile(
                        title: Text(
                          row.driverName,
                          style: const TextStyle(fontWeight: FontWeight.w800),
                        ),
                        subtitle: Text(
                          '${l.advanced}: ${money(row.advanced)}  ·  ${l.remaining}: ${money(row.remaining)}',
                        ),
                        trailing: MoneyText(row.totalSalary),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class SalaryAdvanceForm extends StatefulWidget {
  const SalaryAdvanceForm({super.key, required this.drivers});

  final List<DriverItem> drivers;

  @override
  State<SalaryAdvanceForm> createState() => _SalaryAdvanceFormState();
}

class _SalaryAdvanceFormState extends State<SalaryAdvanceForm> {
  int? _driverId;
  String _date = isoDate(DateTime.now());
  final _amount = TextEditingController();
  final _remarks = TextEditingController();
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _driverId = widget.drivers.isEmpty ? null : widget.drivers.first.id;
  }

  @override
  void dispose() {
    _amount.dispose();
    _remarks.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l = AppLocalizations.of(context);
    final amount = double.tryParse(_amount.text.trim());
    if (_driverId == null || amount == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l.requiredField)));
      return;
    }
    setState(() => _saving = true);
    try {
      await context.read<AuthState>().api.createSalaryAdvance({
        'driver_id': _driverId,
        'advance_date': _date,
        'amount': amount,
        'remarks': _remarks.text.trim(),
      });
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
      appBar: AppBar(title: Text(l.addAdvance)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          InputDecorator(
            decoration: InputDecoration(labelText: l.driver),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                isExpanded: true,
                value: _driverId,
                items: [
                  for (final driver in widget.drivers)
                    DropdownMenuItem(value: driver.id, child: Text(driver.name)),
                ],
                onChanged: (value) => setState(() => _driverId = value),
              ),
            ),
          ),
          const FormGap(),
          DatePickerTile(
            label: l.date,
            value: _date,
            optional: false,
            onChanged: (value) => setState(() => _date = value ?? _date),
          ),
          const FormGap(),
          TextField(
            controller: _amount,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: l.amount, prefixText: '₹ '),
          ),
          const FormGap(),
          TextField(
            controller: _remarks,
            decoration: InputDecoration(labelText: l.notesOptional),
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

class SalaryPayForm extends StatefulWidget {
  const SalaryPayForm({super.key, required this.drivers});

  final List<DriverItem> drivers;

  @override
  State<SalaryPayForm> createState() => _SalaryPayFormState();
}

class _SalaryPayFormState extends State<SalaryPayForm> {
  int? _driverId;
  int _month = DateTime.now().month;
  int _year = DateTime.now().year;
  final _base = TextEditingController();
  final _advance = TextEditingController();
  String _status = 'pending';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _driverId = widget.drivers.isEmpty ? null : widget.drivers.first.id;
    _fillBase();
  }

  void _fillBase() {
    final driver = widget.drivers.where((item) => item.id == _driverId);
    if (driver.isEmpty) return;
    _base.text = driver.first.monthlySalary?.toString() ?? '';
  }

  @override
  void dispose() {
    _base.dispose();
    _advance.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l = AppLocalizations.of(context);
    if (_driverId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l.requiredField)));
      return;
    }
    setState(() => _saving = true);
    try {
      await context.read<AuthState>().api.createSalary({
        'driver_id': _driverId,
        'month': _month,
        'year': _year,
        'salary_type': 'monthly',
        'base_amount': double.tryParse(_base.text.trim()) ?? 0,
        'advance_deduction': double.tryParse(_advance.text.trim()) ?? 0,
        'payment_status': _status,
        if (_status == 'paid') 'paid_date': isoDate(DateTime.now()),
      });
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
      appBar: AppBar(title: Text(l.addSalary)),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          InputDecorator(
            decoration: InputDecoration(labelText: l.driver),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int>(
                isExpanded: true,
                value: _driverId,
                items: [
                  for (final driver in widget.drivers)
                    DropdownMenuItem(value: driver.id, child: Text(driver.name)),
                ],
                onChanged: (value) {
                  setState(() {
                    _driverId = value;
                    _fillBase();
                  });
                },
              ),
            ),
          ),
          const FormGap(),
          StatusDropdown(
            label: l.month,
            value: '$_month',
            items: [
              for (var i = 1; i <= 12; i++) ('$i', '$i'),
            ],
            onChanged: (value) => setState(() => _month = int.parse(value)),
          ),
          const FormGap(),
          TextField(
            controller: TextEditingController(text: '$_year'),
            keyboardType: TextInputType.number,
            decoration: InputDecoration(labelText: l.year),
            onChanged: (value) => _year = int.tryParse(value) ?? _year,
          ),
          const FormGap(),
          TextField(
            controller: _base,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: l.baseAmount, prefixText: '₹ '),
          ),
          const FormGap(),
          TextField(
            controller: _advance,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(
              labelText: l.advanceDeduction,
              prefixText: '₹ ',
            ),
          ),
          const FormGap(),
          StatusDropdown(
            label: l.status,
            value: _status,
            items: [
              ('pending', l.statusPending),
              ('partial', l.statusPartial),
              ('paid', l.statusPaid),
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
