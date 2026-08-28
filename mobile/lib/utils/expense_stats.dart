import '../models/models.dart';

class ExpenseStats {
  const ExpenseStats({
    required this.total,
    required this.truckTrips,
    required this.hitachi,
    required this.other,
    required this.count,
    required this.topCategories,
  });

  final double total;
  final double truckTrips;
  final double hitachi;
  final double other;
  final int count;
  final List<({String name, double amount})> topCategories;

  factory ExpenseStats.fromRows(List<ExpenseItem> rows) {
    var truck = 0.0;
    var hitachi = 0.0;
    var other = 0.0;
    final byCategory = <String, double>{};

    for (final row in rows) {
      if (row.isHitachi) {
        hitachi += row.amount;
      } else if (row.isTruckTrip) {
        truck += row.amount;
      } else {
        other += row.amount;
      }
      final name = row.categoryName?.trim();
      if (name != null && name.isNotEmpty) {
        byCategory[name] = (byCategory[name] ?? 0) + row.amount;
      }
    }

    final top = byCategory.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return ExpenseStats(
      total: truck + hitachi + other,
      truckTrips: truck,
      hitachi: hitachi,
      other: other,
      count: rows.length,
      topCategories: [
        for (final entry in top.take(3))
          (name: entry.key, amount: entry.value),
      ],
    );
  }
}
