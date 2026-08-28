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
    this.customerMobile,
    this.customerId,
    this.truckNumber,
    this.truckId,
    this.driverName,
    this.driverMobile,
    this.driverId,
    this.hitachiId,
    this.totalKm,
    this.startKm,
    this.endKm,
    this.totalFreight,
    this.freight,
    this.advanceReceived,
    this.totalExpense,
    this.dieselQty,
    this.dieselRate,
    this.toll,
    this.maintenance,
    this.otherExpense,
    this.driverSalary,
    this.profit,
    this.material,
    this.weight,
    this.compressor = false,
    this.remarks,
  });

  final int id;
  final String tripNumber;
  final String? startDate;
  final String? endDate;
  final String? fromLocation;
  final String? toLocation;
  final String? customerName;
  final String? customerMobile;
  final int? customerId;
  final String? truckNumber;
  final int? truckId;
  final String? driverName;
  final String? driverMobile;
  final int? driverId;
  final int? hitachiId;
  final double? totalKm;
  final double? startKm;
  final double? endKm;
  final double? totalFreight;
  final double? freight;
  final double? advanceReceived;
  final double? totalExpense;
  final double? dieselQty;
  final double? dieselRate;
  final double? toll;
  final double? maintenance;
  final double? otherExpense;
  final double? driverSalary;
  final double? profit;
  final String? material;
  final double? weight;
  final bool compressor;
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
      customerMobile:
          customer['mobile']?.toString() ??
          customer['alternate_mobile']?.toString(),
      customerId: asNum(map['customer_id'])?.toInt() ??
          asNum(customer['id'])?.toInt(),
      truckNumber: truck['truck_number']?.toString(),
      truckId: asNum(map['truck_id'])?.toInt() ?? asNum(truck['id'])?.toInt(),
      driverName: driver['name']?.toString(),
      driverMobile: driver['mobile']?.toString(),
      driverId: asNum(map['driver_id'])?.toInt() ?? asNum(driver['id'])?.toInt(),
      hitachiId: asNum(map['hitachi_id'])?.toInt(),
      totalKm: asNum(map['total_km'])?.toDouble(),
      startKm: asNum(map['start_km'])?.toDouble(),
      endKm: asNum(map['end_km'])?.toDouble(),
      totalFreight: asNum(map['total_freight'])?.toDouble(),
      freight: asNum(map['freight'])?.toDouble(),
      advanceReceived: asNum(map['advance_received'])?.toDouble(),
      totalExpense: asNum(map['total_expense'])?.toDouble(),
      dieselQty: asNum(map['diesel_qty'])?.toDouble(),
      dieselRate: asNum(map['diesel_rate'])?.toDouble(),
      toll: asNum(map['toll'])?.toDouble(),
      maintenance: asNum(map['maintenance'])?.toDouble(),
      otherExpense: asNum(map['other_expense'])?.toDouble(),
      driverSalary: asNum(map['driver_salary'])?.toDouble(),
      profit: asNum(map['profit'])?.toDouble(),
      material: map['material']?.toString(),
      weight: asNum(map['weight'])?.toDouble(),
      compressor: asBool(map['compressor']),
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
    this.truckId,
    this.driverId,
    this.tripId,
    this.hitachiId,
    this.hitachiRentalId,
  });

  final int id;
  final String expenseDate;
  final double amount;
  final String? description;
  final String? categoryName;
  final String? truckNumber;
  final int? truckId;
  final int? driverId;
  final int? tripId;
  final int? hitachiId;
  final int? hitachiRentalId;

  bool get isHitachi => hitachiId != null || hitachiRentalId != null;

  bool get isTruckTrip =>
      !isHitachi && (truckId != null || tripId != null || driverId != null);

  bool get isOther => !isHitachi && !isTruckTrip;

  factory ExpenseItem.fromJson(dynamic json) {
    final map = asMap(json);
    final category = asMap(map['category']);
    final truck = asMap(map['truck']);
    final hitachi = asMap(map['hitachi']);
    final rental = asMap(map['hitachi_rental']);
    return ExpenseItem(
      id: asInt(map['id']),
      expenseDate: asString(map['expense_date']),
      amount: asDouble(map['amount']),
      description: map['description']?.toString(),
      categoryName: category['name']?.toString(),
      truckNumber: truck['truck_number']?.toString(),
      truckId: asNum(map['truck_id'])?.toInt(),
      driverId: asNum(map['driver_id'])?.toInt(),
      tripId: asNum(map['trip_id'])?.toInt(),
      hitachiId: asNum(map['hitachi_id'])?.toInt() ??
          asNum(hitachi['id'])?.toInt(),
      hitachiRentalId: asNum(map['hitachi_rental_id'])?.toInt() ??
          asNum(rental['id'])?.toInt(),
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
    this.rcNumber,
    this.brand,
    this.model,
    this.year,
    this.status,
    this.capacity,
    this.owner,
    this.fuelType,
    this.gpsNumber,
    this.currentKm,
    this.insuranceExpiry,
    this.fitnessExpiry,
    this.permitExpiry,
    this.pucExpiry,
    this.taxExpiry,
  });

  final int id;
  final String truckNumber;
  final String? rcNumber;
  final String? brand;
  final String? model;
  final int? year;
  final String? status;
  final String? capacity;
  final String? owner;
  final String? fuelType;
  final String? gpsNumber;
  final double? currentKm;
  final String? insuranceExpiry;
  final String? fitnessExpiry;
  final String? permitExpiry;
  final String? pucExpiry;
  final String? taxExpiry;

  bool get hasExpiringDoc {
    bool soon(String? value) {
      if (value == null || value.isEmpty) return false;
      final parsed = DateTime.tryParse(value);
      if (parsed == null) return false;
      return parsed.isBefore(DateTime.now().add(const Duration(days: 30)));
    }

    return soon(insuranceExpiry) ||
        soon(fitnessExpiry) ||
        soon(permitExpiry) ||
        soon(pucExpiry) ||
        soon(taxExpiry);
  }

  factory TruckItem.fromJson(dynamic json) {
    final map = asMap(json);
    return TruckItem(
      id: asInt(map['id']),
      truckNumber: asString(map['truck_number']),
      rcNumber: map['rc_number']?.toString(),
      brand: map['brand']?.toString(),
      model: map['model']?.toString(),
      year: asNum(map['year'])?.toInt(),
      status: map['status']?.toString(),
      capacity: map['capacity']?.toString(),
      owner: map['owner']?.toString(),
      fuelType: map['fuel_type']?.toString(),
      gpsNumber: map['gps_number']?.toString(),
      currentKm: asNum(map['current_km'])?.toDouble(),
      insuranceExpiry: map['insurance_expiry']?.toString(),
      fitnessExpiry: map['fitness_expiry']?.toString(),
      permitExpiry: map['permit_expiry']?.toString(),
      pucExpiry: map['puc_expiry']?.toString(),
      taxExpiry: map['tax_expiry']?.toString(),
    );
  }
}

class DriverItem {
  const DriverItem({
    required this.id,
    required this.name,
    this.mobile,
    this.status,
    this.address,
    this.aadhaar,
    this.licenseNumber,
    this.licenseExpiry,
    this.joiningDate,
    this.salaryType,
    this.assignedTruck,
    this.assignedTruckId,
    this.monthlySalary,
    this.perTripSalary,
    this.emergencyContact,
  });

  final int id;
  final String name;
  final String? mobile;
  final String? status;
  final String? address;
  final String? aadhaar;
  final String? licenseNumber;
  final String? licenseExpiry;
  final String? joiningDate;
  final String? salaryType;
  final String? assignedTruck;
  final int? assignedTruckId;
  final double? monthlySalary;
  final double? perTripSalary;
  final String? emergencyContact;

  factory DriverItem.fromJson(dynamic json) {
    final map = asMap(json);
    final truck = asMap(map['assigned_truck'] ?? map['assignedTruck']);
    return DriverItem(
      id: asInt(map['id']),
      name: asString(map['name']),
      mobile: map['mobile']?.toString(),
      status: map['status']?.toString(),
      address: map['address']?.toString(),
      aadhaar: map['aadhaar']?.toString(),
      licenseNumber: map['license_number']?.toString(),
      licenseExpiry: map['license_expiry']?.toString(),
      joiningDate: map['joining_date']?.toString(),
      salaryType: map['salary_type']?.toString(),
      assignedTruck: truck['truck_number']?.toString(),
      assignedTruckId: () {
        final assigned = asNum(map['assigned_truck_id'])?.toInt();
        if (assigned != null && assigned > 0) return assigned;
        return asNum(truck['id'])?.toInt();
      }(),
      monthlySalary: asNum(map['monthly_salary'])?.toDouble(),
      perTripSalary: asNum(map['per_trip_salary'])?.toDouble(),
      emergencyContact: map['emergency_contact']?.toString(),
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
    final hitachi = asMap(map['hitachi']);
    return DieselIssueItem(
      id: asInt(map['id']),
      issueDate: asString(map['issue_date']),
      quantity: asDouble(map['quantity']),
      totalAmount: asDouble(map['total_amount']),
      truckNumber:
          truck['truck_number']?.toString() ??
          hitachi['machine_number']?.toString(),
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

class DocItem {
  const DocItem({
    required this.id,
    required this.title,
    required this.type,
    this.filePath,
    this.expiryDate,
  });

  final int id;
  final String title;
  final String type;
  final String? filePath;
  final String? expiryDate;

  factory DocItem.fromJson(dynamic json) {
    final map = asMap(json);
    return DocItem(
      id: asInt(map['id']),
      title: asString(map['title']),
      type: asString(map['type']),
      filePath: map['file_path']?.toString(),
      expiryDate: map['expiry_date']?.toString(),
    );
  }
}

class HitachiItem {
  const HitachiItem({
    required this.id,
    required this.machineNumber,
    this.registrationNumber,
    this.model,
    this.owner,
    this.status,
    this.fuelType,
    this.hourlyRate,
    this.dailyRate,
    this.monthlyRate,
    this.currentHours,
    this.bucketCapacity,
  });

  final int id;
  final String machineNumber;
  final String? registrationNumber;
  final String? model;
  final String? owner;
  final String? status;
  final String? fuelType;
  final double? hourlyRate;
  final double? dailyRate;
  final double? monthlyRate;
  final double? currentHours;
  final String? bucketCapacity;

  factory HitachiItem.fromJson(dynamic json) {
    final map = asMap(json);
    return HitachiItem(
      id: asInt(map['id']),
      machineNumber: asString(map['machine_number']),
      registrationNumber: map['registration_number']?.toString(),
      model: map['model']?.toString(),
      owner: map['owner']?.toString(),
      status: map['status']?.toString(),
      fuelType: map['fuel_type']?.toString(),
      hourlyRate: asNum(map['hourly_rate'])?.toDouble(),
      dailyRate: asNum(map['daily_rate'])?.toDouble(),
      monthlyRate: asNum(map['monthly_rate'])?.toDouble(),
      currentHours: asNum(map['current_hours'])?.toDouble(),
      bucketCapacity: map['bucket_capacity']?.toString(),
    );
  }
}

class HitachiRentalItem {
  const HitachiRentalItem({
    required this.id,
    required this.rentalNumber,
    required this.hitachiId,
    required this.customerId,
    required this.billingType,
    required this.startDate,
    required this.totalAmount,
    required this.balance,
    this.endDate,
    this.siteLocation,
    this.operatorName,
    this.status,
    this.machineNumber,
    this.customerName,
    this.rate,
    this.hours,
    this.days,
    this.months,
    this.advanceReceived,
  });

  final int id;
  final String rentalNumber;
  final int hitachiId;
  final int customerId;
  final String billingType;
  final String startDate;
  final String? endDate;
  final String? siteLocation;
  final String? operatorName;
  final String? status;
  final String? machineNumber;
  final String? customerName;
  final double totalAmount;
  final double balance;
  final double? rate;
  final double? hours;
  final double? days;
  final double? months;
  final double? advanceReceived;

  factory HitachiRentalItem.fromJson(dynamic json) {
    final map = asMap(json);
    final machine = asMap(map['hitachi']);
    final customer = asMap(map['customer']);
    return HitachiRentalItem(
      id: asInt(map['id']),
      rentalNumber: asString(map['rental_number']),
      hitachiId: asInt(map['hitachi_id']),
      customerId: asInt(map['customer_id']),
      billingType: asString(map['billing_type'], 'daily'),
      startDate: asString(map['start_date']),
      endDate: map['end_date']?.toString(),
      siteLocation: map['site_location']?.toString(),
      operatorName: map['operator_name']?.toString(),
      status: map['status']?.toString(),
      machineNumber: machine['machine_number']?.toString(),
      customerName: customer['name']?.toString(),
      totalAmount: asDouble(map['total_amount']),
      balance: asDouble(map['balance']),
      rate: asNum(map['rate'])?.toDouble(),
      hours: asNum(map['hours'])?.toDouble(),
      days: asNum(map['days'])?.toDouble(),
      months: asNum(map['months'])?.toDouble(),
      advanceReceived: asNum(map['advance_received'])?.toDouble(),
    );
  }
}

class DieselLedgerEntry {
  const DieselLedgerEntry({
    required this.id,
    required this.type,
    required this.date,
    required this.quantity,
    required this.totalAmount,
    this.reference,
    this.vehicle,
  });

  final int id;
  final String type;
  final String date;
  final double quantity;
  final double totalAmount;
  final String? reference;
  final String? vehicle;

  factory DieselLedgerEntry.fromJson(dynamic json) {
    final map = asMap(json);
    return DieselLedgerEntry(
      id: asInt(map['id']),
      type: asString(map['type']),
      date: asString(map['date']),
      quantity: asDouble(map['quantity']),
      totalAmount: asDouble(map['total_amount']),
      reference: map['reference']?.toString(),
      vehicle: map['vehicle']?.toString(),
    );
  }
}

class SalaryAdvanceItem {
  const SalaryAdvanceItem({
    required this.id,
    required this.driverId,
    required this.amount,
    required this.advanceDate,
    this.remarks,
    this.driverName,
  });

  final int id;
  final int driverId;
  final double amount;
  final String advanceDate;
  final String? remarks;
  final String? driverName;

  factory SalaryAdvanceItem.fromJson(dynamic json) {
    final map = asMap(json);
    final driver = asMap(map['driver']);
    return SalaryAdvanceItem(
      id: asInt(map['id']),
      driverId: asInt(map['driver_id']),
      amount: asDouble(map['amount']),
      advanceDate: asString(map['advance_date']),
      remarks: map['remarks']?.toString(),
      driverName: driver['name']?.toString(),
    );
  }
}

class SalaryItem {
  const SalaryItem({
    required this.id,
    required this.driverId,
    required this.month,
    required this.year,
    required this.netAmount,
    required this.paymentStatus,
    this.salaryType,
    this.baseAmount,
    this.advanceDeduction,
    this.driverName,
    this.paidDate,
  });

  final int id;
  final int driverId;
  final int month;
  final int year;
  final double netAmount;
  final String paymentStatus;
  final String? salaryType;
  final double? baseAmount;
  final double? advanceDeduction;
  final String? driverName;
  final String? paidDate;

  factory SalaryItem.fromJson(dynamic json) {
    final map = asMap(json);
    final driver = asMap(map['driver']);
    return SalaryItem(
      id: asInt(map['id']),
      driverId: asInt(map['driver_id']),
      month: asInt(map['month']),
      year: asInt(map['year']),
      netAmount: asDouble(map['net_amount']),
      paymentStatus: asString(map['payment_status'], 'pending'),
      salaryType: map['salary_type']?.toString(),
      baseAmount: asNum(map['base_amount'])?.toDouble(),
      advanceDeduction: asNum(map['advance_deduction'])?.toDouble(),
      driverName: driver['name']?.toString(),
      paidDate: map['paid_date']?.toString(),
    );
  }
}

class SalaryReconRow {
  const SalaryReconRow({
    required this.driverId,
    required this.driverName,
    required this.totalSalary,
    required this.advanced,
    required this.remaining,
    this.salaryType,
  });

  final int driverId;
  final String driverName;
  final double totalSalary;
  final double advanced;
  final double remaining;
  final String? salaryType;

  factory SalaryReconRow.fromJson(dynamic json) {
    final map = asMap(json);
    return SalaryReconRow(
      driverId: asInt(map['driver_id']),
      driverName: asString(map['driver_name']),
      totalSalary: asDouble(map['total_salary']),
      advanced: asDouble(map['total_advanced_salary']),
      remaining: asDouble(map['remaining_salary']),
      salaryType: map['salary_type']?.toString(),
    );
  }
}
