import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/ui.dart';

class ExpensesScreen extends StatefulWidget {
  const ExpensesScreen({super.key});

  @override
  State<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends State<ExpensesScreen> {
  List<ExpenseItem> _rows = [];
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
      final rows = await context.read<AuthState>().api.expenses();
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
            if (rows.isEmpty) {
              return EmptyState(
                icon: Icons.payments_outlined,
                title: l.noExpensesFound,
                message: l.addExpenseHint,
              );
            }
            return RefreshIndicator(
              onRefresh: _load,
              child: ListView.builder(
                padding: const EdgeInsets.fromLTRB(0, 12, 0, 88),
                itemCount: rows.length,
                itemBuilder: (context, index) {
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
                              color: AppColors.warning.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.payments_outlined,
                              color: AppColors.warning,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  row.categoryName ?? 'Expense',
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
                                      .where((v) => v != null && v.isNotEmpty)
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
                          MoneyText(row.amount, color: AppColors.danger),
                        ],
                      ),
                    ),
                  );
                },
              ),
            );
          },
        ),
        if (canCreate)
          Positioned(
            right: 16,
            bottom: 16,
            child: FloatingActionButton.extended(
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
