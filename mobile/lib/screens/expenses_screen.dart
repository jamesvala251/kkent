import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/expense_stats.dart';
import '../utils/formatters.dart';
import '../widgets/ui.dart';

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({super.key});

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
  List<ExpenseItem> _rows = [];
  double? _monthlyTotal;
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
      final api = context.read<AuthState>().api;
      final rows = await api.expenses();
      double? monthly;
      try {
        monthly = (await api.dashboardStats()).monthlyExpenses;
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _rows = rows;
        _monthlyTotal = monthly;
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

  @override
  Widget build(BuildContext context) {
    final canCreate = context.watch<AuthState>().can('expenses.create');
    final l = AppLocalizations.of(context);
    return Stack(
      children: [
        AsyncBody<List<ExpenseItem>>(
          loading: _loading,
          error: _error,
          data: _rows,
          onRetry: _load,
          builder: (rows) {
            final stats = ExpenseStats.fromRows(rows);
            return RefreshIndicator(
              onRefresh: _load,
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                slivers: [
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    sliver: SliverToBoxAdapter(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 10,
                            childAspectRatio: 1.35,
                            children: [
                              StatTile(
                                label: l.thisMonth,
                                value: money(_monthlyTotal ?? stats.total),
                                icon: Icons.calendar_month_outlined,
                                color: AppColors.navy,
                              ),
                              StatTile(
                                label: l.expenseTotal,
                                value: money(stats.total),
                                icon: Icons.payments_outlined,
                                color: AppColors.indigo,
                              ),
                              StatTile(
                                label: l.expenseTruckTrips,
                                value: money(stats.truckTrips),
                                icon: Icons.local_shipping_outlined,
                                color: AppColors.success,
                              ),
                              StatTile(
                                label: l.expenseHitachi,
                                value: money(stats.hitachi),
                                icon: Icons.precision_manufacturing_outlined,
                                color: AppColors.warning,
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: _SummaryPill(
                                  label: l.expenseOtherGeneral,
                                  value: money(stats.other),
                                  icon: Icons.account_balance_wallet_outlined,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: _SummaryPill(
                                  label: l.recentExpenses,
                                  value: l.expenseEntries(stats.count),
                                  icon: Icons.receipt_long_outlined,
                                ),
                              ),
                            ],
                          ),
                          if (stats.topCategories.isNotEmpty) ...[
                            const SizedBox(height: 14),
                            SectionCard(
                              title: l.topCategories,
                              children: [
                                for (final row in stats.topCategories)
                                  Padding(
                                    padding: const EdgeInsets.symmetric(
                                      vertical: 6,
                                    ),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Text(
                                            row.name,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                        MoneyText(
                                          row.amount,
                                          color: AppColors.danger,
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                          ],
                          const SizedBox(height: 12),
                          Text(
                            l.recentExpenses,
                            style: const TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 16,
                            ),
                          ),
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                  ),
                  if (rows.isEmpty)
                    SliverFillRemaining(
                      hasScrollBody: false,
                      child: EmptyState(
                        icon: Icons.payments_outlined,
                        title: l.noExpensesFound,
                        message: l.addExpenseHint,
                      ),
                    )
                  else
                    SliverPadding(
                      padding: const EdgeInsets.only(bottom: 88),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final row = rows[index];
                            return ListCard(
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Row(
                                  children: [
                                    Container(
                                      width: 42,
                                      height: 42,
                                      decoration: BoxDecoration(
                                        color: AppColors.warning.withValues(
                                          alpha: 0.12,
                                        ),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Icon(
                                        row.isHitachi
                                            ? Icons.precision_manufacturing_outlined
                                            : row.isTruckTrip
                                            ? Icons.local_shipping_outlined
                                            : Icons.payments_outlined,
                                        color: AppColors.warning,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            row.categoryName ?? l.expense,
                                            style: const TextStyle(
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            [
                                                  formatDate(row.expenseDate),
                                                  row.truckNumber,
                                                  row.description,
                                                ]
                                                .where(
                                                  (v) =>
                                                      v != null &&
                                                      v.isNotEmpty,
                                                )
                                                .join('  ·  '),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              color: AppColors.muted,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    MoneyText(
                                      row.amount,
                                      color: AppColors.danger,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                          childCount: rows.length,
                        ),
                      ),
                    ),
                ],
              ),
            );
          },
        ),
        if (canCreate)
          Positioned(
            right: 16,
            bottom: 16,
            child: FloatingActionButton.extended(
              heroTag: 'fab-expenses',
              onPressed: () async {
                final saved = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(builder: (_) => const ExpenseFormScreen()),
                );
                if (saved == true) _load();
              },
              icon: const Icon(Icons.add),
              label: Text(l.add),
            ),
          ),
      ],
    );
  }
}

class _SummaryPill extends StatelessWidget {
  const _SummaryPill({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Icon(icon, color: AppColors.navy, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    value,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ExpenseFormScreen extends StatefulWidget {
  const ExpenseFormScreen({super.key});

  @override
  State<ExpenseFormScreen> createState() => _ExpenseFormScreenState();
}

class _ExpenseFormScreenState extends State<ExpenseFormScreen> {
  final _amount = TextEditingController();
  final _description = TextEditingController();
  DateTime _date = DateTime.now();
  List<ExpenseCategory> _categories = [];
  int? _categoryId;
  bool _loading = true;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  @override
  void dispose() {
    _amount.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _loadCategories() async {
    try {
      final categories = await context
          .read<AuthState>()
          .api
          .expenseCategories();
      if (!mounted) return;
      setState(() {
        _categories = categories;
        _categoryId = categories.isEmpty ? null : categories.first.id;
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

  Future<void> _save() async {
    final amount = double.tryParse(_amount.text.trim());
    if (_categoryId == null || amount == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context).categoryAmountRequired),
        ),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await context.read<AuthState>().api.createExpense(
        date: _date.toIso8601String().split('T').first,
        categoryId: _categoryId!,
        amount: amount,
        description: _description.text.trim(),
      );
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l.addExpense)),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(child: Text(_error!))
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
              children: [
                Card(
                  child: ListTile(
                    title: Text(
                      l.date,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: Text(formatDate(_date.toIso8601String())),
                    trailing: const Icon(
                      Icons.calendar_today_outlined,
                      color: AppColors.navy,
                    ),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _date,
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now().add(const Duration(days: 1)),
                      );
                      if (picked != null) setState(() => _date = picked);
                    },
                  ),
                ),
                const SizedBox(height: 12),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<int>(
                        isExpanded: true,
                        value: _categoryId,
                        hint: Text(l.category),
                        items: _categories
                            .map(
                              (category) => DropdownMenuItem(
                                value: category.id,
                                child: Text(category.name),
                              ),
                            )
                            .toList(),
                        onChanged: (value) =>
                            setState(() => _categoryId = value),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _amount,
                  keyboardType: const TextInputType.numberWithOptions(
                    decimal: true,
                  ),
                  decoration: InputDecoration(
                    labelText: l.amount,
                    prefixText: '₹ ',
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _description,
                  maxLines: 3,
                  decoration: InputDecoration(labelText: l.descriptionOptional),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  onPressed: _saving ? null : _save,
                  child: Text(_saving ? l.saving : l.saveExpense),
                ),
              ],
            ),
    );
  }
}
