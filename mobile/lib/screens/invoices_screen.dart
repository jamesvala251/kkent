import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../l10n/app_localizations.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme/app_theme.dart';
import '../utils/formatters.dart';
import '../widgets/ui.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  String _status = '';
  List<InvoiceItem> _rows = [];
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
      final rows = await context.read<AuthState>().api.invoices(
        paymentStatus: _status,
      );
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
    final l = AppLocalizations.of(context);
    final filters = [
      ('', l.statusAll),
      ('pending', l.statusPending),
      ('partial', l.statusPartial),
      ('overdue', l.statusOverdue),
      ('paid', l.statusPaid),
    ];
    return Column(
      children: [
        SizedBox(
          height: 52,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 8),
            children: [
              for (final filter in filters)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(filter.$2),
                    selected: _status == filter.$1,
                    onSelected: (_) {
                      setState(() => _status = filter.$1);
                      _load();
                    },
                  ),
                ),
            ],
          ),
        ),
        Expanded(
          child: AsyncBody<List<InvoiceItem>>(
            loading: _loading,
            error: _error,
            data: _rows,
            onRetry: _load,
            builder: (rows) {
              if (rows.isEmpty) {
                return EmptyState(
                  icon: Icons.receipt_long,
                  title: l.noInvoicesFound,
                  message: l.tryAnotherPaymentStatus,
                );
              }
              return RefreshIndicator(
                onRefresh: _load,
                child: ListView.builder(
                  padding: const EdgeInsets.only(top: 4, bottom: 24),
                  itemCount: rows.length,
                  itemBuilder: (context, index) {
                    final row = rows[index];
                    return ListCard(
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => InvoiceDetailScreen(id: row.id),
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    row.invoiceNumber,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '${row.customerName ?? '—'}  ·  ${formatDate(row.invoiceDate)}',
                                    style: const TextStyle(
                                      color: AppColors.muted,
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  StatusChip(row.paymentStatus),
                                ],
                              ),
                            ),
                            MoneyText(row.totalAmount),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

class InvoiceDetailScreen extends StatefulWidget {
  const InvoiceDetailScreen({super.key, required this.id});

  final int id;

  @override
  State<InvoiceDetailScreen> createState() => _InvoiceDetailScreenState();
}

class _InvoiceDetailScreenState extends State<InvoiceDetailScreen> {
  InvoiceItem? _invoice;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final invoice = await context.read<AuthState>().api.invoice(widget.id);
      if (!mounted) return;
      setState(() {
        _invoice = invoice;
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
    final l = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(_invoice?.invoiceNumber ?? l.invoice)),
      body: AsyncBody<InvoiceItem>(
        loading: _loading,
        error: _error,
        data: _invoice,
        onRetry: _load,
        builder: (invoice) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 28),
          children: [
            SectionCard(
              title: l.invoice,
              children: [
                Kv(l.customer, invoice.customerName),
                Kv(l.date, formatDate(invoice.invoiceDate)),
                Kv(l.due, formatDate(invoice.dueDate)),
                Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: Row(
                    children: [
                      SizedBox(
                        width: 110,
                        child: Text(
                          l.status,
                          style: TextStyle(
                            color: AppColors.muted,
                            fontSize: 13,
                          ),
                        ),
                      ),
                      StatusChip(invoice.paymentStatus),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SectionCard(
              title: l.amounts,
              children: [
                Kv(l.total, null, moneyValue: invoice.totalAmount),
                Kv(
                  l.paid,
                  null,
                  moneyValue: invoice.paidAmount,
                  highlight: true,
                ),
                Kv(l.balance, null, moneyValue: invoice.balance),
              ],
            ),
            const SizedBox(height: 12),
            if (invoice.paymentStatus != 'paid' &&
                context.watch<AuthState>().can('invoices.edit'))
              FilledButton.icon(
                onPressed: () => _recordPayment(invoice),
                icon: const Icon(Icons.payments_outlined),
                label: Text(l.recordPayment),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _recordPayment(InvoiceItem invoice) async {
    final l = AppLocalizations.of(context);
    final controller = TextEditingController(
      text: invoice.totalAmount.toStringAsFixed(2),
    );
    final amount = await showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l.recordPayment),
        content: TextField(
          controller: controller,
          autofocus: true,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: InputDecoration(
            labelText: l.totalPaidAmount,
            prefixText: '₹ ',
            helperText: l.paymentHelper,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l.cancel),
          ),
          FilledButton(
            onPressed: () {
              final value = double.tryParse(controller.text.trim());
              Navigator.pop(context, value);
            },
            child: Text(l.save),
          ),
        ],
      ),
    );
    if (amount == null || !mounted) return;
    try {
      final updated = await context.read<AuthState>().api.updateInvoicePayment(
        invoice.id,
        amount,
      );
      if (!mounted) return;
      setState(() => _invoice = updated);
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(l.paymentSaved)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }
}
