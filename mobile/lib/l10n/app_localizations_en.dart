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
  String get moreTrucksSubtitle => 'Fleet, expiry dates, and documents';

  @override
  String get moreDriversSubtitle => 'CRUD, documents, assigned truck';

  @override
  String get moreDieselSubtitle => 'Stock in/out, ledger, Hitachi issue';

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

  @override
  String get deleteConfirm => 'This record will be removed.';

  @override
  String get saved => 'Saved';

  @override
  String get noDocuments => 'No documents uploaded';

  @override
  String get fileRequired => 'Title and file are required';

  @override
  String get title => 'Title';

  @override
  String get documentType => 'Document type';

  @override
  String get other => 'Other';

  @override
  String get chooseFile => 'Choose file';

  @override
  String get uploadDocument => 'Upload document';

  @override
  String get expiry => 'Expiry';

  @override
  String get addDriver => 'Add driver';

  @override
  String get editDriver => 'Edit driver';

  @override
  String get requiredField => 'Please fill the required fields';

  @override
  String get assignedTruck => 'Assigned truck';

  @override
  String get none => 'None';

  @override
  String get salaryType => 'Salary type';

  @override
  String get salaryMonthly => 'Monthly';

  @override
  String get salaryPerTrip => 'Per trip';

  @override
  String get salaryBoth => 'Both';

  @override
  String get address => 'Address';

  @override
  String get emergencyContact => 'Emergency contact';

  @override
  String get truckNumber => 'Truck number';

  @override
  String get rcNumber => 'RC number';

  @override
  String get pucExpiry => 'PUC expiry';

  @override
  String get taxExpiry => 'Tax expiry';

  @override
  String get docsExpiring => 'Docs expiring';

  @override
  String get expiryDates => 'Expiry dates';

  @override
  String get addTruck => 'Add truck';

  @override
  String get editTruck => 'Edit truck';

  @override
  String get hitachi => 'Hitachi';

  @override
  String get machines => 'Machines';

  @override
  String get rentals => 'Rentals';

  @override
  String get noMachines => 'No machines';

  @override
  String get noRentals => 'No rentals';

  @override
  String get addMachine => 'Add machine';

  @override
  String get editMachine => 'Edit machine';

  @override
  String get machineNumber => 'Machine number';

  @override
  String get registration => 'Registration';

  @override
  String get hourlyRate => 'Hourly rate';

  @override
  String get dailyRate => 'Daily rate';

  @override
  String get monthlyRate => 'Monthly rate';

  @override
  String get addRental => 'Add rental';

  @override
  String get editRental => 'Edit rental';

  @override
  String get billingType => 'Billing';

  @override
  String get hourly => 'Hourly';

  @override
  String get daily => 'Daily';

  @override
  String get billingMonthly => 'Monthly';

  @override
  String get hours => 'Hours';

  @override
  String get days => 'Days';

  @override
  String get months => 'Months';

  @override
  String get startDate => 'Start date';

  @override
  String get endDate => 'End date';

  @override
  String get site => 'Site';

  @override
  String get operator => 'Operator';

  @override
  String get advance => 'Advance';

  @override
  String get statusBooked => 'Booked';

  @override
  String get statusRunning => 'Running';

  @override
  String get statusCompleted => 'Completed';

  @override
  String get statusCancelled => 'Cancelled';

  @override
  String get salary => 'Salary';

  @override
  String get advances => 'Advances';

  @override
  String get monthlyPay => 'Monthly pay';

  @override
  String get noAdvances => 'No advances';

  @override
  String get addAdvanceHint => 'Record a driver advance from here.';

  @override
  String get noSalaries => 'No salary entries';

  @override
  String get addSalaryHint => 'Create a monthly salary record.';

  @override
  String get addAdvance => 'Add advance';

  @override
  String get addSalary => 'Add salary';

  @override
  String get reconcileMonth => 'This month vs advances';

  @override
  String get advanced => 'Advanced';

  @override
  String get remaining => 'Remaining';

  @override
  String get baseAmount => 'Base amount';

  @override
  String get advanceDeduction => 'Advance deduction';

  @override
  String get year => 'Year';

  @override
  String get month => 'Month';

  @override
  String get ledger => 'Ledger';

  @override
  String get stockIn => 'Stock in';

  @override
  String get stockOut => 'Stock out';

  @override
  String get issueToHitachi => 'Issue to Hitachi';

  @override
  String get vehicleQtyRequired => 'Vehicle and quantity are required';

  @override
  String get moreHitachiSubtitle => 'Machines and rentals';

  @override
  String get moreSalarySubtitle => 'Advances and monthly pay';

  @override
  String get moreDriversSubtitleFull => 'CRUD, documents, assigned truck';

  @override
  String get moreTrucksSubtitleFull => 'Fleet, expiry dates, documents';

  @override
  String get shareTrip => 'Share trip';

  @override
  String get shareWhatsApp => 'WhatsApp';

  @override
  String get shareSms => 'SMS';

  @override
  String get tripShareHeading => 'Trip confirmed';

  @override
  String get tripShareThanks => 'Thank you.';

  @override
  String get cannotOpenWhatsApp => 'Could not open WhatsApp';

  @override
  String get cannotOpenSms => 'Could not open Messages';

  @override
  String get shareNoCustomerMobile =>
      'Customer mobile is missing. You can still pick the chat or number.';

  @override
  String get addTrip => 'Add trip';

  @override
  String get editTrip => 'Edit trip';

  @override
  String get startKm => 'Start KM';

  @override
  String get endKm => 'End KM';

  @override
  String get dieselQty => 'Diesel (litres)';

  @override
  String get dieselRate => 'Diesel rate';

  @override
  String get toll => 'Toll';

  @override
  String get maintenance => 'Maintenance';

  @override
  String get otherExpense => 'Other expense';

  @override
  String get driverSalary => 'Driver salary';

  @override
  String get freightRate => 'Freight rate (per unit)';

  @override
  String get advanceReceived => 'Advance received';

  @override
  String get compressor => 'Compressor';

  @override
  String get shareTripAfterSave =>
      'Trip saved. Share details with the customer now?';

  @override
  String get expenseTotal => 'All expenses';

  @override
  String get expenseTruckTrips => 'Truck & trips';

  @override
  String get expenseHitachi => 'Hitachi';

  @override
  String get expenseOtherGeneral => 'Other / general';

  @override
  String expenseEntries(int count) {
    return '$count entries';
  }

  @override
  String get topCategories => 'Top categories';

  @override
  String get recentExpenses => 'Recent expenses';
}
