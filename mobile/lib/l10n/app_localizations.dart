import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_gu.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('gu'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'KK Enterprise'**
  String get appTitle;

  /// No description provided for @adminMobile.
  ///
  /// In en, this message translates to:
  /// **'Admin mobile'**
  String get adminMobile;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signIn;

  /// No description provided for @signInHint.
  ///
  /// In en, this message translates to:
  /// **'Use your web admin login'**
  String get signInHint;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @validEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get validEmail;

  /// No description provided for @passwordRequired.
  ///
  /// In en, this message translates to:
  /// **'Password is required'**
  String get passwordRequired;

  /// No description provided for @loginFailed.
  ///
  /// In en, this message translates to:
  /// **'Login failed'**
  String get loginFailed;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @languageEnglish.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get languageEnglish;

  /// No description provided for @languageGujarati.
  ///
  /// In en, this message translates to:
  /// **'Gujarati'**
  String get languageGujarati;

  /// No description provided for @tabHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get tabHome;

  /// No description provided for @tabTrips.
  ///
  /// In en, this message translates to:
  /// **'Trips'**
  String get tabTrips;

  /// No description provided for @tabInvoices.
  ///
  /// In en, this message translates to:
  /// **'Invoices'**
  String get tabInvoices;

  /// No description provided for @tabExpenses.
  ///
  /// In en, this message translates to:
  /// **'Expenses'**
  String get tabExpenses;

  /// No description provided for @tabMore.
  ///
  /// In en, this message translates to:
  /// **'More'**
  String get tabMore;

  /// No description provided for @noModulePermissions.
  ///
  /// In en, this message translates to:
  /// **'No module permissions for this user.'**
  String get noModulePermissions;

  /// No description provided for @search.
  ///
  /// In en, this message translates to:
  /// **'Search'**
  String get search;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @profile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get profile;

  /// No description provided for @signOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get signOut;

  /// No description provided for @thisMonth.
  ///
  /// In en, this message translates to:
  /// **'This month'**
  String get thisMonth;

  /// No description provided for @profit.
  ///
  /// In en, this message translates to:
  /// **'Profit'**
  String get profit;

  /// No description provided for @income.
  ///
  /// In en, this message translates to:
  /// **'Income'**
  String get income;

  /// No description provided for @expenses.
  ///
  /// In en, this message translates to:
  /// **'Expenses'**
  String get expenses;

  /// No description provided for @overview.
  ///
  /// In en, this message translates to:
  /// **'Overview'**
  String get overview;

  /// No description provided for @pendingInvoices.
  ///
  /// In en, this message translates to:
  /// **'Pending invoices'**
  String get pendingInvoices;

  /// No description provided for @trips.
  ///
  /// In en, this message translates to:
  /// **'Trips'**
  String get trips;

  /// No description provided for @customers.
  ///
  /// In en, this message translates to:
  /// **'Customers'**
  String get customers;

  /// No description provided for @trucks.
  ///
  /// In en, this message translates to:
  /// **'Trucks'**
  String get trucks;

  /// No description provided for @couldNotLoad.
  ///
  /// In en, this message translates to:
  /// **'Could not load'**
  String get couldNotLoad;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @nothingToShow.
  ///
  /// In en, this message translates to:
  /// **'Nothing to show'**
  String get nothingToShow;

  /// No description provided for @searchTripsHint.
  ///
  /// In en, this message translates to:
  /// **'Search trip number or route'**
  String get searchTripsHint;

  /// No description provided for @noTripsFound.
  ///
  /// In en, this message translates to:
  /// **'No trips found'**
  String get noTripsFound;

  /// No description provided for @tryAnotherSearch.
  ///
  /// In en, this message translates to:
  /// **'Try another search.'**
  String get tryAnotherSearch;

  /// No description provided for @deleteTrip.
  ///
  /// In en, this message translates to:
  /// **'Delete trip'**
  String get deleteTrip;

  /// No description provided for @deleteTripConfirm.
  ///
  /// In en, this message translates to:
  /// **'This trip will be removed. Linked invoice lines will be detached.'**
  String get deleteTripConfirm;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @delete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get delete;

  /// No description provided for @trip.
  ///
  /// In en, this message translates to:
  /// **'Trip'**
  String get trip;

  /// No description provided for @route.
  ///
  /// In en, this message translates to:
  /// **'Route'**
  String get route;

  /// No description provided for @date.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get date;

  /// No description provided for @from.
  ///
  /// In en, this message translates to:
  /// **'From'**
  String get from;

  /// No description provided for @to.
  ///
  /// In en, this message translates to:
  /// **'To'**
  String get to;

  /// No description provided for @customer.
  ///
  /// In en, this message translates to:
  /// **'Customer'**
  String get customer;

  /// No description provided for @truck.
  ///
  /// In en, this message translates to:
  /// **'Truck'**
  String get truck;

  /// No description provided for @driver.
  ///
  /// In en, this message translates to:
  /// **'Driver'**
  String get driver;

  /// No description provided for @load.
  ///
  /// In en, this message translates to:
  /// **'Load'**
  String get load;

  /// No description provided for @material.
  ///
  /// In en, this message translates to:
  /// **'Material'**
  String get material;

  /// No description provided for @weight.
  ///
  /// In en, this message translates to:
  /// **'Weight'**
  String get weight;

  /// No description provided for @weightTons.
  ///
  /// In en, this message translates to:
  /// **'{value} ton'**
  String weightTons(String value);

  /// No description provided for @km.
  ///
  /// In en, this message translates to:
  /// **'KM'**
  String get km;

  /// No description provided for @remarks.
  ///
  /// In en, this message translates to:
  /// **'Remarks'**
  String get remarks;

  /// No description provided for @money.
  ///
  /// In en, this message translates to:
  /// **'Money'**
  String get money;

  /// No description provided for @freight.
  ///
  /// In en, this message translates to:
  /// **'Freight'**
  String get freight;

  /// No description provided for @expense.
  ///
  /// In en, this message translates to:
  /// **'Expense'**
  String get expense;

  /// No description provided for @statusAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get statusAll;

  /// No description provided for @statusPending.
  ///
  /// In en, this message translates to:
  /// **'Pending'**
  String get statusPending;

  /// No description provided for @statusPartial.
  ///
  /// In en, this message translates to:
  /// **'Partial'**
  String get statusPartial;

  /// No description provided for @statusOverdue.
  ///
  /// In en, this message translates to:
  /// **'Overdue'**
  String get statusOverdue;

  /// No description provided for @statusPaid.
  ///
  /// In en, this message translates to:
  /// **'Paid'**
  String get statusPaid;

  /// No description provided for @statusActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get statusActive;

  /// No description provided for @statusInactive.
  ///
  /// In en, this message translates to:
  /// **'Inactive'**
  String get statusInactive;

  /// No description provided for @statusMaintenance.
  ///
  /// In en, this message translates to:
  /// **'Maintenance'**
  String get statusMaintenance;

  /// No description provided for @statusBreakdown.
  ///
  /// In en, this message translates to:
  /// **'Breakdown'**
  String get statusBreakdown;

  /// No description provided for @statusOnLeave.
  ///
  /// In en, this message translates to:
  /// **'On leave'**
  String get statusOnLeave;

  /// No description provided for @noInvoicesFound.
  ///
  /// In en, this message translates to:
  /// **'No invoices found'**
  String get noInvoicesFound;

  /// No description provided for @tryAnotherPaymentStatus.
  ///
  /// In en, this message translates to:
  /// **'Try another payment status.'**
  String get tryAnotherPaymentStatus;

  /// No description provided for @invoice.
  ///
  /// In en, this message translates to:
  /// **'Invoice'**
  String get invoice;

  /// No description provided for @due.
  ///
  /// In en, this message translates to:
  /// **'Due'**
  String get due;

  /// No description provided for @status.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// No description provided for @amounts.
  ///
  /// In en, this message translates to:
  /// **'Amounts'**
  String get amounts;

  /// No description provided for @total.
  ///
  /// In en, this message translates to:
  /// **'Total'**
  String get total;

  /// No description provided for @paid.
  ///
  /// In en, this message translates to:
  /// **'Paid'**
  String get paid;

  /// No description provided for @balance.
  ///
  /// In en, this message translates to:
  /// **'Balance'**
  String get balance;

  /// No description provided for @recordPayment.
  ///
  /// In en, this message translates to:
  /// **'Record payment'**
  String get recordPayment;

  /// No description provided for @totalPaidAmount.
  ///
  /// In en, this message translates to:
  /// **'Total paid amount'**
  String get totalPaidAmount;

  /// No description provided for @paymentHelper.
  ///
  /// In en, this message translates to:
  /// **'Enter the new paid total, not this instalment only.'**
  String get paymentHelper;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @paymentSaved.
  ///
  /// In en, this message translates to:
  /// **'Payment saved'**
  String get paymentSaved;

  /// No description provided for @noExpensesFound.
  ///
  /// In en, this message translates to:
  /// **'No expenses found'**
  String get noExpensesFound;

  /// No description provided for @addExpenseHint.
  ///
  /// In en, this message translates to:
  /// **'Add a field expense with the + button.'**
  String get addExpenseHint;

  /// No description provided for @add.
  ///
  /// In en, this message translates to:
  /// **'Add'**
  String get add;

  /// No description provided for @addExpense.
  ///
  /// In en, this message translates to:
  /// **'Add expense'**
  String get addExpense;

  /// No description provided for @categoryAmountRequired.
  ///
  /// In en, this message translates to:
  /// **'Category and amount are required'**
  String get categoryAmountRequired;

  /// No description provided for @category.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get category;

  /// No description provided for @amount.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get amount;

  /// No description provided for @descriptionOptional.
  ///
  /// In en, this message translates to:
  /// **'Description (optional)'**
  String get descriptionOptional;

  /// No description provided for @saveExpense.
  ///
  /// In en, this message translates to:
  /// **'Save expense'**
  String get saveExpense;

  /// No description provided for @saving.
  ///
  /// In en, this message translates to:
  /// **'Saving…'**
  String get saving;

  /// No description provided for @moreCustomersSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Ledgers and outstanding'**
  String get moreCustomersSubtitle;

  /// No description provided for @moreTrucksSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Fleet and document expiry'**
  String get moreTrucksSubtitle;

  /// No description provided for @moreDriversSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Contacts and assigned trucks'**
  String get moreDriversSubtitle;

  /// No description provided for @moreDieselSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Stock, purchases, and issues'**
  String get moreDieselSubtitle;

  /// No description provided for @moreOutstandingSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Unpaid and partial invoices'**
  String get moreOutstandingSubtitle;

  /// No description provided for @moreProfileSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Name, phone, and password'**
  String get moreProfileSubtitle;

  /// No description provided for @account.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get account;

  /// No description provided for @drivers.
  ///
  /// In en, this message translates to:
  /// **'Drivers'**
  String get drivers;

  /// No description provided for @diesel.
  ///
  /// In en, this message translates to:
  /// **'Diesel'**
  String get diesel;

  /// No description provided for @outstanding.
  ///
  /// In en, this message translates to:
  /// **'Outstanding'**
  String get outstanding;

  /// No description provided for @searchCustomersHint.
  ///
  /// In en, this message translates to:
  /// **'Search name, company, mobile'**
  String get searchCustomersHint;

  /// No description provided for @noCustomersFound.
  ///
  /// In en, this message translates to:
  /// **'No customers found'**
  String get noCustomersFound;

  /// No description provided for @billed.
  ///
  /// In en, this message translates to:
  /// **'Billed'**
  String get billed;

  /// No description provided for @contact.
  ///
  /// In en, this message translates to:
  /// **'Contact'**
  String get contact;

  /// No description provided for @mobile.
  ///
  /// In en, this message translates to:
  /// **'Mobile'**
  String get mobile;

  /// No description provided for @city.
  ///
  /// In en, this message translates to:
  /// **'City'**
  String get city;

  /// No description provided for @recentTrips.
  ///
  /// In en, this message translates to:
  /// **'Recent trips'**
  String get recentTrips;

  /// No description provided for @recentInvoices.
  ///
  /// In en, this message translates to:
  /// **'Recent invoices'**
  String get recentInvoices;

  /// No description provided for @noTrips.
  ///
  /// In en, this message translates to:
  /// **'No trips'**
  String get noTrips;

  /// No description provided for @noInvoices.
  ///
  /// In en, this message translates to:
  /// **'No invoices'**
  String get noInvoices;

  /// No description provided for @searchTrucksHint.
  ///
  /// In en, this message translates to:
  /// **'Search truck number'**
  String get searchTrucksHint;

  /// No description provided for @noTrucksFound.
  ///
  /// In en, this message translates to:
  /// **'No trucks found'**
  String get noTrucksFound;

  /// No description provided for @vehicle.
  ///
  /// In en, this message translates to:
  /// **'Vehicle'**
  String get vehicle;

  /// No description provided for @number.
  ///
  /// In en, this message translates to:
  /// **'Number'**
  String get number;

  /// No description provided for @brand.
  ///
  /// In en, this message translates to:
  /// **'Brand'**
  String get brand;

  /// No description provided for @model.
  ///
  /// In en, this message translates to:
  /// **'Model'**
  String get model;

  /// No description provided for @capacity.
  ///
  /// In en, this message translates to:
  /// **'Capacity'**
  String get capacity;

  /// No description provided for @fuel.
  ///
  /// In en, this message translates to:
  /// **'Fuel'**
  String get fuel;

  /// No description provided for @owner.
  ///
  /// In en, this message translates to:
  /// **'Owner'**
  String get owner;

  /// No description provided for @documents.
  ///
  /// In en, this message translates to:
  /// **'Documents'**
  String get documents;

  /// No description provided for @insurance.
  ///
  /// In en, this message translates to:
  /// **'Insurance'**
  String get insurance;

  /// No description provided for @fitness.
  ///
  /// In en, this message translates to:
  /// **'Fitness'**
  String get fitness;

  /// No description provided for @permit.
  ///
  /// In en, this message translates to:
  /// **'Permit'**
  String get permit;

  /// No description provided for @searchDriversHint.
  ///
  /// In en, this message translates to:
  /// **'Search name or mobile'**
  String get searchDriversHint;

  /// No description provided for @noDriversFound.
  ///
  /// In en, this message translates to:
  /// **'No drivers found'**
  String get noDriversFound;

  /// No description provided for @license.
  ///
  /// In en, this message translates to:
  /// **'License'**
  String get license;

  /// No description provided for @licenseExpiry.
  ///
  /// In en, this message translates to:
  /// **'License expiry'**
  String get licenseExpiry;

  /// No description provided for @monthlySalary.
  ///
  /// In en, this message translates to:
  /// **'Monthly salary'**
  String get monthlySalary;

  /// No description provided for @stockLitres.
  ///
  /// In en, this message translates to:
  /// **'Stock (L)'**
  String get stockLitres;

  /// No description provided for @issuedLitres.
  ///
  /// In en, this message translates to:
  /// **'Issued (L)'**
  String get issuedLitres;

  /// No description provided for @purchasedLitres.
  ///
  /// In en, this message translates to:
  /// **'Purchased (L)'**
  String get purchasedLitres;

  /// No description provided for @spend.
  ///
  /// In en, this message translates to:
  /// **'Spend'**
  String get spend;

  /// No description provided for @recentPurchases.
  ///
  /// In en, this message translates to:
  /// **'Recent purchases'**
  String get recentPurchases;

  /// No description provided for @recentIssues.
  ///
  /// In en, this message translates to:
  /// **'Recent issues'**
  String get recentIssues;

  /// No description provided for @noPurchasesYet.
  ///
  /// In en, this message translates to:
  /// **'No purchases yet'**
  String get noPurchasesYet;

  /// No description provided for @noIssuesYet.
  ///
  /// In en, this message translates to:
  /// **'No issues yet'**
  String get noIssuesYet;

  /// No description provided for @recordPurchase.
  ///
  /// In en, this message translates to:
  /// **'Record purchase'**
  String get recordPurchase;

  /// No description provided for @issueToTruck.
  ///
  /// In en, this message translates to:
  /// **'Issue to truck'**
  String get issueToTruck;

  /// No description provided for @qtyRateRequired.
  ///
  /// In en, this message translates to:
  /// **'Quantity and rate are required'**
  String get qtyRateRequired;

  /// No description provided for @dieselPurchase.
  ///
  /// In en, this message translates to:
  /// **'Diesel purchase'**
  String get dieselPurchase;

  /// No description provided for @quantityLitres.
  ///
  /// In en, this message translates to:
  /// **'Quantity (litres)'**
  String get quantityLitres;

  /// No description provided for @ratePerLitre.
  ///
  /// In en, this message translates to:
  /// **'Rate per litre'**
  String get ratePerLitre;

  /// No description provided for @supplierOptional.
  ///
  /// In en, this message translates to:
  /// **'Supplier (optional)'**
  String get supplierOptional;

  /// No description provided for @billNumberOptional.
  ///
  /// In en, this message translates to:
  /// **'Bill number (optional)'**
  String get billNumberOptional;

  /// No description provided for @savePurchase.
  ///
  /// In en, this message translates to:
  /// **'Save purchase'**
  String get savePurchase;

  /// No description provided for @truckQtyRequired.
  ///
  /// In en, this message translates to:
  /// **'Truck and quantity are required'**
  String get truckQtyRequired;

  /// No description provided for @issueDiesel.
  ///
  /// In en, this message translates to:
  /// **'Issue diesel'**
  String get issueDiesel;

  /// No description provided for @notesOptional.
  ///
  /// In en, this message translates to:
  /// **'Notes (optional)'**
  String get notesOptional;

  /// No description provided for @litresLeft.
  ///
  /// In en, this message translates to:
  /// **'{value} L left'**
  String litresLeft(String value);

  /// No description provided for @supplier.
  ///
  /// In en, this message translates to:
  /// **'Supplier'**
  String get supplier;

  /// No description provided for @totalOutstanding.
  ///
  /// In en, this message translates to:
  /// **'Total outstanding'**
  String get totalOutstanding;

  /// No description provided for @unpaidInvoicesCount.
  ///
  /// In en, this message translates to:
  /// **'{count} unpaid invoices'**
  String unpaidInvoicesCount(int count);

  /// No description provided for @allClear.
  ///
  /// In en, this message translates to:
  /// **'All clear'**
  String get allClear;

  /// No description provided for @noPendingBalances.
  ///
  /// In en, this message translates to:
  /// **'No pending invoice balances.'**
  String get noPendingBalances;

  /// No description provided for @ofAmount.
  ///
  /// In en, this message translates to:
  /// **'of {amount}'**
  String ofAmount(String amount);

  /// No description provided for @searchHint.
  ///
  /// In en, this message translates to:
  /// **'Trips, invoices, customers, trucks…'**
  String get searchHint;

  /// No description provided for @searchMinChars.
  ///
  /// In en, this message translates to:
  /// **'Type at least 2 characters'**
  String get searchMinChars;

  /// No description provided for @findRecords.
  ///
  /// In en, this message translates to:
  /// **'Find records'**
  String get findRecords;

  /// No description provided for @searchEmpty.
  ///
  /// In en, this message translates to:
  /// **'Search by trip number, invoice, customer, or truck.'**
  String get searchEmpty;

  /// No description provided for @typeCustomer.
  ///
  /// In en, this message translates to:
  /// **'Customer'**
  String get typeCustomer;

  /// No description provided for @typeTrip.
  ///
  /// In en, this message translates to:
  /// **'Trip'**
  String get typeTrip;

  /// No description provided for @typeInvoice.
  ///
  /// In en, this message translates to:
  /// **'Invoice'**
  String get typeInvoice;

  /// No description provided for @typeTruck.
  ///
  /// In en, this message translates to:
  /// **'Truck'**
  String get typeTruck;

  /// No description provided for @typeDriver.
  ///
  /// In en, this message translates to:
  /// **'Driver'**
  String get typeDriver;

  /// No description provided for @markAllRead.
  ///
  /// In en, this message translates to:
  /// **'Mark all read'**
  String get markAllRead;

  /// No description provided for @noNotifications.
  ///
  /// In en, this message translates to:
  /// **'No notifications'**
  String get noNotifications;

  /// No description provided for @notificationsEmpty.
  ///
  /// In en, this message translates to:
  /// **'Expiry and overdue alerts will show here.'**
  String get notificationsEmpty;

  /// No description provided for @profileUpdated.
  ///
  /// In en, this message translates to:
  /// **'Profile updated'**
  String get profileUpdated;

  /// No description provided for @passwordsDoNotMatch.
  ///
  /// In en, this message translates to:
  /// **'New passwords do not match'**
  String get passwordsDoNotMatch;

  /// No description provided for @passwordChanged.
  ///
  /// In en, this message translates to:
  /// **'Password changed'**
  String get passwordChanged;

  /// No description provided for @name.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get name;

  /// No description provided for @phone.
  ///
  /// In en, this message translates to:
  /// **'Phone'**
  String get phone;

  /// No description provided for @saveProfile.
  ///
  /// In en, this message translates to:
  /// **'Save profile'**
  String get saveProfile;

  /// No description provided for @changePassword.
  ///
  /// In en, this message translates to:
  /// **'Change password'**
  String get changePassword;

  /// No description provided for @currentPassword.
  ///
  /// In en, this message translates to:
  /// **'Current password'**
  String get currentPassword;

  /// No description provided for @newPasswordHint.
  ///
  /// In en, this message translates to:
  /// **'New password (min 8 characters)'**
  String get newPasswordHint;

  /// No description provided for @confirmPassword.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get confirmPassword;

  /// No description provided for @updatePassword.
  ///
  /// In en, this message translates to:
  /// **'Update password'**
  String get updatePassword;

  /// No description provided for @user.
  ///
  /// In en, this message translates to:
  /// **'User'**
  String get user;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'gu'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'gu':
      return AppLocalizationsGu();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
