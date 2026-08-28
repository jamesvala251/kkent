import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../utils/formatters.dart';
import '../widgets/documents_panel.dart';
import '../widgets/forms.dart';

class TruckFormScreen extends StatefulWidget {
  const TruckFormScreen({super.key, this.truck});

  final TruckItem? truck;

  @override
  State<TruckFormScreen> createState() => _TruckFormScreenState();
}

class _TruckFormScreenState extends State<TruckFormScreen> {
  final _number = TextEditingController();
  final _rc = TextEditingController();
  final _brand = TextEditingController();
  final _model = TextEditingController();
  final _capacity = TextEditingController();
  final _owner = TextEditingController();
  final _km = TextEditingController();
  String _fuel = 'diesel';
  String _status = 'active';
  String? _insurance;
  String? _fitness;
  String? _permit;
  String? _puc;
  String? _tax;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final truck = widget.truck;
    if (truck != null) {
      _number.text = truck.truckNumber;
      _rc.text = truck.rcNumber ?? '';
      _brand.text = truck.brand ?? '';
      _model.text = truck.model ?? '';
      _capacity.text = truck.capacity ?? '';
      _owner.text = truck.owner ?? '';
      _km.text = truck.currentKm?.toString() ?? '';
      _fuel = truck.fuelType ?? 'diesel';
      _status = truck.status ?? 'active';
      _insurance = dateInput(truck.insuranceExpiry);
      _fitness = dateInput(truck.fitnessExpiry);
      _permit = dateInput(truck.permitExpiry);
      _puc = dateInput(truck.pucExpiry);
      _tax = dateInput(truck.taxExpiry);
    }
  }

  @override
  void dispose() {
    _number.dispose();
    _rc.dispose();
    _brand.dispose();
    _model.dispose();
    _capacity.dispose();
    _owner.dispose();
    _km.dispose();
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
      'truck_number': _number.text.trim(),
      'rc_number': _rc.text.trim(),
      'brand': _brand.text.trim(),
      'model': _model.text.trim(),
      'capacity': _capacity.text.trim(),
      'owner': _owner.text.trim(),
      'fuel_type': _fuel,
      'current_km': double.tryParse(_km.text.trim()) ?? 0,
      'status': _status,
      'insurance_expiry': _insurance,
      'fitness_expiry': _fitness,
      'permit_expiry': _permit,
      'puc_expiry': _puc,
      'tax_expiry': _tax,
    };
    try {
      final api = context.read<AuthState>().api;
      if (widget.truck == null) {
        await api.createTruck(data);
      } else {
        await api.updateTruck(widget.truck!.id, data);
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
        title: Text(widget.truck == null ? l.addTruck : l.editTruck),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
        children: [
          TextField(
            controller: _number,
            decoration: InputDecoration(labelText: l.truckNumber),
          ),
          const FormGap(),
          TextField(
            controller: _rc,
            decoration: InputDecoration(labelText: l.rcNumber),
          ),
          const FormGap(),
          TextField(
            controller: _brand,
            decoration: InputDecoration(labelText: l.brand),
          ),
          const FormGap(),
          TextField(
            controller: _model,
            decoration: InputDecoration(labelText: l.model),
          ),
          const FormGap(),
          TextField(
            controller: _capacity,
            decoration: InputDecoration(labelText: l.capacity),
          ),
          const FormGap(),
          TextField(
            controller: _owner,
            decoration: InputDecoration(labelText: l.owner),
          ),
          const FormGap(),
          TextField(
            controller: _km,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: InputDecoration(labelText: l.km),
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
          const FormGap(),
          DatePickerTile(
            label: l.insurance,
            value: _insurance,
            onChanged: (value) => setState(() => _insurance = value),
          ),
          const FormGap(),
          DatePickerTile(
            label: l.fitness,
            value: _fitness,
            onChanged: (value) => setState(() => _fitness = value),
          ),
          const FormGap(),
          DatePickerTile(
            label: l.permit,
            value: _permit,
            onChanged: (value) => setState(() => _permit = value),
          ),
          const FormGap(),
          DatePickerTile(
            label: l.pucExpiry,
            value: _puc,
            onChanged: (value) => setState(() => _puc = value),
          ),
          const FormGap(),
          DatePickerTile(
            label: l.taxExpiry,
            value: _tax,
            onChanged: (value) => setState(() => _tax = value),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : _save,
            child: Text(_saving ? l.saving : l.save),
          ),
          if (widget.truck != null) ...[
            const SizedBox(height: 16),
            DocumentsPanel(
              type: 'truck',
              entityId: widget.truck!.id,
              canEdit: context.watch<AuthState>().can('trucks.edit'),
            ),
          ],
        ],
      ),
    );
  }
}
