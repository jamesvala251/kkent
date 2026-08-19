import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/labels.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../widgets/ui.dart';
import 'customers_screen.dart';
import 'drivers_screen.dart';
import 'invoices_screen.dart';
import 'trips_screen.dart';
import 'trucks_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _query = TextEditingController();
  List<SearchHit> _hits = [];
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  Future<void> _search() async {
    final q = _query.text.trim();
    if (q.length < 2) {
      setState(() {
        _hits = [];
        _error = AppLocalizations.of(context).searchMinChars;
      });
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await context.read<AuthState>().api.search(q);
      if (!mounted) return;
      setState(() {
        _hits = result.hits;
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

  void _open(SearchHit hit) {
    final Widget page = switch (hit.type) {
      'customer' => CustomerDetailScreen(id: hit.id),
      'trip' => TripDetailScreen(id: hit.id),
      'invoice' => InvoiceDetailScreen(id: hit.id),
      'truck' => TruckDetailScreen(id: hit.id),
      'driver' => DriverDetailScreen(id: hit.id),
      _ => const SizedBox.shrink(),
    };
    Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.search)),
      body: Column(
        children: [
          SearchField(
            controller: _query,
            hint: l.searchHint,
            onSubmit: _search,
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null && _hits.isEmpty
                ? EmptyState(
                    icon: Icons.search,
                    title: l.search,
                    message: _error!,
                  )
                : _hits.isEmpty
                ? EmptyState(
                    icon: Icons.search,
                    title: l.findRecords,
                    message: l.searchEmpty,
                  )
                : ListView.builder(
                    padding: const EdgeInsets.only(bottom: 24),
                    itemCount: _hits.length,
                    itemBuilder: (context, index) {
                      final hit = _hits[index];
                      return ListCard(
                        onTap: () => _open(hit),
                        child: ListTile(
                          title: Text(
                            hit.title,
                            style: const TextStyle(fontWeight: FontWeight.w700),
                          ),
                          subtitle: Text(
                            [
                              searchTypeLabel(l, hit.type),
                              hit.subtitle,
                            ].whereType<String>().join(' · '),
                            style: const TextStyle(color: AppColors.muted),
                          ),
                          trailing: const Icon(Icons.chevron_right),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
