<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Driver;
use App\Models\Expense;
use App\Models\HitachiRental;
use App\Models\Invoice;
use App\Models\SalaryAdvance;
use App\Models\Trip;
use App\Models\Truck;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ReportService
{
    public function generate(string $type, string $dateFrom, string $dateTo, ?int $customerId = null): array
    {
        return match ($type) {
            'trip_summary' => $this->tripSummary($dateFrom, $dateTo),
            'profit_loss' => $this->profitLoss($dateFrom, $dateTo),
            'expense' => $this->expenseReport($dateFrom, $dateTo),
            'salary' => $this->salaryReport($dateFrom, $dateTo),
            'invoice' => $this->invoiceReport($dateFrom, $dateTo),
            'fleet' => $this->fleetReport($dateFrom, $dateTo),
            'customer_wise' => $this->customerWiseReport($dateFrom, $dateTo, $customerId),
            default => throw new \InvalidArgumentException('Invalid report type'),
        };
    }

    private function tripSummary(string $dateFrom, string $dateTo): array
    {
        $trips = Trip::with(['customer', 'truck', 'driver'])
            ->whereDate('start_date', '>=', $dateFrom)
            ->whereDate('start_date', '<=', $dateTo)
            ->orderBy('start_date')
            ->get();

        $rows = $trips->map(fn ($t) => [
            'trip_number' => $t->trip_number,
            'start_date' => $t->start_date?->format('Y-m-d'),
            'from_location' => $t->from_location,
            'to_location' => $t->to_location,
            'customer' => $t->customer?->name ?? '-',
            'truck' => $t->truck?->truck_number ?? '-',
            'driver' => $t->driver?->name ?? '-',
            'total_freight' => (float) $t->total_freight,
            'total_expense' => (float) $t->total_expense,
            'profit' => (float) $t->profit,
        ])->values()->all();

        return [
            'title' => 'Trip Summary Report',
            'type' => 'trip_summary',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => [
                ['label' => 'Total Trips', 'value' => $trips->count()],
                ['label' => 'Total Freight', 'value' => round($trips->sum('total_freight'), 2)],
                ['label' => 'Total Expenses', 'value' => round($trips->sum('total_expense'), 2)],
                ['label' => 'Total Profit', 'value' => round($trips->sum('profit'), 2)],
            ],
            'columns' => [
                ['key' => 'trip_number', 'label' => 'Trip #'],
                ['key' => 'start_date', 'label' => 'Date'],
                ['key' => 'from_location', 'label' => 'From'],
                ['key' => 'to_location', 'label' => 'To'],
                ['key' => 'customer', 'label' => 'Customer'],
                ['key' => 'truck', 'label' => 'Truck'],
                ['key' => 'total_freight', 'label' => 'Freight', 'format' => 'currency'],
                ['key' => 'total_expense', 'label' => 'Expense', 'format' => 'currency'],
                ['key' => 'profit', 'label' => 'Profit', 'format' => 'currency'],
            ],
            'rows' => $rows,
            'chart' => $this->weeklyChart($trips, 'start_date', 'profit', 'Profit by Week'),
        ];
    }

    private function profitLoss(string $dateFrom, string $dateTo): array
    {
        $trips = Trip::whereDate('start_date', '>=', $dateFrom)
            ->whereDate('start_date', '<=', $dateTo)
            ->get();

        $expenses = Expense::whereDate('expense_date', '>=', $dateFrom)
            ->whereDate('expense_date', '<=', $dateTo)
            ->sum('amount');

        $rentalRevenue = HitachiRental::where('status', 'completed')
            ->whereDate('end_date', '>=', $dateFrom)
            ->whereDate('end_date', '<=', $dateTo)
            ->sum('total_amount');

        $totalFreight = $trips->sum('total_freight') + $rentalRevenue;
        $totalExpense = $expenses;
        $netProfit = $totalFreight - $totalExpense;

        $rows = $trips->map(fn ($t) => [
            'trip_number' => $t->trip_number,
            'end_date' => $t->end_date?->format('Y-m-d'),
            'total_freight' => (float) $t->total_freight,
            'total_expense' => (float) $t->total_expense,
            'profit' => (float) $t->profit,
        ])->values()->all();

        return [
            'title' => 'Profit & Loss Report',
            'type' => 'profit_loss',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => [
                ['label' => 'Revenue (Freight + Rentals)', 'value' => round($totalFreight, 2)],
                ['label' => 'Operating Expenses', 'value' => round($expenses, 2)],
                ['label' => 'Net Profit', 'value' => round($netProfit, 2)],
            ],
            'columns' => [
                ['key' => 'trip_number', 'label' => 'Trip #'],
                ['key' => 'end_date', 'label' => 'End Date'],
                ['key' => 'total_freight', 'label' => 'Freight', 'format' => 'currency'],
                ['key' => 'total_expense', 'label' => 'Expense', 'format' => 'currency'],
                ['key' => 'profit', 'label' => 'Profit', 'format' => 'currency'],
            ],
            'rows' => $rows,
            'chart' => [
                'categories' => ['Revenue', 'Expenses', 'Net Profit'],
                'series' => [
                    ['name' => 'Amount', 'data' => [round($totalFreight, 2), round($totalExpense, 2), round($netProfit, 2)]],
                ],
            ],
        ];
    }

    private function expenseReport(string $dateFrom, string $dateTo): array
    {
        $expenses = Expense::with('category')
            ->whereDate('expense_date', '>=', $dateFrom)
            ->whereDate('expense_date', '<=', $dateTo)
            ->orderBy('expense_date')
            ->get();

        $rows = $expenses->map(fn ($e) => [
            'expense_date' => $e->expense_date?->format('Y-m-d'),
            'category' => $e->category?->name ?? '-',
            'description' => $e->description ?? '-',
            'amount' => (float) $e->amount,
        ])->values()->all();

        $byCategory = $expenses->groupBy(fn ($e) => $e->category?->name ?? 'Other')
            ->map(fn ($items, $cat) => ['category' => $cat, 'total' => round($items->sum('amount'), 2)])
            ->values();

        return [
            'title' => 'Expense Report',
            'type' => 'expense',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => [
                ['label' => 'Total Expenses', 'value' => round($expenses->sum('amount'), 2)],
                ['label' => 'Transactions', 'value' => $expenses->count()],
                ['label' => 'Categories', 'value' => $byCategory->count()],
            ],
            'columns' => [
                ['key' => 'expense_date', 'label' => 'Date'],
                ['key' => 'category', 'label' => 'Category'],
                ['key' => 'description', 'label' => 'Description'],
                ['key' => 'amount', 'label' => 'Amount', 'format' => 'currency'],
            ],
            'rows' => $rows,
            'chart' => [
                'categories' => $byCategory->pluck('category')->all(),
                'series' => [
                    ['name' => 'Amount', 'data' => $byCategory->pluck('total')->all()],
                ],
            ],
        ];
    }

    private function salaryReport(string $dateFrom, string $dateTo): array
    {
        $from = Carbon::parse($dateFrom)->startOfDay();
        $to = Carbon::parse($dateTo)->endOfDay();
        $months = max(1, $from->copy()->startOfMonth()->diffInMonths($to->copy()->startOfMonth()) + 1);

        $drivers = Driver::query()->orderBy('name')->get(['id', 'name', 'salary_type', 'monthly_salary']);

        $tripSalary = Trip::query()
            ->whereDate('start_date', '>=', $from->toDateString())
            ->whereDate('start_date', '<=', $to->toDateString())
            ->selectRaw('driver_id, COALESCE(SUM(driver_salary), 0) as total')
            ->groupBy('driver_id')
            ->pluck('total', 'driver_id');

        $advances = SalaryAdvance::query()
            ->whereDate('advance_date', '>=', $from->toDateString())
            ->whereDate('advance_date', '<=', $to->toDateString())
            ->selectRaw('driver_id, COALESCE(SUM(amount), 0) as total')
            ->groupBy('driver_id')
            ->pluck('total', 'driver_id');

        $rows = $drivers->map(function (Driver $driver) use ($tripSalary, $advances, $months) {
            $monthly = round((float) ($driver->monthly_salary ?? 0) * $months, 2);
            $trip = round((float) ($tripSalary[$driver->id] ?? 0), 2);
            $advance = round((float) ($advances[$driver->id] ?? 0), 2);
            $type = $driver->salary_type ?: 'monthly';
            $earned = match ($type) {
                'per_trip' => $trip,
                'both' => round($monthly + $trip, 2),
                default => $monthly,
            };

            return [
                'driver' => $driver->name,
                'salary_type' => $type,
                'earned_salary' => $earned,
                'advanced_salary' => $advance,
                'remaining_salary' => round($earned - $advance, 2),
            ];
        })->filter(fn ($row) => $row['earned_salary'] > 0 || $row['advanced_salary'] > 0)
            ->values();

        $top = $rows->sortByDesc('earned_salary')->take(10);

        return [
            'title' => 'Salary Report',
            'type' => 'salary',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => [
                ['label' => 'Drivers', 'value' => $rows->count()],
                ['label' => 'Total Salary', 'value' => round($rows->sum('earned_salary'), 2)],
                ['label' => 'Total Advances', 'value' => round($rows->sum('advanced_salary'), 2)],
                ['label' => 'Remaining', 'value' => round($rows->sum('remaining_salary'), 2)],
            ],
            'columns' => [
                ['key' => 'driver', 'label' => 'Driver'],
                ['key' => 'salary_type', 'label' => 'Type'],
                ['key' => 'earned_salary', 'label' => 'Earned', 'format' => 'currency'],
                ['key' => 'advanced_salary', 'label' => 'Advances', 'format' => 'currency'],
                ['key' => 'remaining_salary', 'label' => 'Remaining', 'format' => 'currency'],
            ],
            'rows' => $rows->all(),
            'chart' => [
                'categories' => $top->pluck('driver')->values()->all(),
                'series' => [
                    ['name' => 'Earned Salary', 'data' => $top->pluck('earned_salary')->values()->all()],
                ],
            ],
        ];
    }

    private function invoiceReport(string $dateFrom, string $dateTo): array
    {
        $invoices = Invoice::with('customer')
            ->whereDate('invoice_date', '>=', $dateFrom)
            ->whereDate('invoice_date', '<=', $dateTo)
            ->orderBy('invoice_date')
            ->get();

        $rows = $invoices->map(fn ($i) => [
            'invoice_number' => $i->invoice_number,
            'invoice_date' => $i->invoice_date?->format('Y-m-d'),
            'customer' => $i->customer?->name ?? '-',
            'subtotal' => (float) $i->subtotal,
            'total_amount' => (float) $i->total_amount,
            'paid_amount' => (float) $i->paid_amount,
            'balance' => (float) $i->total_amount - (float) $i->paid_amount,
        ])->values()->all();

        return [
            'title' => 'Invoice Report',
            'type' => 'invoice',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => [
                ['label' => 'Total Invoices', 'value' => $invoices->count()],
                ['label' => 'Total Billed', 'value' => round($invoices->sum('total_amount'), 2)],
                ['label' => 'Outstanding', 'value' => round($invoices->sum(fn ($i) => $i->total_amount - $i->paid_amount), 2)],
            ],
            'columns' => [
                ['key' => 'invoice_number', 'label' => 'Invoice #'],
                ['key' => 'invoice_date', 'label' => 'Date'],
                ['key' => 'customer', 'label' => 'Customer'],
                ['key' => 'total_amount', 'label' => 'Total', 'format' => 'currency'],
                ['key' => 'paid_amount', 'label' => 'Paid', 'format' => 'currency'],
                ['key' => 'balance', 'label' => 'Balance', 'format' => 'currency'],
            ],
            'rows' => $rows,
            'chart' => $this->weeklyChart($invoices, 'invoice_date', 'total_amount', 'Invoices by Week'),
        ];
    }

    private function fleetReport(string $dateFrom, string $dateTo): array
    {
        $trips = Trip::with('truck')
            ->whereDate('start_date', '>=', $dateFrom)
            ->whereDate('start_date', '<=', $dateTo)
            ->get();

        $grouped = $trips->groupBy('truck_id')->map(function ($items, $truckId) {
            $truck = $items->first()->truck;

            return [
                'truck' => $truck?->truck_number ?? "Truck #{$truckId}",
                'trip_count' => $items->count(),
                'total_km' => round($items->sum('total_km'), 2),
                'total_freight' => round($items->sum('total_freight'), 2),
                'total_profit' => round($items->sum('profit'), 2),
            ];
        })->sortByDesc('trip_count')->values();

        $rows = $grouped->all();
        $activeTrucks = Truck::where('status', 'active')->count();

        return [
            'title' => 'Fleet Utilization Report',
            'type' => 'fleet',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => [
                ['label' => 'Active Trucks', 'value' => $activeTrucks],
                ['label' => 'Trucks Used', 'value' => $grouped->count()],
                ['label' => 'Total Trips', 'value' => $trips->count()],
            ],
            'columns' => [
                ['key' => 'truck', 'label' => 'Truck'],
                ['key' => 'trip_count', 'label' => 'Trips'],
                ['key' => 'total_km', 'label' => 'Total KM'],
                ['key' => 'total_freight', 'label' => 'Freight', 'format' => 'currency'],
                ['key' => 'total_profit', 'label' => 'Profit', 'format' => 'currency'],
            ],
            'rows' => $rows,
            'chart' => [
                'categories' => $grouped->take(10)->pluck('truck')->all(),
                'series' => [
                    ['name' => 'Trips', 'data' => $grouped->take(10)->pluck('trip_count')->all()],
                ],
            ],
        ];
    }

    private function customerWiseReport(string $dateFrom, string $dateTo, ?int $customerId = null): array
    {
        if ($customerId) {
            return $this->specificCustomerReport($dateFrom, $dateTo, $customerId);
        }

        $trips = Trip::with('customer')
            ->whereDate('start_date', '>=', $dateFrom)
            ->whereDate('start_date', '<=', $dateTo)
            ->get();

        $invoices = Invoice::with('customer')
            ->whereDate('invoice_date', '>=', $dateFrom)
            ->whereDate('invoice_date', '<=', $dateTo)
            ->get();

        $customerIds = $trips->pluck('customer_id')
            ->merge($invoices->pluck('customer_id'))
            ->unique()
            ->filter()
            ->values();

        $rows = $customerIds->map(function ($id) use ($trips, $invoices) {
            $customerTrips = $trips->where('customer_id', $id);
            $customerInvoices = $invoices->where('customer_id', $id);
            $customer = $customerTrips->first()?->customer ?? $customerInvoices->first()?->customer;

            return [
                'customer' => $customer?->name ?? "Customer #{$id}",
                'mobile' => $customer?->mobile ?? '-',
                'trip_count' => $customerTrips->count(),
                'total_freight' => round($customerTrips->sum('total_freight'), 2),
                'total_billed' => round($customerInvoices->sum('total_amount'), 2),
                'total_paid' => round($customerInvoices->sum('paid_amount'), 2),
                'outstanding' => round($customerInvoices->sum(fn ($i) => $i->total_amount - $i->paid_amount), 2),
            ];
        })->sortByDesc('total_freight')->values()->all();

        $grouped = collect($rows);

        return [
            'title' => 'Customer Wise Report',
            'type' => 'customer_wise',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => [
                ['label' => 'Customers', 'value' => $grouped->count()],
                ['label' => 'Total Trips', 'value' => $trips->count()],
                ['label' => 'Total Ton', 'value' => round($trips->sum('total_freight'), 2)],
                ['label' => 'Total Billed', 'value' => round($invoices->sum('total_amount'), 2)],
                ['label' => 'Outstanding', 'value' => round($invoices->sum(fn ($i) => $i->total_amount - $i->paid_amount), 2)],
            ],
            'columns' => [
                ['key' => 'customer', 'label' => 'Customer'],
                ['key' => 'mobile', 'label' => 'Mobile'],
                ['key' => 'trip_count', 'label' => 'Trips'],
                ['key' => 'total_freight', 'label' => 'Ton', 'format' => 'currency'],
                ['key' => 'total_billed', 'label' => 'Billed', 'format' => 'currency'],
                ['key' => 'total_paid', 'label' => 'Paid', 'format' => 'currency'],
                ['key' => 'outstanding', 'label' => 'Outstanding', 'format' => 'currency'],
            ],
            'rows' => $rows,
            'chart' => [
                'categories' => $grouped->take(10)->pluck('customer')->all(),
                'series' => [
                    ['name' => 'Ton', 'data' => $grouped->take(10)->pluck('total_freight')->all()],
                ],
            ],
        ];
    }

    private function specificCustomerReport(string $dateFrom, string $dateTo, int $customerId): array
    {
        $customer = Customer::find($customerId);
        $customerName = $customer?->name ?? "Customer #{$customerId}";

        $trips = Trip::with(['truck', 'driver'])
            ->where('customer_id', $customerId)
            ->whereDate('start_date', '>=', $dateFrom)
            ->whereDate('start_date', '<=', $dateTo)
            ->orderBy('start_date')
            ->get();

        $invoices = Invoice::where('customer_id', $customerId)
            ->whereDate('invoice_date', '>=', $dateFrom)
            ->whereDate('invoice_date', '<=', $dateTo)
            ->get();

        $rows = $trips->map(fn ($t) => [
            'trip_number' => $t->trip_number,
            'start_date' => $t->start_date?->format('Y-m-d'),
            'from_location' => $t->from_location ?: '-',
            'to_location' => $t->to_location ?: '-',
            'truck' => $t->truck?->truck_number ?? '-',
            'driver' => $t->driver?->name ?? '-',
            'total_freight' => (float) $t->total_freight,
        ])->values()->all();

        return [
            'title' => "Customer Wise Report — {$customerName}",
            'type' => 'customer_wise',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => [
                ['label' => 'Customer', 'value' => $customerName],
                ['label' => 'Total Trips', 'value' => $trips->count()],
                ['label' => 'Total Ton', 'value' => round($trips->sum('total_freight'), 2)],
                ['label' => 'Total Billed', 'value' => round($invoices->sum('total_amount'), 2)],
                ['label' => 'Outstanding', 'value' => round($invoices->sum(fn ($i) => $i->total_amount - $i->paid_amount), 2)],
            ],
            'columns' => [
                ['key' => 'trip_number', 'label' => 'Trip #'],
                ['key' => 'start_date', 'label' => 'Date'],
                ['key' => 'from_location', 'label' => 'From'],
                ['key' => 'to_location', 'label' => 'To'],
                ['key' => 'truck', 'label' => 'Truck'],
                ['key' => 'driver', 'label' => 'Driver'],
                ['key' => 'total_freight', 'label' => 'Ton', 'format' => 'currency'],
            ],
            'rows' => $rows,
            'chart' => $this->weeklyChart($trips, 'start_date', 'total_freight', 'Ton by Day'),
        ];
    }

    private function weeklyChart(Collection $items, string $dateField, string $valueField, string $seriesName): array
    {
        if ($items->isEmpty()) {
            return ['categories' => [], 'series' => [['name' => $seriesName, 'data' => []]]];
        }

        $grouped = $items->groupBy(function ($item) use ($dateField) {
            $date = $item->{$dateField};
            if (! $date) {
                return 'Unknown';
            }

            return Carbon::parse($date)->format('d M');
        });

        return [
            'categories' => $grouped->keys()->values()->all(),
            'series' => [
                [
                    'name' => $seriesName,
                    'data' => $grouped->map(fn ($group) => round($group->sum($valueField), 2))->values()->all(),
                ],
            ],
        ];
    }

    public function exportFilename(string $type, string $format): string
    {
        return "{$type}_".now()->format('Ymd_His').".{$format}";
    }
}
