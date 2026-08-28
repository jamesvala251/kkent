import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../utils/formatters.dart';
import '../widgets/documents_panel.dart';
import '../widgets/forms.dart';

class DriverFormScreen extends StatefulWidget {
  const DriverFormScreen({super.key, this.driver});

  final DriverItem? driver;

  @override
  State<DriverFormScreen> createState() => _DriverFormScreenState();
}

class _DriverFormScreenState extends State<DriverFormScreen> {
  final _name = TextEditingController();
  final _mobile = TextEditingController();
  final _address = TextEditingController();
  final _license = TextEditingController();
  final _emergency = TextEditingController();
  final _monthly = TextEditingController();
  String _status = 'active';
  String _salaryType = 'monthly';
  String? _licenseExpiry;
  int? _truckId;
  List<TruckItem> _trucks = [];
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final driver = widget.driver;
    if (driver != null) {
      _name.text = driver.name;
      _mobile.text = driver.mobile ?? '';
      _address.text = driver.address ?? '';
      _license.text = driver.licenseNumber ?? '';
      _emergency.text = driver.emergencyContact ?? '';
      _monthly.text = driver.monthlySalary?.toString() ?? '';
      _status = driver.status ?? 'active';
      _salaryType = driver.salaryType ?? 'monthly';
      _licenseExpiry = dateInput(driver.licenseExpiry);
      _truckId = driver.assignedTruckId;
    }
    _loadTrucks();
  }

  Future<void> _loadTrucks() async {
    try {
      final trucks = await context.read<AuthState>().api.trucks();
      if (!mounted) return;
      setState(() => _trucks = trucks);
    } catch (_) {}
  }

  @override
  void dispose() {
    _name.dispose();
    _mobile.dispose();
    _address.dispose();
    _license.dispose();
    _emergency.dispose();
    _monthly.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l = AppLocalizations.of(context);
    if (_name.text.trim().isEmpty || _mobile.text.trim().isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l.requiredField)));
      return;
    }
    setState(() => _saving = true);
    final data = {
      'name': _name.text.trim(),
      'mobile': _mobile.text.trim(),
      'address': _address.text.trim(),
      'license_number': _license.text.trim(),
      'license_expiry': _licenseExpiry,
      'emergency_contact': _emergency.text.trim(),
      'salary_type': _salaryType,
      'monthly_salary': double.tryParse(_monthly.text.trim()) ?? 0,
      'assigned_truck_id': _truckId,
      'status': _status,
    };
    try {
      final api = context.read<AuthState>().api;
      if (widget.driver == null) {
        await api.createDriver(data);
      } else {
        await api.updateDriver(widget.driver!.id, data);
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
        title: Text(widget.driver == null ? l.addDriver : l.editDriver),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          TextField(
            controller: _name,
            decoration: InputDecoration(labelText: l.name),
          ),
          const FormGap(),
          TextField(
            controller: _mobile,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(labelText: l.mobile),
          ),
          const FormGap(),
          TextField(
            controller: _address,
            decoration: InputDecoration(labelText: l.address),
          ),
          const FormGap(),
          TextField(
            controller: _license,
            decoration: InputDecoration(labelText: l.license),
          ),
          const FormGap(),
          DatePickerTile(
            label: l.licenseExpiry,
            value: _licenseExpiry,
            onChanged: (value) => setState(() => _licenseExpiry = value),
          ),
          const FormGap(),
          InputDecorator(
            decoration: InputDecoration(labelText: l.assignedTruck),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<int?>(
                isExpanded: true,
                value: _truckId,
                hint: Text(l.truck),
                items: [
                  DropdownMenuItem<int?>(value: null, child: Text(l.none)),
                  for (final truck in _trucks)
                    DropdownMenuItem(
                      value: truck.id,
                      child: Text(truck.truckNumber),
                    ),
                ],
                onChanged: (value) => setState(() => _truckId = value),
              ),
            ),
          ),
          const FormGap(),
          StatusDropdown(
            label: l.salaryType,
            value: _salaryType,
            items: [
              ('monthly', l.salaryMonthly),
              ('per_trip', l.salaryPerTrip),
              ('both', l.salaryBoth),
            ],
            onChanged: (value) => setState(() => _salaryType = value),
          ),
          const FormGap(),
          TextField(
            controller: _monthly,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: l.monthlySalary, prefixText: '₹ '),
          ),
          const FormGap(),
          TextField(
            controller: _emergency,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(labelText: l.emergencyContact),
          ),
          const FormGap(),
          StatusDropdown(
            label: l.status,
            value: _status,
            items: [
              ('active', l.statusActive),
              ('inactive', l.statusInactive),
              ('on_leave', l.statusOnLeave),
            ],
            onChanged: (value) => setState(() => _status = value),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? l.saving : l.save),
          ),
          if (widget.driver != null) ...[
            const SizedBox(height: 16),
            DocumentsPanel(
              type: 'driver',
              entityId: widget.driver!.id,
              canEdit: context.watch<AuthState>().can('drivers.edit'),
            ),
          ],
        ],
      ),
    );
  }
}
