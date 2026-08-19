import '../utils/json.dart';

class UserAccount {
  const UserAccount({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    this.roles = const [],
    this.permissions = const [],
  });

  final int id;
  final String name;
  final String email;
  final String? phone;
  final List<String> roles;
  final List<String> permissions;

  factory UserAccount.fromJson(dynamic json) {
    final map = asMap(json);
    List<String> names(dynamic value) {
      if (value is List) {
        return value
            .map(
              (item) => item is Map ? asString(item['name']) : asString(item),
            )
            .where((item) => item.isNotEmpty)
            .toList();
      }
      return const [];
    }

    return UserAccount(
      id: asInt(map['id']),
      name: asString(map['name']),
      email: asString(map['email']),
      phone: map['phone']?.toString(),
      roles: names(map['roles']),
      permissions: names(map['permissions']),
    );
  }

  JsonMap toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'phone': phone,
    'roles': roles,
    'permissions': permissions,
  };
}

class DashboardStats {
  const DashboardStats({
    required this.totalCustomers,
    required this.totalTrucks,
    required this.activeDrivers,
    required this.totalTrips,
    required this.pendingInvoices,
    required this.monthlyIncome,
    required this.monthlyExpenses,
    required this.monthlyProfit,
  });

  final int totalCustomers;
  final int totalTrucks;
  final int activeDrivers;
  final int totalTrips;
  final int pendingInvoices;
  final double monthlyIncome;
  final double monthlyExpenses;
  final double monthlyProfit;

  factory DashboardStats.fromJson(dynamic json) {
    final map = asMap(json);
    return DashboardStats(
      totalCustomers: asInt(map['total_customers']),
      totalTrucks: asInt(map['total_trucks']),
      activeDrivers: asInt(map['active_drivers']),
      totalTrips: asInt(map['total_trips']),
      pendingInvoices: asInt(map['pending_invoices']),
      monthlyIncome: asDouble(map['monthly_income']),
      monthlyExpenses: asDouble(map['monthly_expenses']),
      monthlyProfit: asDouble(map['monthly_profit']),
    );
  }

  static const empty = DashboardStats(
    totalCustomers: 0,
    totalTrucks: 0,
    activeDrivers: 0,
    totalTrips: 0,
    pendingInvoices: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlyProfit: 0,
  );
}

class TripItem {
  const TripItem({
    required this.id,
    required this.tripNumber,
    this.startDate,
    this.endDate,
    this.fromLocation,
    this.toLocation,
    this.customerName,
    this.truckNumber,
    this.driverName,
    this.totalKm,
    this.totalFreight,
    this.totalExpense,
    this.profit,
    this.material,
    this.weight,
    this.remarks,
  });

  final int id;
  final String tripNumber;
  final String? startDate;
  final String? endDate;
  final String? fromLocation;
  final String? toLocation;
  final String? customerName;
  final String? truckNumber;
  final String? driverName;
  final double? totalKm;
  final double? totalFreight;
  final double? totalExpense;
  final double? profit;
  final String? material;
  final double? weight;
  final String? remarks;

  factory TripItem.fromJson(dynamic json) {
    final map = asMap(json);
    final customer = asMap(map['customer']);
    final truck = asMap(map['truck']);
    final driver = asMap(map['driver']);
    return TripItem(
      id: asInt(map['id']),
      tripNumber: asString(map['trip_number']),
      startDate: map['start_date']?.toString(),
      endDate: map['end_date']?.toString(),
      fromLocation: map['from_location']?.toString(),
      toLocation: map['to_location']?.toString(),
      customerName: customer['name']?.toString(),
      truckNumber: truck['truck_number']?.toString(),
      driverName: driver['name']?.toString(),
      totalKm: asNum(map['total_km'])?.toDouble(),
      totalFreight: asNum(map['total_freight'])?.toDouble(),
      totalExpense: asNum(map['total_expense'])?.toDouble(),
      profit: asNum(map['profit'])?.toDouble(),
      material: map['material']?.toString(),
      weight: asNum(map['weight'])?.toDouble(),
      remarks: map['remarks']?.toString(),
    );
  }
}

class CustomerItem {
  const CustomerItem({
    required this.id,
    required this.name,
    this.companyName,
    this.mobile,
    this.city,
    this.email,
    this.status,
  });

  final int id;
  final String name;
  final String? companyName;
  final String? mobile;
  final String? city;
  final String? email;
  final String? status;

  factory CustomerItem.fromJson(dynamic json) {
    final map = asMap(json);
    return CustomerItem(
      id: asInt(map['id']),
      name: asString(map['name']),
      companyName: map['company_name']?.toString(),
      mobile: map['mobile']?.toString(),
      city: map['city']?.toString(),
      email: map['email']?.toString(),
      status: map['status']?.toString(),
    );
  }
}

class CustomerLedger {
  const CustomerLedger({
    required this.customer,
    required this.billed,
    required this.paid,
    required this.outstanding,
    required this.trips,
    required this.invoices,
  });

  final CustomerItem customer;
  final double billed;
  final double paid;
  final double outstanding;
  final List<TripItem> trips;
  final List<InvoiceItem> invoices;

  factory CustomerLedger.fromJson(dynamic json) {
    final map = asMap(json);
    return CustomerLedger(
      customer: CustomerItem.fromJson(map['customer']),
      billed: asDouble(map['billed']),
      paid: asDouble(map['paid']),
      outstanding: asDouble(map['outstanding']),
      trips: asList(map['trips']).map(TripItem.fromJson).toList(),
      invoices: asList(map['invoices']).map(InvoiceItem.fromJson).toList(),
    );
  }
}

class InvoiceItem {
  const InvoiceItem({
    required this.id,
    required this.invoiceNumber,
    this.invoiceDate,
    this.dueDate,
    this.customerName,
    required this.totalAmount,
    required this.paidAmount,
    required this.paymentStatus,
  });

  final int id;
  final String invoiceNumber;
  final String? invoiceDate;
  final String? dueDate;
  final String? customerName;
  final double totalAmount;
  final double paidAmount;
  final String paymentStatus;

  factory InvoiceItem.fromJson(dynamic json) {
    final map = asMap(json);
    final customer = asMap(map['customer']);
    return InvoiceItem(
      id: asInt(map['id']),
      invoiceNumber: asString(map['invoice_number']),
      invoiceDate: map['invoice_date']?.toString(),
      dueDate: map['due_date']?.toString(),
      customerName: customer['name']?.toString(),
      totalAmount: asDouble(map['total_amount']),
      paidAmount: asDouble(map['paid_amount']),
      paymentStatus: asString(map['payment_status'], 'pending'),
    );
  }

  double get balance => totalAmount - paidAmount;
}

class ExpenseItem {
  const ExpenseItem({
    required this.id,
    required this.expenseDate,
    required this.amount,
    this.description,
    this.categoryName,
    this.truckNumber,
  });

  final int id;
  final String expenseDate;
  final double amount;
  final String? description;
  final String? categoryName;
  final String? truckNumber;

  factory ExpenseItem.fromJson(dynamic json) {
    final map = asMap(json);
    final category = asMap(map['category']);
    final truck = asMap(map['truck']);
    return ExpenseItem(
      id: asInt(map['id']),
      expenseDate: asString(map['expense_date']),
      amount: asDouble(map['amount']),
      description: map['description']?.toString(),
      categoryName: category['name']?.toString(),
      truckNumber: truck['truck_number']?.toString(),
    );
  }
}

class ExpenseCategory {
  const ExpenseCategory({required this.id, required this.name});

  final int id;
  final String name;

  factory ExpenseCategory.fromJson(dynamic json) {
    final map = asMap(json);
    return ExpenseCategory(id: asInt(map['id']), name: asString(map['name']));
  }
}

class TruckItem {
  const TruckItem({
    required this.id,
    required this.truckNumber,
    this.brand,
    this.model,
    this.status,
    this.capacity,
    this.owner,
    this.fuelType,
    this.currentKm,
    this.insuranceExpiry,
    this.fitnessExpiry,
    this.permitExpiry,
  });

  final int id;
  final String truckNumber;
  final String? brand;
  final String? model;
  final String? status;
  final String? capacity;
  final String? owner;
  final String? fuelType;
  final double? currentKm;
  final String? insuranceExpiry;
  final String? fitnessExpiry;
  final String? permitExpiry;

  factory TruckItem.fromJson(dynamic json) {
    final map = asMap(json);
    return TruckItem(
      id: asInt(map['id']),
      truckNumber: asString(map['truck_number']),
      brand: map['brand']?.toString(),
      model: map['model']?.toString(),
      status: map['status']?.toString(),
      capacity: map['capacity']?.toString(),
      owner: map['owner']?.toString(),
      fuelType: map['fuel_type']?.toString(),
      currentKm: asNum(map['current_km'])?.toDouble(),
      insuranceExpiry: map['insurance_expiry']?.toString(),
      fitnessExpiry: map['fitness_expiry']?.toString(),
      permitExpiry: map['permit_expiry']?.toString(),
    );
  }
}

class DriverItem {
  const DriverItem({
    required this.id,
    required this.name,
    this.mobile,
    this.status,
    this.licenseNumber,
    this.licenseExpiry,
    this.assignedTruck,
    this.monthlySalary,
  });

  final int id;
  final String name;
  final String? mobile;
  final String? status;
  final String? licenseNumber;
  final String? licenseExpiry;
  final String? assignedTruck;
  final double? monthlySalary;

  factory DriverItem.fromJson(dynamic json) {
    final map = asMap(json);
    final truck = asMap(map['assigned_truck'] ?? map['assignedTruck']);
    return DriverItem(
      id: asInt(map['id']),
      name: asString(map['name']),
      mobile: map['mobile']?.toString(),
      status: map['status']?.toString(),
      licenseNumber: map['license_number']?.toString(),
      licenseExpiry: map['license_expiry']?.toString(),
      assignedTruck: truck['truck_number']?.toString(),
      monthlySalary: asNum(map['monthly_salary'])?.toDouble(),
    );
  }
}

class DieselSummary {
  const DieselSummary({
    required this.totalIn,
    required this.totalOut,
    required this.stockBalance,
    required this.totalExpense,
  });

  final double totalIn;
  final double totalOut;
  final double stockBalance;
  final double totalExpense;

  factory DieselSummary.fromJson(dynamic json) {
    final map = asMap(json);
    return DieselSummary(
      totalIn: asDouble(map['total_in']),
      totalOut: asDouble(map['total_out']),
      stockBalance: asDouble(map['stock_balance']),
      totalExpense: asDouble(map['total_expense']),
    );
  }
}

class DieselPurchaseItem {
  const DieselPurchaseItem({
    required this.id,
    required this.purchaseDate,
    required this.quantity,
    required this.remainingQuantity,
    required this.ratePerLiter,
    required this.totalAmount,
    this.supplier,
    this.billNumber,
  });

  final int id;
  final String purchaseDate;
  final double quantity;
  final double remainingQuantity;
  final double ratePerLiter;
  final double totalAmount;
  final String? supplier;
  final String? billNumber;

  factory DieselPurchaseItem.fromJson(dynamic json) {
    final map = asMap(json);
    return DieselPurchaseItem(
      id: asInt(map['id']),
      purchaseDate: asString(map['purchase_date']),
      quantity: asDouble(map['quantity']),
      remainingQuantity: asDouble(map['remaining_quantity']),
      ratePerLiter: asDouble(map['rate_per_liter']),
      totalAmount: asDouble(map['total_amount']),
      supplier: map['supplier']?.toString(),
      billNumber: map['bill_number']?.toString(),
    );
  }
}

class DieselIssueItem {
  const DieselIssueItem({
    required this.id,
    required this.issueDate,
    required this.quantity,
    required this.totalAmount,
    this.truckNumber,
    this.notes,
  });

  final int id;
  final String issueDate;
  final double quantity;
  final double totalAmount;
  final String? truckNumber;
  final String? notes;

  factory DieselIssueItem.fromJson(dynamic json) {
    final map = asMap(json);
    final truck = asMap(map['truck']);
    return DieselIssueItem(
      id: asInt(map['id']),
      issueDate: asString(map['issue_date']),
      quantity: asDouble(map['quantity']),
      totalAmount: asDouble(map['total_amount']),
      truckNumber: truck['truck_number']?.toString(),
      notes: map['notes']?.toString(),
    );
  }
}

class OutstandingReport {
  const OutstandingReport({required this.total, required this.invoices});

  final double total;
  final List<InvoiceItem> invoices;

  factory OutstandingReport.fromJson(dynamic json) {
    final map = asMap(json);
    return OutstandingReport(
      total: asDouble(map['total_outstanding']),
      invoices: asList(map['invoices']).map(InvoiceItem.fromJson).toList(),
    );
  }
}

class SearchHit {
  const SearchHit({
    required this.type,
    required this.id,
    required this.title,
    this.subtitle,
  });

  final String type;
  final int id;
  final String title;
  final String? subtitle;
}

class GlobalSearch {
  const GlobalSearch({required this.hits});

  final List<SearchHit> hits;

  factory GlobalSearch.fromJson(dynamic json) {
    final map = asMap(json);
    final hits = <SearchHit>[
      ...asList(map['customers']).map(
        (item) => SearchHit(
          type: 'customer',
          id: asInt(asMap(item)['id']),
          title: asString(asMap(item)['name']),
          subtitle:
              asMap(item)['company_name']?.toString() ??
              asMap(item)['mobile']?.toString(),
        ),
      ),
      ...asList(map['trips']).map(
        (item) => SearchHit(
          type: 'trip',
          id: asInt(asMap(item)['id']),
          title: asString(asMap(item)['trip_number']),
        ),
      ),
      ...asList(map['invoices']).map(
        (item) => SearchHit(
          type: 'invoice',
          id: asInt(asMap(item)['id']),
          title: asString(asMap(item)['invoice_number']),
          subtitle: asMap(item)['payment_status']?.toString(),
        ),
      ),
      ...asList(map['trucks']).map(
        (item) => SearchHit(
          type: 'truck',
          id: asInt(asMap(item)['id']),
          title: asString(asMap(item)['truck_number']),
        ),
      ),
      ...asList(map['drivers']).map(
        (item) => SearchHit(
          type: 'driver',
          id: asInt(asMap(item)['id']),
          title: asString(asMap(item)['name']),
          subtitle: asMap(item)['mobile']?.toString(),
        ),
      ),
    ];
    return GlobalSearch(hits: hits);
  }
}

class AppNotice {
  const AppNotice({
    required this.id,
    required this.title,
    required this.message,
    required this.isRead,
    this.createdAt,
  });

  final int id;
  final String title;
  final String message;
  final bool isRead;
  final String? createdAt;

  factory AppNotice.fromJson(dynamic json) {
    final map = asMap(json);
    return AppNotice(
      id: asInt(map['id']),
      title: asString(map['title'], 'Notification'),
      message: asString(map['message'] ?? map['body']),
      isRead: asBool(map['is_read']),
      createdAt: map['created_at']?.toString(),
    );
  }
}
