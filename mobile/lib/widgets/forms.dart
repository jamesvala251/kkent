import 'package:flutter/material.dart';

import '../l10n/app_localizations.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';

Future<bool> confirmDelete(
  BuildContext context, {
  String? title,
  String? message,
}) async {
  final l = AppLocalizations.of(context);
  final ok = await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title ?? l.delete),
      content: Text(message ?? l.deleteConfirm),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: Text(l.cancel),
        ),
        FilledButton(
          onPressed: () => Navigator.pop(context, true),
          child: Text(l.delete),
        ),
      ],
    ),
  );
  return ok == true;
}

void showError(BuildContext context, Object error) {
  ScaffoldMessenger.of(
    context,
  ).showSnackBar(SnackBar(content: Text(error.toString())));
}

void showSaved(BuildContext context) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(AppLocalizations.of(context).saved)),
  );
}

class DatePickerTile extends StatelessWidget {
  const DatePickerTile({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.optional = true,
  });

  final String label;
  final String? value;
  final ValueChanged<String?> onChanged;
  final bool optional;

  @override
  Widget build(BuildContext context) {
    final parsed = DateTime.tryParse(value ?? '');
    return Card(
      child: ListTile(
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w700)),
        subtitle: Text(formatDate(value)),
        trailing: const Icon(Icons.calendar_today_outlined),
        onTap: () async {
          final picked = await showDatePicker(
            context: context,
            initialDate: parsed ?? DateTime.now(),
            firstDate: DateTime(2018),
            lastDate: DateTime.now().add(const Duration(days: 3650)),
          );
          if (picked != null) onChanged(isoDate(picked));
        },
        onLongPress: optional ? () => onChanged(null) : null,
      ),
    );
  }
}

class StatusDropdown extends StatelessWidget {
  const StatusDropdown({
    super.key,
    required this.value,
    required this.items,
    required this.onChanged,
    required this.label,
  });

  final String value;
  final List<(String, String)> items;
  final ValueChanged<String> onChanged;
  final String label;

  @override
  Widget build(BuildContext context) {
    return InputDecorator(
      decoration: InputDecoration(labelText: label),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          isExpanded: true,
          value: items.any((item) => item.$1 == value) ? value : items.first.$1,
          items: [
            for (final item in items)
              DropdownMenuItem(value: item.$1, child: Text(item.$2)),
          ],
          onChanged: (next) {
            if (next != null) onChanged(next);
          },
        ),
      ),
    );
  }
}

class FormGap extends StatelessWidget {
  const FormGap({super.key});

  @override
  Widget build(BuildContext context) => const SizedBox(height: 12);
}

class RequiredBanner extends StatelessWidget {
  const RequiredBanner(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text, style: const TextStyle(color: AppColors.danger)),
    );
  }
}
