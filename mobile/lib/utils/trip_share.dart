import 'package:url_launcher/url_launcher.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import 'formatters.dart';

String tripShareMessage(AppLocalizations l, TripItem trip) {
  final route = [
    trip.fromLocation,
    trip.toLocation,
  ].where((part) => part != null && part.trim().isNotEmpty).join(' → ');
  final load = [
    trip.material,
    if (trip.weight != null) l.weightTons('${trip.weight}'),
  ].where((part) => part != null && part.toString().trim().isNotEmpty).join(', ');
  final driver = [
    trip.driverName,
    trip.driverMobile,
  ].where((part) => part != null && part.trim().isNotEmpty).join(' · ');

  final lines = <String>[
    '${l.appTitle} – ${l.tripShareHeading}',
    '${l.trip}: ${trip.tripNumber}',
    if (trip.startDate != null) '${l.date}: ${formatDate(trip.startDate)}',
    if (route.isNotEmpty) '${l.route}: $route',
    if (trip.customerName != null && trip.customerName!.trim().isNotEmpty)
      '${l.customer}: ${trip.customerName}',
    if (trip.truckNumber != null && trip.truckNumber!.trim().isNotEmpty)
      '${l.truck}: ${trip.truckNumber}',
    if (driver.isNotEmpty) '${l.driver}: $driver',
    if (load.isNotEmpty) '${l.load}: $load',
    if (trip.remarks != null && trip.remarks!.trim().isNotEmpty)
      '${l.remarks}: ${trip.remarks}',
    l.tripShareThanks,
  ];
  return lines.join('\n');
}

/// WhatsApp expects country code + number, digits only.
String? whatsappDigits(String? raw) {
  if (raw == null) return null;
  var digits = raw.replaceAll(RegExp(r'\D'), '');
  if (digits.isEmpty) return null;
  if (digits.startsWith('0')) digits = digits.substring(1);
  if (digits.length == 10) digits = '91$digits';
  return digits;
}

Future<bool> openWhatsApp({required String text, String? phone}) async {
  final digits = whatsappDigits(phone);
  final uri = Uri.https('wa.me', digits == null ? '/' : '/$digits', {
    'text': text,
  });
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}

Future<bool> openSms({required String text, String? phone}) async {
  final digits = whatsappDigits(phone);
  final uri = Uri(
    scheme: 'sms',
    path: digits ?? '',
    queryParameters: {'body': text},
  );
  return launchUrl(uri, mode: LaunchMode.externalApplication);
}
