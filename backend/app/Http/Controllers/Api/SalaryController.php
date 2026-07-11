<?php

namespace App\Http\Controllers\Api;

use App\Models\Salary;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SalaryController extends ApiController
{
    public function __construct(private AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Salary::with('driver')->latest();

        if ($request->payment_status) {
            $query->where('payment_status', $request->payment_status);
        }
        if ($request->driver_id) {
            $query->where('driver_id', $request->driver_id);
        }
        if ($request->month) {
            $query->where('month', $request->month);
        }
        if ($request->year) {
            $query->where('year', $request->year);
        }

        return $this->success($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'driver_id' => 'required|exists:drivers,id',
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2000',
            'salary_type' => 'required|in:monthly,trip,advance,bonus,penalty,overtime',
            'base_amount' => 'nullable|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'penalty' => 'nullable|numeric|min:0',
            'overtime' => 'nullable|numeric|min:0',
            'advance_deduction' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|in:pending,paid,partial',
            'paid_date' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        $data['net_amount'] = ($data['base_amount'] ?? 0)
            + ($data['bonus'] ?? 0)
            + ($data['overtime'] ?? 0)
            - ($data['penalty'] ?? 0)
            - ($data['advance_deduction'] ?? 0);

        $salary = Salary::create($data);
        $this->auditService->log('create', 'salaries', $salary);

        return $this->success($salary->load('driver'), 'Salary created', 201);
    }

    public function show(Salary $salary): JsonResponse
    {
        return $this->success($salary->load('driver'));
    }

    public function update(Request $request, Salary $salary): JsonResponse
    {
        $data = $request->validate([
            'driver_id' => 'sometimes|exists:drivers,id',
            'month' => 'sometimes|integer|min:1|max:12',
            'year' => 'sometimes|integer|min:2000',
            'salary_type' => 'sometimes|in:monthly,trip,advance,bonus,penalty,overtime',
            'base_amount' => 'nullable|numeric|min:0',
            'bonus' => 'nullable|numeric|min:0',
            'penalty' => 'nullable|numeric|min:0',
            'overtime' => 'nullable|numeric|min:0',
            'advance_deduction' => 'nullable|numeric|min:0',
            'payment_status' => 'nullable|in:pending,paid,partial',
            'paid_date' => 'nullable|date',
            'remarks' => 'nullable|string',
        ]);

        if (isset($data['base_amount']) || isset($data['bonus']) || isset($data['penalty']) || isset($data['overtime']) || isset($data['advance_deduction'])) {
            $data['net_amount'] = ($data['base_amount'] ?? $salary->base_amount)
                + ($data['bonus'] ?? $salary->bonus)
                + ($data['overtime'] ?? $salary->overtime)
                - ($data['penalty'] ?? $salary->penalty)
                - ($data['advance_deduction'] ?? $salary->advance_deduction);
        }

        $old = $salary->toArray();
        $salary->update($data);
        $this->auditService->log('update', 'salaries', $salary, $old, $salary->toArray());

        return $this->success($salary->load('driver'), 'Salary updated');
    }

    public function destroy(Salary $salary): JsonResponse
    {
        $this->auditService->log('delete', 'salaries', $salary, $salary->toArray());
        $salary->delete();

        return $this->success(null, 'Salary deleted');
    }
}
