<?php

namespace App\Services;

use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Salary;
use App\Models\Trip;
use App\Models\Truck;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class ReportService
{
    public function generate(string $type, string $dateFrom, string $dateTo): array
    {
        return match ($type) {
            'trip_summary' => $this->tripSummary($dateFrom, $dateTo),
            'profit_loss' => $this->profitLoss($dateFrom, $dateTo),
            'expense' => $this->expenseReport($dateFrom, $dateTo),
            'salary' => $this->salaryReport($dateFrom, $dateTo),
            'invoice' => $this->invoiceReport($dateFrom, $dateTo),
            'fleet' => $this->fleetReport($dateFrom, $dateTo),
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
            'status' => $t->status,
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
                ['key' => 'status', 'label' => 'Status'],
            ],
            'rows' => $rows,
            'chart' => $this->weeklyChart($trips, 'start_date', 'profit', 'Profit by Week'),
        ];
    }

    private function profitLoss(string $dateFrom, string $dateTo): array
    {
        $trips = Trip::where('status', 'completed')
            ->whereDate('end_date', '>=', $dateFrom)
            ->whereDate('end_date', '<=', $dateTo)
            ->get();

        $expenses = Expense::whereDate('expense_date', '>=', $dateFrom)
            ->whereDate('expense_date', '<=', $dateTo)
            ->sum('amount');

        $tripExpense = $trips->sum('total_expense');
        $totalFreight = $trips->sum('total_freight');
        $totalExpense = $expenses + $tripExpense;
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
                ['label' => 'Revenue (Freight)', 'value' => round($totalFreight, 2)],
                ['label' => 'Trip Expenses', 'value' => round($tripExpense, 2)],
                ['label' => 'Other Expenses', 'value' => round($expenses, 2)],
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
        $from = Carbon::parse($dateFrom);
        $to = Carbon::parse($dateTo);

        $salaries = Salary::with('driver')
            ->where(function ($q) use ($from, $to) {
                $q->where(function ($inner) use ($from, $to) {
                    $inner->where('year', '>', $from->year)
                        ->orWhere(function ($y) use ($from) {
                            $y->where('year', $from->year)->where('month', '>=', $from->month);
                        });
                })->where(function ($inner) use ($from, $to) {
                    $inner->where('year', '<', $to->year)
                        ->orWhere(function ($y) use ($to) {
                            $y->where('year', $to->year)->where('month', '<=', $to->month);
                        });
                });
            })
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();

        $rows = $salaries->map(fn ($s) => [
            'driver' => $s->driver?->name ?? '-',
            'period' => sprintf('%02d/%d', $s->month, $s->year),
            'salary_type' => $s->salary_type,
            'base_amount' => (float) $s->base_amount,
            'bonus' => (float) $s->bonus,
            'penalty' => (float) $s->penalty,
            'net_amount' => (float) $s->net_amount,
            'payment_status' => $s->payment_status,
        ])->values()->all();

        $byDriver = $salaries->groupBy('driver_id')
            ->map(fn ($items) => round($items->sum('net_amount'), 2))
            ->sortDesc()
            ->take(10);

        return [
            'title' => 'Salary Report',
            'type' => 'salary',
            'date_from' => $dateFrom,
            'date_to' => $dateTo,
            'summary' => [
                ['label' => 'Total Records', 'value' => $salaries->count()],
                ['label' => 'Total Net Salary', 'value' => round($salaries->sum('net_amount'), 2)],
                ['label' => 'Paid', 'value' => $salaries->where('payment_status', 'paid')->count()],
            ],
            'columns' => [
                ['key' => 'driver', 'label' => 'Driver'],
                ['key' => 'period', 'label' => 'Period'],
                ['key' => 'salary_type', 'label' => 'Type'],
                ['key' => 'base_amount', 'label' => 'Base', 'format' => 'currency'],
                ['key' => 'net_amount', 'label' => 'Net', 'format' => 'currency'],
                ['key' => 'payment_status', 'label' => 'Status'],
            ],
            'rows' => $rows,
            'chart' => [
                'categories' => $salaries->take(10)->map(fn ($s) => $s->driver?->name ?? 'Driver')->values()->all(),
                'series' => [
                    ['name' => 'Net Salary', 'data' => $salaries->take(10)->map(fn ($s) => (float) $s->net_amount)->values()->all()],
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
            'payment_status' => $i->payment_status,
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
                ['key' => 'payment_status', 'label' => 'Status'],
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
