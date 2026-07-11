<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Driver;
use App\Models\Expense;
use App\Models\HitachiMachine;
use App\Models\Invoice;
use App\Models\MaintenanceRecord;
use App\Models\Salary;
use App\Models\Trip;
use App\Models\Truck;
use Carbon\Carbon;

class DashboardService
{
    public function getStats(): array
    {
        $today = Carbon::today();
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        $monthlyIncome = Trip::where('status', 'completed')
            ->whereBetween('end_date', [$monthStart, $monthEnd])
            ->sum('total_freight');

        $monthlyExpenses = Expense::whereBetween('expense_date', [$monthStart, $monthEnd])
            ->sum('amount');

        $tripExpenses = Trip::where('status', 'completed')
            ->whereBetween('end_date', [$monthStart, $monthEnd])
            ->sum('total_expense');

        $totalMonthlyExpenses = $monthlyExpenses + $tripExpenses;

        return [
            'total_customers' => Customer::where('status', 'active')->count(),
            'total_trucks' => Truck::where('status', 'active')->count(),
            'total_hitachi' => HitachiMachine::where('status', 'active')->count(),
            'active_drivers' => Driver::where('status', 'active')->count(),
            'total_trips' => Trip::count(),
            'trips_running' => Trip::where('status', 'running')->count(),
            'pending_invoices' => Invoice::where('payment_status', 'pending')->count(),
            'today_expenses' => Expense::whereDate('expense_date', $today)->sum('amount'),
            'monthly_income' => round($monthlyIncome, 2),
            'monthly_expenses' => round($totalMonthlyExpenses, 2),
            'monthly_profit' => round($monthlyIncome - $totalMonthlyExpenses, 2),
        ];
    }

    public function getCharts(): array
    {
        $months = collect(range(5, 0))->map(fn ($i) => Carbon::now()->subMonths($i));

        $monthlyRevenue = $months->map(function ($date) {
            return [
                'month' => $date->format('M Y'),
                'amount' => Trip::where('status', 'completed')
                    ->whereYear('end_date', $date->year)
                    ->whereMonth('end_date', $date->month)
                    ->sum('total_freight'),
            ];
        });

        $monthlyExpense = $months->map(function ($date) {
            $expenses = Expense::whereYear('expense_date', $date->year)
                ->whereMonth('expense_date', $date->month)
                ->sum('amount');

            $tripExp = Trip::where('status', 'completed')
                ->whereYear('end_date', $date->year)
                ->whereMonth('end_date', $date->month)
                ->sum('total_expense');

            return [
                'month' => $date->format('M Y'),
                'amount' => $expenses + $tripExp,
            ];
        });

        $tripsPerMonth = $months->map(function ($date) {
            return [
                'month' => $date->format('M Y'),
                'count' => Trip::whereYear('start_date', $date->year)
                    ->whereMonth('start_date', $date->month)
                    ->count(),
            ];
        });

        $dieselConsumption = $months->map(function ($date) {
            return [
                'month' => $date->format('M Y'),
                'qty' => Trip::whereYear('start_date', $date->year)
                    ->whereMonth('start_date', $date->month)
                    ->sum('diesel_qty'),
            ];
        });

        $vehicleIncome = Truck::withSum(['trips as income' => function ($q) {
            $q->where('status', 'completed')
                ->whereBetween('end_date', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()]);
        }], 'total_freight')
            ->limit(10)
            ->get()
            ->map(fn ($t) => ['vehicle' => $t->truck_number, 'income' => $t->income ?? 0]);

        $driverPerformance = Driver::withCount(['trips as completed_trips' => function ($q) {
            $q->where('status', 'completed')
                ->whereBetween('end_date', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()]);
        }])
            ->withSum(['trips as total_freight' => function ($q) {
                $q->where('status', 'completed')
                    ->whereBetween('end_date', [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()]);
            }], 'total_freight')
            ->where('status', 'active')
            ->limit(10)
            ->get()
            ->map(fn ($d) => [
                'driver' => $d->name,
                'trips' => $d->completed_trips,
                'freight' => $d->total_freight ?? 0,
            ]);

        return [
            'monthly_revenue' => $monthlyRevenue,
            'monthly_expense' => $monthlyExpense,
            'trips_per_month' => $tripsPerMonth,
            'diesel_consumption' => $dieselConsumption,
            'vehicle_income' => $vehicleIncome,
            'driver_performance' => $driverPerformance,
            'trip_status' => [
                'completed' => Trip::where('status', 'completed')->count(),
                'running' => Trip::where('status', 'running')->count(),
                'pending' => Trip::where('status', 'pending')->count(),
                'cancelled' => Trip::where('status', 'cancelled')->count(),
            ],
        ];
    }

    public function getTables(): array
    {
        return [
            'running_trips' => Trip::with(['customer', 'truck', 'driver'])
                ->where('status', 'running')
                ->latest()
                ->limit(10)
                ->get(),
            'upcoming_maintenance' => MaintenanceRecord::where('status', 'scheduled')
                ->where('next_service_date', '>=', Carbon::today())
                ->orderBy('next_service_date')
                ->limit(10)
                ->get(),
            'driver_salary_due' => Salary::with('driver')
                ->where('payment_status', 'pending')
                ->latest()
                ->limit(10)
                ->get(),
            'latest_expenses' => Expense::with(['category', 'truck'])
                ->latest()
                ->limit(10)
                ->get(),
            'recent_invoices' => Invoice::with('customer')
                ->latest()
                ->limit(10)
                ->get(),
        ];
    }
}
