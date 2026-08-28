import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config/api_config.dart';
import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import 'forms.dart';
import 'ui.dart';

class DocumentsPanel extends StatefulWidget {
  const DocumentsPanel({
    super.key,
    required this.type,
    required this.entityId,
    this.canEdit = true,
  });

  final String type;
  final int entityId;
  final bool canEdit;

  @override
  State<DocumentsPanel> createState() => _DocumentsPanelState();
}

class _DocumentsPanelState extends State<DocumentsPanel> {
  List<DocItem> _rows = [];
  bool _loading = true;
  final _title = TextEditingController();
  String _docType = 'other';
  String? _expiry;
  String? _filePath;
  String? _fileName;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _title.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final rows = await context.read<AuthState>().api.documents(
        widget.type,
        widget.entityId,
      );
      if (!mounted) return;
      setState(() {
        _rows = rows;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      showError(context, e);
    }
  }

  Future<void> _pick() async {
    final file = await FilePicker.pickFile(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
    );
    if (file == null || file.path == null) return;
    setState(() {
      _filePath = file.path;
      _fileName = file.name;
    });
  }

  Future<void> _upload() async {
    final l = AppLocalizations.of(context);
    if (_title.text.trim().isEmpty || _filePath == null) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l.fileRequired)));
      return;
    }
    setState(() => _saving = true);
    try {
      await context.read<AuthState>().api.uploadDocument(
        type: widget.type,
        id: widget.entityId,
        title: _title.text.trim(),
        docType: _docType,
        filePath: _filePath!,
        expiryDate: _expiry,
      );
      if (!mounted) return;
      _title.clear();
      setState(() {
        _filePath = null;
        _fileName = null;
        _expiry = null;
        _saving = false;
      });
      showSaved(context);
      _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      showError(context, e);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    final canCreate = widget.canEdit;
    return SectionCard(
      title: l.documents,
      children: [
        if (_loading)
          const Padding(
            padding: EdgeInsets.all(16),
            child: Center(child: CircularProgressIndicator()),
          )
        else if (_rows.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Text(l.noDocuments, style: const TextStyle(color: AppColors.muted)),
          )
        else
          for (final doc in _rows)
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(doc.title, style: const TextStyle(fontWeight: FontWeight.w700)),
              subtitle: Text(
                [
                  doc.type,
                  if (doc.expiryDate != null) formatDate(doc.expiryDate),
                ].join(' · '),
              ),
              trailing: !canCreate
                  ? const Icon(Icons.open_in_new)
                  : IconButton(
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () async {
                        final api = context.read<AuthState>().api;
                        if (!await confirmDelete(context)) return;
                        try {
                          await api.deleteDocument(doc.id);
                          if (!mounted) return;
                          _load();
                        } catch (e) {
                          if (mounted) showError(context, e);
                        }
                      },
                    ),
              onTap: doc.filePath == null
                  ? null
                  : () {
                      final url = ApiConfig.storageUrl(doc.filePath);
                      launchUrl(
                        Uri.parse(url),
                        mode: LaunchMode.externalApplication,
                      );
                    },
            ),
        if (canCreate) ...[
          const Divider(),
          TextField(
            controller: _title,
            decoration: InputDecoration(labelText: l.title),
          ),
          const FormGap(),
          StatusDropdown(
            label: l.documentType,
            value: _docType,
            items: [
              ('rc', 'RC'),
              ('insurance', l.insurance),
              ('fitness', l.fitness),
              ('permit', l.permit),
              ('license', l.license),
              ('other', l.other),
            ],
            onChanged: (value) => setState(() => _docType = value),
          ),
          const FormGap(),
          DatePickerTile(
            label: l.expiry,
            value: _expiry,
            onChanged: (value) => setState(() => _expiry = value),
          ),
          const FormGap(),
          OutlinedButton.icon(
            onPressed: _pick,
            icon: const Icon(Icons.attach_file),
            label: Text(_fileName ?? l.chooseFile),
          ),
          const FormGap(),
          FilledButton(
            onPressed: _saving ? null : _upload,
            child: Text(_saving ? l.saving : l.uploadDocument),
          ),
        ],
      ],
    );
  }
}
