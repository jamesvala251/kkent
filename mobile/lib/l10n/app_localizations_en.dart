// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'KK Enterprise';

  @override
  String get adminMobile => 'Admin mobile';

  @override
  String get signIn => 'Sign in';

  @override
  String get signInHint => 'Use your web admin login';

  @override
  String get email => 'Email';

  @override
  String get password => 'Password';

  @override
  String get validEmail => 'Enter a valid email';

  @override
  String get passwordRequired => 'Password is required';

  @override
  String get loginFailed => 'Login failed';

  @override
  String get language => 'Language';

  @override
  String get languageEnglish => 'English';

  @override
  String get languageGujarati => 'Gujarati';

  @override
  String get tabHome => 'Home';

  @override
  String get tabTrips => 'Trips';

  @override
  String get tabInvoices => 'Invoices';

  @override
  String get tabExpenses => 'Expenses';

  @override
  String get tabMore => 'More';

  @override
  String get noModulePermissions => 'No module permissions for this user.';

  @override
  String get search => 'Search';

  @override
  String get notifications => 'Notifications';

  @override
  String get profile => 'Profile';

  @override
  String get signOut => 'Sign out';

  @override
  String get thisMonth => 'This month';

  @override
  String get profit => 'Profit';

  @override
  String get income => 'Income';

  @override
  String get expenses => 'Expenses';

  @override
  String get overview => 'Overview';

  @override
  String get pendingInvoices => 'Pending invoices';

  @override
  String get trips => 'Trips';

  @override
  String get customers => 'Customers';

  @override
  String get trucks => 'Trucks';

  @override
  String get couldNotLoad => 'Could not load';

  @override
  String get retry => 'Retry';

  @override
  String get nothingToShow => 'Nothing to show';

  @override
  String get searchTripsHint => 'Search trip number or route';

  @override
  String get noTripsFound => 'No trips found';

  @override
  String get tryAnotherSearch => 'Try another search.';

  @override
  String get deleteTrip => 'Delete trip';

  @override
  String get deleteTripConfirm =>
      'This trip will be removed. Linked invoice lines will be detached.';

  @override
  String get cancel => 'Cancel';

  @override
  String get delete => 'Delete';

  @override
  String get trip => 'Trip';

  @override
  String get route => 'Route';

  @override
  String get date => 'Date';

  @override
  String get from => 'From';

  @override
  String get to => 'To';

  @override
  String get customer => 'Customer';

  @override
  String get truck => 'Truck';

  @override
  String get driver => 'Driver';

  @override
  String get load => 'Load';

  @override
  String get material => 'Material';

  @override
  String get weight => 'Weight';

  @override
  String weightTons(String value) {
    return '$value ton';
  }

  @override
  String get km => 'KM';

  @override
  String get remarks => 'Remarks';

  @override
  String get money => 'Money';

  @override
  String get freight => 'Freight';

  @override
  String get expense => 'Expense';

  @override
  String get statusAll => 'All';

  @override
  String get statusPending => 'Pending';

  @override
  String get statusPartial => 'Partial';

  @override
  String get statusOverdue => 'Overdue';

  @override
  String get statusPaid => 'Paid';

  @override
  String get statusActive => 'Active';

  @override
  String get statusInactive => 'Inactive';

  @override
  String get statusMaintenance => 'Maintenance';

  @override
  String get statusBreakdown => 'Breakdown';

  @override
  String get statusOnLeave => 'On leave';

  @override
  String get noInvoicesFound => 'No invoices found';

  @override
  String get tryAnotherPaymentStatus => 'Try another payment status.';

  @override
  String get invoice => 'Invoice';

  @override
  String get due => 'Due';

  @override
  String get status => 'Status';

  @override
  String get amounts => 'Amounts';

  @override
  String get total => 'Total';

  @override
  String get paid => 'Paid';

  @override
  String get balance => 'Balance';

  @override
  String get recordPayment => 'Record payment';

  @override
  String get totalPaidAmount => 'Total paid amount';

  @override
  String get paymentHelper =>
      'Enter the new paid total, not this instalment only.';

  @override
  String get save => 'Save';

  @override
  String get paymentSaved => 'Payment saved';

  @override
  String get noExpensesFound => 'No expenses found';

  @override
  String get addExpenseHint => 'Add a field expense with the + button.';

  @override
  String get add => 'Add';

  @override
  String get addExpense => 'Add expense';

  @override
  String get categoryAmountRequired => 'Category and amount are required';

  @override
  String get category => 'Category';

  @override
  String get amount => 'Amount';

  @override
  String get descriptionOptional => 'Description (optional)';

  @override
  String get saveExpense => 'Save expense';

  @override
  String get saving => 'Saving…';

  @override
  String get moreCustomersSubtitle => 'Ledgers and outstanding';

  @override
  String get moreTrucksSubtitle => 'Fleet and document expiry';

  @override
  String get moreDriversSubtitle => 'Contacts and assigned trucks';

  @override
  String get moreDieselSubtitle => 'Stock, purchases, and issues';

  @override
  String get moreOutstandingSubtitle => 'Unpaid and partial invoices';

  @override
  String get moreProfileSubtitle => 'Name, phone, and password';

  @override
  String get account => 'Account';

  @override
  String get drivers => 'Drivers';

  @override
  String get diesel => 'Diesel';

  @override
  String get outstanding => 'Outstanding';

  @override
  String get searchCustomersHint => 'Search name, company, mobile';

  @override
  String get noCustomersFound => 'No customers found';

  @override
  String get billed => 'Billed';

  @override
  String get contact => 'Contact';

  @override
  String get mobile => 'Mobile';

  @override
  String get city => 'City';

  @override
  String get recentTrips => 'Recent trips';

  @override
  String get recentInvoices => 'Recent invoices';

  @override
  String get noTrips => 'No trips';

  @override
  String get noInvoices => 'No invoices';

  @override
  String get searchTrucksHint => 'Search truck number';

  @override
  String get noTrucksFound => 'No trucks found';

  @override
  String get vehicle => 'Vehicle';

  @override
  String get number => 'Number';

  @override
  String get brand => 'Brand';

  @override
  String get model => 'Model';

  @override
  String get capacity => 'Capacity';

  @override
  String get fuel => 'Fuel';

  @override
  String get owner => 'Owner';

  @override
  String get documents => 'Documents';

  @override
  String get insurance => 'Insurance';

  @override
  String get fitness => 'Fitness';

  @override
  String get permit => 'Permit';

  @override
  String get searchDriversHint => 'Search name or mobile';

  @override
  String get noDriversFound => 'No drivers found';

  @override
  String get license => 'License';

  @override
  String get licenseExpiry => 'License expiry';

  @override
  String get monthlySalary => 'Monthly salary';

  @override
  String get stockLitres => 'Stock (L)';

  @override
  String get issuedLitres => 'Issued (L)';

  @override
  String get purchasedLitres => 'Purchased (L)';

  @override
  String get spend => 'Spend';

  @override
  String get recentPurchases => 'Recent purchases';

  @override
  String get recentIssues => 'Recent issues';

  @override
  String get noPurchasesYet => 'No purchases yet';

  @override
  String get noIssuesYet => 'No issues yet';

  @override
  String get recordPurchase => 'Record purchase';

  @override
  String get issueToTruck => 'Issue to truck';

  @override
  String get qtyRateRequired => 'Quantity and rate are required';

  @override
  String get dieselPurchase => 'Diesel purchase';

  @override
  String get quantityLitres => 'Quantity (litres)';

  @override
  String get ratePerLitre => 'Rate per litre';

  @override
  String get supplierOptional => 'Supplier (optional)';

  @override
  String get billNumberOptional => 'Bill number (optional)';

  @override
  String get savePurchase => 'Save purchase';

  @override
  String get truckQtyRequired => 'Truck and quantity are required';

  @override
  String get issueDiesel => 'Issue diesel';

  @override
  String get notesOptional => 'Notes (optional)';

  @override
  String litresLeft(String value) {
    return '$value L left';
  }

  @override
  String get supplier => 'Supplier';

  @override
  String get totalOutstanding => 'Total outstanding';

  @override
  String unpaidInvoicesCount(int count) {
    return '$count unpaid invoices';
  }

  @override
  String get allClear => 'All clear';

  @override
  String get noPendingBalances => 'No pending invoice balances.';

  @override
  String ofAmount(String amount) {
    return 'of $amount';
  }

  @override
  String get searchHint => 'Trips, invoices, customers, trucks…';

  @override
  String get searchMinChars => 'Type at least 2 characters';

  @override
  String get findRecords => 'Find records';

  @override
  String get searchEmpty =>
      'Search by trip number, invoice, customer, or truck.';

  @override
  String get typeCustomer => 'Customer';

  @override
  String get typeTrip => 'Trip';

  @override
  String get typeInvoice => 'Invoice';

  @override
  String get typeTruck => 'Truck';

  @override
  String get typeDriver => 'Driver';

  @override
  String get markAllRead => 'Mark all read';

  @override
  String get noNotifications => 'No notifications';

  @override
  String get notificationsEmpty => 'Expiry and overdue alerts will show here.';

  @override
  String get profileUpdated => 'Profile updated';

  @override
  String get passwordsDoNotMatch => 'New passwords do not match';

  @override
  String get passwordChanged => 'Password changed';

  @override
  String get name => 'Name';

  @override
  String get phone => 'Phone';

  @override
  String get saveProfile => 'Save profile';

  @override
  String get changePassword => 'Change password';

  @override
  String get currentPassword => 'Current password';

  @override
  String get newPasswordHint => 'New password (min 8 characters)';

  @override
  String get confirmPassword => 'Confirm password';

  @override
  String get updatePassword => 'Update password';

  @override
  String get user => 'User';
}
