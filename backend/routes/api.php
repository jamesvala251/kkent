<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DieselController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\HitachiController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PermissionController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\SalaryController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\TripController;
use App\Http\Controllers\Api\TruckController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::put('profile', [AuthController::class, 'updateProfile']);
        Route::post('change-password', [AuthController::class, 'changePassword']);
        Route::get('activity-logs', [AuthController::class, 'activityLogs']);
    });

    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::get('dashboard/stats', [DashboardController::class, 'stats']);
    Route::get('dashboard/charts', [DashboardController::class, 'charts']);

    Route::get('customers/{customer}/ledger', [CustomerController::class, 'ledger']);
    Route::apiResource('customers', CustomerController::class);
    Route::apiResource('drivers', DriverController::class);
    Route::apiResource('trucks', TruckController::class);
    Route::apiResource('hitachi-machines', HitachiController::class);
    Route::prefix('hitachi')->group(function () {
        Route::get('summary', [HitachiController::class, 'rentalSummary']);
        Route::get('rentals', [HitachiController::class, 'indexRentals']);
        Route::post('rentals', [HitachiController::class, 'storeRental']);
        Route::get('rentals/{hitachiRental}', [HitachiController::class, 'showRental']);
        Route::put('rentals/{hitachiRental}', [HitachiController::class, 'updateRental']);
        Route::delete('rentals/{hitachiRental}', [HitachiController::class, 'destroyRental']);
    });
    Route::get('trips/next-number', [TripController::class, 'nextNumber']);
    Route::apiResource('trips', TripController::class);
    Route::apiResource('expenses', ExpenseController::class);
    Route::post('expenses/{expense}/with-bill', [ExpenseController::class, 'update']);

    Route::prefix('diesel')->group(function () {
        Route::get('summary', [DieselController::class, 'summary']);
        Route::get('ledger', [DieselController::class, 'ledger']);
        Route::get('available-purchases', [DieselController::class, 'availablePurchases']);
        Route::get('purchases', [DieselController::class, 'indexPurchases']);
        Route::post('purchases', [DieselController::class, 'storePurchase']);
        Route::get('purchases/{dieselPurchase}', [DieselController::class, 'showPurchase']);
        Route::put('purchases/{dieselPurchase}', [DieselController::class, 'updatePurchase']);
        Route::delete('purchases/{dieselPurchase}', [DieselController::class, 'destroyPurchase']);
        Route::get('issues', [DieselController::class, 'indexIssues']);
        Route::post('issues', [DieselController::class, 'storeIssue']);
        Route::get('issues/{dieselIssue}', [DieselController::class, 'showIssue']);
        Route::delete('issues/{dieselIssue}', [DieselController::class, 'destroyIssue']);
    });
    Route::apiResource('salaries', SalaryController::class);
    Route::apiResource('invoices', InvoiceController::class);
    Route::get('invoices/{invoice}/download', [InvoiceController::class, 'download']);
    Route::apiResource('maintenance', MaintenanceController::class);

    Route::post('documents', [DocumentController::class, 'store']);
    Route::delete('documents/{document}', [DocumentController::class, 'destroy']);
    Route::get('documents/{type}/{id}', [DocumentController::class, 'index']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    Route::get('search', [SearchController::class, 'global']);

    Route::prefix('reports')->group(function () {
        Route::get('generate', [ReportController::class, 'generate']);
        Route::get('export', [ReportController::class, 'export']);
        Route::get('daily-trips', [ReportController::class, 'dailyTrips']);
        Route::get('monthly-trips', [ReportController::class, 'monthlyTrips']);
        Route::get('vehicle-trips', [ReportController::class, 'vehicleTrips']);
        Route::get('customer-trips', [ReportController::class, 'customerTrips']);
        Route::get('driver-trips', [ReportController::class, 'driverTrips']);
        Route::get('profit', [ReportController::class, 'profit']);
        Route::get('expenses', [ReportController::class, 'expenses']);
        Route::get('diesel-consumption', [ReportController::class, 'dieselConsumption']);
        Route::get('salary', [ReportController::class, 'salary']);
        Route::get('outstanding', [ReportController::class, 'outstanding']);
        Route::get('invoices', [ReportController::class, 'invoices']);
        Route::get('maintenance', [ReportController::class, 'maintenance']);
    });

    Route::get('settings', [SettingController::class, 'show']);
    Route::put('settings', [SettingController::class, 'update']);
    Route::get('expense-categories', [ExpenseController::class, 'categories']);

    Route::get('permissions', [PermissionController::class, 'index']);
    Route::apiResource('roles', RoleController::class);
});
