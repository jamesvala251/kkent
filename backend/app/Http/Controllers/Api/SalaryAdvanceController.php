<?php

namespace App\Http\Controllers\Api;

use App\Models\Driver;
use App\Models\SalaryAdvance;
use App\Models\Trip;
use App\Services\AuditService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryAdvanceController extends ApiController
{
    public function __construct(private AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $query = SalaryAdvance::with('driver')->latest('advance_date')->latest('id');

        if ($request->driver_id) {
            $query->where('driver_id', $request->driver_id);
        }
        if ($request->date_from) {
            $query->whereDate('advance_date', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('advance_date', '<=', $request->date_to);
        }
        if ($request->filled('min_amount')) {
            $query->where('amount', '>=', $request->min_amount);
        }
        if ($request->filled('max_amount')) {
            $query->where('amount', '<=', $request->max_amount);
        }
        if ($request->filled('remarks')) {
            $query->where('remarks', 'like', '%'.$request->remarks.'%');
        }

        return $this->success($query->paginate($request->get('per_page', 200)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'driver_id' => 'required|exists:drivers,id',
            'advance_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'remarks' => 'nullable|string',
        ]);

        $data['status'] = 'pending';
        $data['created_by'] = auth()->id();

        $advance = SalaryAdvance::create($data);
        $this->auditService->log('create', 'salaries', $advance, null, $advance->toArray());

        return $this->success($advance->load('driver'), 'Advance salary saved', 201);
    }

    public function show(SalaryAdvance $salaryAdvance): JsonResponse
    {
        return $this->success($salaryAdvance->load('driver'));
    }

    public function update(Request $request, SalaryAdvance $salaryAdvance): JsonResponse
    {
        $data = $request->validate([
            'driver_id' => 'sometimes|exists:drivers,id',
            'advance_date' => 'sometimes|date',
            'amount' => 'sometimes|numeric|min:0.01',
            'remarks' => 'nullable|string',
        ]);

        $old = $salaryAdvance->toArray();
        $salaryAdvance->update($data);
        $this->auditService->log('update', 'salaries', $salaryAdvance, $old, $salaryAdvance->toArray());

        return $this->success($salaryAdvance->load('driver'), 'Advance salary updated');
    }

    public function destroy(SalaryAdvance $salaryAdvance): JsonResponse
    {
        $this->auditService->log('delete', 'salaries', $salaryAdvance, $salaryAdvance->toArray());
        $salaryAdvance->delete();

        return $this->success(null, 'Advance salary deleted');
    }

    public function reconcile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => ['required', 'date_format:Y-m'],
            'driver_id' => ['nullable', 'integer', 'exists:drivers,id'],
        ]);

        $start = Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth();
        $end = $start->copy()->endOfMonth();

        $drivers = Driver::query()
            ->when(! empty($validated['driver_id']), fn ($q) => $q->where('id', $validated['driver_id']))
            ->orderBy('name')
            ->get(['id', 'name']);

        $tripSalary = Trip::query()
            ->whereDate('start_date', '>=', $start->toDateString())
            ->whereDate('start_date', '<=', $end->toDateString())
            ->when(! empty($validated['driver_id']), fn ($q) => $q->where('driver_id', $validated['driver_id']))
            ->selectRaw('driver_id, COALESCE(SUM(driver_salary), 0) as total')
            ->groupBy('driver_id')
            ->pluck('total', 'driver_id');

        $advances = SalaryAdvance::query()
            ->whereDate('advance_date', '>=', $start->toDateString())
            ->whereDate('advance_date', '<=', $end->toDateString())
            ->when(! empty($validated['driver_id']), fn ($q) => $q->where('driver_id', $validated['driver_id']))
            ->selectRaw('driver_id, COALESCE(SUM(amount), 0) as total')
            ->groupBy('driver_id')
            ->pluck('total', 'driver_id');

        $rows = $drivers->map(function (Driver $driver) use ($tripSalary, $advances) {
            $trip = round((float) ($tripSalary[$driver->id] ?? 0), 2);
            $advance = round((float) ($advances[$driver->id] ?? 0), 2);

            return [
                'driver_id' => $driver->id,
                'driver_name' => $driver->name,
                'total_trip_salary' => $trip,
                'total_advanced_salary' => $advance,
                'remaining_salary' => round($trip - $advance, 2),
            ];
        })->values()->all();

        return $this->success([
            'month' => $validated['month'],
            'rows' => $rows,
        ]);
    }
}
