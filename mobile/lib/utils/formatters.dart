import 'package:intl/intl.dart';

String money(num? value) {
  return NumberFormat.currency(
    locale: Intl.defaultLocale ?? 'en_IN',
    symbol: '₹',
    decimalDigits: 2,
  ).format(value ?? 0);
}

String formatDate(String? value) {
  if (value == null || value.isEmpty) return '—';
  final parsed = DateTime.tryParse(value);
  if (parsed == null) return value;
  return DateFormat(
    'dd MMM yyyy',
    Intl.defaultLocale ?? 'en_IN',
  ).format(parsed);
}
