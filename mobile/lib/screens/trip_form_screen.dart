import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../utils/formatters.dart';
import '../widgets/forms.dart';

class TripFormScreen extends StatefulWidget {
  const TripFormScreen({super.key, this.trip});

  final TripItem? trip;

  @override
  State<TripFormScreen> createState() => _TripFormScreenState();
}

class _TripFormScreenState extends State<TripFormScreen> {
  final _from = TextEditingController();
  final _to = TextEditingController();
  final _material = TextEditingController();
  final _weight = TextEditingController();
  final _startKm = TextEditingController();
  final _endKm = TextEditingController();
  final _dieselQty = TextEditingController();
  final _dieselRate = TextEditingController();
  final _toll = TextEditingController();
  final _maintenance = TextEditingController();
  final _other = TextEditingController();
  final _driverSalary = TextEditingController();
  final _freight = TextEditingController();
  final _advance = TextEditingController();
  final _remarks = TextEditingController();

  List<CustomerItem> _customers = [];
  List<TruckItem> _trucks = [];
  List<DriverItem> _drivers = [];
  List<HitachiItem> _machines = [];
  int? _customerId;
  int? _truckId;
  int? _driverId;
  int? _hitachiId;
  String _startDate = isoDate(DateTime.now());
  bool _compressor = false;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final trip = widget.trip;
    if (trip != null) {
      _from.text = trip.fromLocation ?? '';
      _to.text = trip.toLocation ?? '';
      _material.text = trip.material ?? '';
      _weight.text = trip.weight?.toString() ?? '';
      _startKm.text = trip.startKm?.toString() ?? '';
      _endKm.text = trip.endKm?.toString() ?? '';
      _dieselQty.text = trip.dieselQty?.toString() ?? '';
      _dieselRate.text = trip.dieselRate?.toString() ?? '';
      _toll.text = trip.toll?.toString() ?? '';
      _maintenance.text = trip.maintenance?.toString() ?? '';
      _other.text = trip.otherExpense?.toString() ?? '';
      _driverSalary.text = trip.driverSalary?.toString() ?? '';
      _freight.text = trip.freight?.toString() ?? '';
      _advance.text = trip.advanceReceived?.toString() ?? '';
      _remarks.text = trip.remarks ?? '';
      _customerId = trip.customerId;
      _truckId = trip.truckId;
      _driverId = trip.driverId;
      _hitachiId = trip.hitachiId;
      _startDate = dateInput(trip.startDate).isEmpty
          ? isoDate(DateTime.now())
          : dateInput(trip.startDate);
      _compressor = trip.compressor;
    }
    _loadLookups();
  }

  Future<void> _loadLookups() async {
    try {
      final api = context.read<AuthState>().api;
      final customers = await api.customers();
      final trucks = await api.trucks();
      final drivers = await api.drivers();
      var machines = <HitachiItem>[];
      try {
        machines = await api.hitachis();
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _customers = customers;
        _trucks = trucks;
        _drivers = drivers;
        _machines = machines;
        _customerId ??= customers.isEmpty ? null : customers.first.id;
        _truckId ??= trucks.isEmpty ? null : trucks.first.id;
        _driverId ??= drivers.isEmpty ? null : drivers.first.id;
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
  void dispose() {
    _from.dispose();
    _to.dispose();
    _material.dispose();
    _weight.dispose();
    _startKm.dispose();
    _endKm.dispose();
    _dieselQty.dispose();
    _dieselRate.dispose();
    _toll.dispose();
    _maintenance.dispose();
    _other.dispose();
    _driverSalary.dispose();
    _freight.dispose();
    _advance.dispose();
    _remarks.dispose();
    super.dispose();
  }

  double? _num(TextEditingController controller) {
    final text = controller.text.trim();
    if (text.isEmpty) return null;
    return double.tryParse(text);
  }

  Future<void> _save() async {
    final l = AppLocalizations.of(context);
    final startKm = _num(_startKm) ?? 0;
    if (_customerId == null || _truckId == null || _driverId == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l.requiredField)));
      return;
    }
    setState(() => _saving = true);
    final data = <String, dynamic>{
      'customer_id': _customerId,
      'truck_id': _truckId,
      'driver_id': _driverId,
      if (_hitachiId != null) 'hitachi_id': _hitachiId,
      'start_date': _startDate,
      'end_date': null,
      'from_location': _from.text.trim(),
      'to_location': _to.text.trim(),
      'material': _material.text.trim(),
      'weight': _num(_weight) ?? 0,
      'start_km': startKm,
      'end_km': _num(_endKm) ?? 0,
      'diesel_qty': _num(_dieselQty) ?? 0,
      'diesel_rate': _num(_dieselRate) ?? 0,
      'toll': _num(_toll) ?? 0,
      'maintenance': _num(_maintenance) ?? 0,
      'other_expense': _num(_other) ?? 0,
      'driver_salary': _num(_driverSalary) ?? 0,
      'freight': _num(_freight) ?? 0,
      'advance_received': _num(_advance) ?? 0,
      'compressor': _compressor,
      'remarks': _remarks.text.trim(),
    };
    try {
      final api = context.read<AuthState>().api;
      final saved = widget.trip == null
          ? await api.createTrip(data)
          : await api.updateTrip(widget.trip!.id, data);
      if (!mounted) return;
      Navigator.pop(context, saved);
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
        title: Text(widget.trip == null ? l.addTrip : l.editTrip),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              children: [
                _IdDropdown<CustomerItem>(
                  label: l.customer,
                  value: _customerId,
                  items: _customers,
                  idOf: (item) => item.id,
                  labelOf: (item) => item.name,
                  onChanged: (value) => setState(() => _customerId = value),
                ),
                const FormGap(),
                _IdDropdown<TruckItem>(
                  label: l.truck,
                  value: _truckId,
                  items: _trucks,
                  idOf: (item) => item.id,
                  labelOf: (item) => item.truckNumber,
                  onChanged: (value) => setState(() => _truckId = value),
                ),
                const FormGap(),
                _IdDropdown<DriverItem>(
                  label: l.driver,
                  value: _driverId,
                  items: _drivers,
                  idOf: (item) => item.id,
                  labelOf: (item) => item.name,
                  onChanged: (value) => setState(() => _driverId = value),
                ),
                if (_machines.isNotEmpty) ...[
                  const FormGap(),
                  _IdDropdown<HitachiItem>(
                    label: l.hitachi,
                    value: _hitachiId,
                    items: _machines,
                    idOf: (item) => item.id,
                    labelOf: (item) => item.machineNumber,
                    nullable: true,
                    noneLabel: l.none,
                    onChanged: (value) => setState(() => _hitachiId = value),
                  ),
                ],
                const FormGap(),
                DatePickerTile(
                  label: l.date,
                  value: _startDate,
                  optional: false,
                  onChanged: (value) =>
                      setState(() => _startDate = value ?? _startDate),
                ),
                const FormGap(),
                TextField(
                  controller: _from,
                  decoration: InputDecoration(labelText: l.from),
                ),
                const FormGap(),
                TextField(
                  controller: _to,
                  decoration: InputDecoration(labelText: l.to),
                ),
                const FormGap(),
                TextField(
                  controller: _material,
                  decoration: InputDecoration(labelText: l.material),
                ),
                const FormGap(),
                TextField(
                  controller: _weight,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(labelText: l.weight),
                ),
                const FormGap(),
                TextField(
                  controller: _startKm,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(labelText: l.startKm),
                ),
                const FormGap(),
                TextField(
                  controller: _endKm,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(labelText: l.endKm),
                ),
                const FormGap(),
                TextField(
                  controller: _dieselQty,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(labelText: l.dieselQty),
                ),
                const FormGap(),
                TextField(
                  controller: _dieselRate,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(
                    labelText: l.dieselRate,
                    prefixText: '₹ ',
                  ),
                ),
                const FormGap(),
                TextField(
                  controller: _toll,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(
                    labelText: l.toll,
                    prefixText: '₹ ',
                  ),
                ),
                const FormGap(),
                TextField(
                  controller: _maintenance,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(
                    labelText: l.maintenance,
                    prefixText: '₹ ',
                  ),
                ),
                const FormGap(),
                TextField(
                  controller: _other,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(
                    labelText: l.otherExpense,
                    prefixText: '₹ ',
                  ),
                ),
                const FormGap(),
                TextField(
                  controller: _driverSalary,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(
                    labelText: l.driverSalary,
                    prefixText: '₹ ',
                  ),
                ),
                const FormGap(),
                TextField(
                  controller: _freight,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(
                    labelText: l.freightRate,
                    prefixText: '₹ ',
                  ),
                ),
                const FormGap(),
                TextField(
                  controller: _advance,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(
                    labelText: l.advanceReceived,
                    prefixText: '₹ ',
                  ),
                ),
                const FormGap(),
                SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(l.compressor),
                  value: _compressor,
                  onChanged: (value) => setState(() => _compressor = value),
                ),
                const FormGap(),
                TextField(
                  controller: _remarks,
                  maxLines: 3,
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

class _IdDropdown<T> extends StatelessWidget {
  const _IdDropdown({
    required this.label,
    required this.value,
    required this.items,
    required this.idOf,
    required this.labelOf,
    required this.onChanged,
    this.nullable = false,
    this.noneLabel,
  });

  final String label;
  final int? value;
  final List<T> items;
  final int Function(T item) idOf;
  final String Function(T item) labelOf;
  final ValueChanged<int?> onChanged;
  final bool nullable;
  final String? noneLabel;

  @override
  Widget build(BuildContext context) {
    final ids = items.map(idOf).toSet();
    final current = value != null && ids.contains(value) ? value : null;
    return InputDecorator(
      decoration: InputDecoration(labelText: label),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<int?>(
          isExpanded: true,
          value: current,
          hint: Text(label),
          items: [
            if (nullable)
              DropdownMenuItem<int?>(
                value: null,
                child: Text(noneLabel ?? '—'),
              ),
            for (final item in items)
              DropdownMenuItem<int?>(
                value: idOf(item),
                child: Text(labelOf(item)),
              ),
          ],
          onChanged: onChanged,
        ),
      ),
    );
  }
}
