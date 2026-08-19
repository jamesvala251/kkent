import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../state/locale_state.dart';

class LanguagePicker extends StatelessWidget {
  const LanguagePicker({super.key, this.dark = false});

  final bool dark;

  @override
  Widget build(BuildContext context) {
    final locale = context.watch<LocaleState>();
    final l = AppLocalizations.of(context);
    final selected = locale.locale.languageCode;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l.language,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: dark ? Colors.white70 : null,
          ),
        ),
        const SizedBox(height: 8),
        SegmentedButton<String>(
          segments: [
            ButtonSegment(value: 'en', label: Text(l.languageEnglish)),
            ButtonSegment(value: 'gu', label: Text(l.languageGujarati)),
          ],
          selected: {selected},
          onSelectionChanged: (value) {
            if (value.isNotEmpty) {
              locale.setLanguage(value.first);
            }
          },
        ),
      ],
    );
  }
}
