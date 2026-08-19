import '../models/models.dart';
import '../utils/json.dart';
import 'api_client.dart';

class KkentApi {
  KkentApi(this._client);

  final ApiClient _client;

  Future<({UserAccount user, String token})> login(
    String email,
    String password,
  ) async {
    final data = asMap(
      await _client.post(
        '/auth/login',
        data: {'email': email, 'password': password},
      ),
    );
    return (
      user: UserAccount.fromJson(data['user']),
      token: asString(data['token']),
    );
  }

  Future<void> logout() => _client.post('/auth/logout');

  Future<UserAccount> me() async =>
      UserAccount.fromJson(await _client.get('/auth/me'));

  Future<DashboardStats> dashboardStats() async {
    return DashboardStats.fromJson(await _client.get('/dashboard/stats'));
  }

  Future<List<TripItem>> trips({String? search}) async {
    final data = await _client.get(
      '/trips',
      query: {
        'per_page': 100,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return asList(data).map(TripItem.fromJson).toList();
  }

  Future<TripItem> trip(int id) async =>
      TripItem.fromJson(await _client.get('/trips/$id'));

  Future<void> deleteTrip(int id) => _client.delete('/trips/$id');

  Future<List<CustomerItem>> customers({String? search}) async {
    final data = await _client.get(
      '/customers',
      query: {
        'per_page': 100,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return asList(data).map(CustomerItem.fromJson).toList();
  }

  Future<CustomerLedger> customerLedger(int id) async {
    return CustomerLedger.fromJson(await _client.get('/customers/$id/ledger'));
  }

  Future<List<InvoiceItem>> invoices({
    String? search,
    String? paymentStatus,
  }) async {
    final data = await _client.get(
      '/invoices',
      query: {
        'per_page': 100,
        if (search != null && search.isNotEmpty) 'search': search,
        if (paymentStatus != null && paymentStatus.isNotEmpty)
          'payment_status': paymentStatus,
      },
    );
    return asList(data).map(InvoiceItem.fromJson).toList();
  }

  Future<InvoiceItem> invoice(int id) async =>
      InvoiceItem.fromJson(await _client.get('/invoices/$id'));

  Future<List<ExpenseItem>> expenses() async {
    final data = await _client.get('/expenses', query: {'per_page': 100});
    return asList(data).map(ExpenseItem.fromJson).toList();
  }

  Future<List<ExpenseCategory>> expenseCategories() async {
    final data = await _client.get('/expense-categories');
    return asList(data).map(ExpenseCategory.fromJson).toList();
  }

  Future<void> createExpense({
    required String date,
    required int categoryId,
    required double amount,
    String? description,
  }) {
    return _client.post(
      '/expenses',
      data: {
        'expense_date': date,
        'category_id': categoryId,
        'amount': amount,
        if (description != null && description.isNotEmpty)
          'description': description,
      },
    );
  }

  Future<List<AppNotice>> notifications() async {
    final data = await _client.get('/notifications', query: {'per_page': 50});
    return asList(data).map(AppNotice.fromJson).toList();
  }

  Future<void> markNotificationRead(int id) =>
      _client.post('/notifications/$id/read');

  Future<void> markAllNotificationsRead() =>
      _client.post('/notifications/read-all');

  Future<int> unreadNotificationCount() async {
    final data = await _client.get(
      '/notifications',
      query: {'unread_only': 1, 'per_page': 1},
    );
    return asInt(asMap(data)['total']);
  }

  Future<UserAccount> updateProfile({
    required String name,
    required String email,
    String? phone,
  }) async {
    return UserAccount.fromJson(
      await _client.put(
        '/auth/profile',
        data: {'name': name, 'email': email, 'phone': ?phone},
      ),
    );
  }

  Future<void> changePassword({
    required String currentPassword,
    required String password,
  }) {
    return _client.post(
      '/auth/change-password',
      data: {
        'current_password': currentPassword,
        'password': password,
        'password_confirmation': password,
      },
    );
  }

  Future<List<TruckItem>> trucks({String? search}) async {
    final data = await _client.get(
      '/trucks',
      query: {
        'per_page': 100,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return asList(data).map(TruckItem.fromJson).toList();
  }

  Future<TruckItem> truck(int id) async =>
      TruckItem.fromJson(await _client.get('/trucks/$id'));

  Future<List<DriverItem>> drivers({String? search}) async {
    final data = await _client.get(
      '/drivers',
      query: {
        'per_page': 100,
        if (search != null && search.isNotEmpty) 'search': search,
      },
    );
    return asList(data).map(DriverItem.fromJson).toList();
  }

  Future<DriverItem> driver(int id) async =>
      DriverItem.fromJson(await _client.get('/drivers/$id'));

  Future<DieselSummary> dieselSummary() async =>
      DieselSummary.fromJson(await _client.get('/diesel/summary'));

  Future<List<DieselPurchaseItem>> dieselPurchases() async {
    final data = await _client.get(
      '/diesel/purchases',
      query: {'per_page': 50},
    );
    return asList(data).map(DieselPurchaseItem.fromJson).toList();
  }

  Future<List<DieselIssueItem>> dieselIssues() async {
    final data = await _client.get('/diesel/issues', query: {'per_page': 50});
    return asList(data).map(DieselIssueItem.fromJson).toList();
  }

  Future<void> createDieselPurchase({
    required String date,
    required double quantity,
    required double ratePerLiter,
    String? supplier,
    String? billNumber,
  }) {
    return _client.post(
      '/diesel/purchases',
      data: {
        'purchase_date': date,
        'quantity': quantity,
        'rate_per_liter': ratePerLiter,
        if (supplier != null && supplier.isNotEmpty) 'supplier': supplier,
        if (billNumber != null && billNumber.isNotEmpty)
          'bill_number': billNumber,
      },
    );
  }

  Future<void> createDieselIssue({
    required String date,
    required double quantity,
    required int truckId,
    String? notes,
  }) {
    return _client.post(
      '/diesel/issues',
      data: {
        'issue_date': date,
        'quantity': quantity,
        'truck_id': truckId,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      },
    );
  }

  Future<OutstandingReport> outstanding() async =>
      OutstandingReport.fromJson(await _client.get('/reports/outstanding'));

  Future<GlobalSearch> search(String query) async {
    return GlobalSearch.fromJson(
      await _client.get('/search', query: {'q': query}),
    );
  }

  Future<InvoiceItem> updateInvoicePayment(int id, double paidAmount) async {
    return InvoiceItem.fromJson(
      await _client.put('/invoices/$id', data: {'paid_amount': paidAmount}),
    );
  }
}
