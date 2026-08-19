import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/ui.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<AppNotice> _rows = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final rows = await context.read<AuthState>().api.notifications();
      if (!mounted) return;
      setState(() {
        _rows = rows;
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

  Future<void> _readAll() async {
    try {
      final auth = context.read<AuthState>();
      await auth.api.markAllNotificationsRead();
      await auth.refreshUnread();
      _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l.notifications),
        actions: [
          TextButton(
            onPressed: _readAll,
            child: Text(
              l.markAllRead,
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
      body: AsyncBody<List<AppNotice>>(
        loading: _loading,
        error: _error,
        data: _rows,
        onRetry: _load,
        builder: (rows) {
          if (rows.isEmpty) {
            return EmptyState(
              icon: Icons.notifications_none,
              title: l.noNotifications,
              message: l.notificationsEmpty,
            );
          }
          return RefreshIndicator(
            onRefresh: _load,
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(0, 12, 0, 24),
              itemCount: rows.length,
              itemBuilder: (context, index) {
                final row = rows[index];
                return ListCard(
                  onTap: row.isRead
                      ? null
                      : () async {
                          final auth = context.read<AuthState>();
                          await auth.api.markNotificationRead(row.id);
                          await auth.refreshUnread();
                          _load();
                        },
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          margin: const EdgeInsets.only(top: 6, right: 10),
                          decoration: BoxDecoration(
                            color: row.isRead ? AppColors.line : AppColors.navy,
                            shape: BoxShape.circle,
                          ),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                row.title,
                                style: TextStyle(
                                  fontWeight: row.isRead
                                      ? FontWeight.w500
                                      : FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                row.message,
                                style: const TextStyle(
                                  color: AppColors.muted,
                                  fontSize: 13,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                formatDate(row.createdAt),
                                style: const TextStyle(
                                  color: AppColors.muted,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
