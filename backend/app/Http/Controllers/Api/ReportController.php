<?php

namespace App\Http\Controllers\Api;

use App\Exports\GenericReportExport;
use App\Models\CompanySetting;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\MaintenanceRecord;
use App\Models\Salary;
use App\Models\Trip;
use App\Services\ReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportController extends ApiController
{
    private const REPORT_TYPES = ['trip_summary', 'profit_loss', 'expense', 'salary', 'invoice', 'fleet'];

    public function generate(Request $request, ReportService $reportService): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(self::REPORT_TYPES)],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
        ]);

        $report = $reportService->generate(
            $validated['type'],
            $validated['date_from'],
            $validated['date_to']
        );

        return $this->success($report);
    }

    public function export(Request $request, ReportService $reportService): BinaryFileResponse|Response|JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', Rule::in(self::REPORT_TYPES)],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'format' => ['required', Rule::in(['pdf', 'excel'])],
        ]);

        $report = $reportService->generate(
            $validated['type'],
            $validated['date_from'],
            $validated['date_to']
        );

        $extension = $validated['format'] === 'excel' ? 'xlsx' : 'pdf';
        $filename = $reportService->exportFilename($validated['type'], $extension);

        if ($validated['format'] === 'pdf') {
            $settings = CompanySetting::first();
            $pdf = Pdf::loadView('reports.pdf', compact('report', 'settings'));

            return $pdf->download($filename);
        }

        $headings = collect($report['columns'])->pluck('label')->all();
        $rows = collect($report['rows'])->map(function ($row) use ($report) {
            return collect($report['columns'])->map(fn ($col) => $row[$col['key']] ?? '')->all();
        })->all();

        return Excel::download(
            new GenericReportExport($headings, $rows, $report['title']),
            $filename
        );
    }

    public function dailyTrips(Request $request): JsonResponse
    {
        $date = $request->get('date', Carbon::today()->toDateString());

        return $this->success(
            Trip::with(['customer', 'truck', 'driver'])
                ->whereDate('start_date', $date)
                ->get()
        );
    }

    public function monthlyTrips(Request $request): JsonResponse
    {
        $month = $request->get('month', Carbon::now()->month);
        $year = $request->get('year', Carbon::now()->year);

        return $this->success(
            Trip::with(['customer', 'truck', 'driver'])
                ->whereYear('start_date', $year)
                ->whereMonth('start_date', $month)
                ->get()
        );
    }

    public function vehicleTrips(Request $request): JsonResponse
    {
        $query = Trip::with(['customer', 'driver', 'truck']);

        if ($request->truck_id) {
            $query->where('truck_id', $request->truck_id);
        }

        return $this->success($query->paginate($request->get('per_page', 50)));
    }

    public function customerTrips(Request $request): JsonResponse
    {
        $query = Trip::with(['truck', 'driver', 'customer']);

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        return $this->success($query->paginate($request->get('per_page', 50)));
    }

    public function driverTrips(Request $request): JsonResponse
    {
        $query = Trip::with(['truck', 'driver', 'customer']);

        if ($request->driver_id) {
            $query->where('driver_id', $request->driver_id);
        }

        return $this->success($query->paginate($request->get('per_page', 50)));
    }

    public function profit(Request $request): JsonResponse
    {
        $query = Trip::where('status', 'completed');

        if ($request->date_from) {
            $query->whereDate('end_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('end_date', '<=', $request->date_to);
        }

        $trips = $query->get();

        return $this->success([
            'total_freight' => $trips->sum('total_freight'),
            'total_expense' => $trips->sum('total_expense'),
            'total_profit' => $trips->sum('profit'),
            'trips' => $trips,
        ]);
    }

    public function expenses(Request $request): JsonResponse
    {
        $query = Expense::with('category');

        if ($request->date_from) {
            $query->whereDate('expense_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('expense_date', '<=', $request->date_to);
        }

        return $this->success([
            'total' => (clone $query)->sum('amount'),
            'expenses' => $query->paginate($request->get('per_page', 50)),
        ]);
    }

    public function dieselConsumption(Request $request): JsonResponse
    {
        $query = Trip::query();

        if ($request->date_from) {
            $query->whereDate('start_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('start_date', '<=', $request->date_to);
        }

        return $this->success([
            'total_qty' => $query->sum('diesel_qty'),
            'total_amount' => $query->sum('diesel_amount'),
            'trips' => $query->with('truck')->paginate($request->get('per_page', 50)),
        ]);
    }

    public function salary(Request $request): JsonResponse
    {
        $query = Salary::with('driver');

        if ($request->payment_status) {
            $query->where('payment_status', $request->payment_status);
        }

        return $this->success($query->paginate($request->get('per_page', 50)));
    }

    public function outstanding(Request $request): JsonResponse
    {
        $invoices = Invoice::with('customer')
            ->whereIn('payment_status', ['pending', 'partial', 'overdue'])
            ->get();

        return $this->success([
            'total_outstanding' => $invoices->sum(fn ($i) => $i->total_amount - $i->paid_amount),
            'invoices' => $invoices,
        ]);
    }

    public function invoices(Request $request): JsonResponse
    {
        $query = Invoice::with('customer');

        if ($request->payment_status) {
            $query->where('payment_status', $request->payment_status);
        }

        return $this->success($query->paginate($request->get('per_page', 50)));
    }

    public function maintenance(Request $request): JsonResponse
    {
        $query = MaintenanceRecord::query();

        if ($request->vehicle_type) {
            $query->where('vehicle_type', $request->vehicle_type);
        }

        return $this->success([
            'total_cost' => (clone $query)->sum('cost'),
            'records' => $query->paginate($request->get('per_page', 50)),
        ]);
    }
}
