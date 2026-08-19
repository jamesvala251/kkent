import 'app_localizations.dart';

export 'app_localizations.dart';

String statusLabel(AppLocalizations l, String? raw) {
  final key = (raw ?? '').toLowerCase();
  return switch (key) {
    'paid' => l.statusPaid,
    'pending' => l.statusPending,
    'partial' => l.statusPartial,
    'overdue' => l.statusOverdue,
    'active' => l.statusActive,
    'inactive' => l.statusInactive,
    'maintenance' => l.statusMaintenance,
    'breakdown' => l.statusBreakdown,
    'on_leave' || 'on leave' => l.statusOnLeave,
    _ => (raw == null || raw.isEmpty) ? '—' : raw,
  };
}

String searchTypeLabel(AppLocalizations l, String type) {
  return switch (type) {
    'customer' => l.typeCustomer,
    'trip' => l.typeTrip,
    'invoice' => l.typeInvoice,
    'truck' => l.typeTruck,
    'driver' => l.typeDriver,
    _ => type,
  };
}
