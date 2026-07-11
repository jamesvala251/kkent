<?php

namespace App\Http\Controllers\Api;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Repositories\ExpenseRepository;
use App\Services\AuditService;
use App\Services\BaseCrudService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ExpenseController extends ApiController
{
    private BaseCrudService $service;

    public function __construct(ExpenseRepository $repository, AuditService $auditService)
    {
        $this->service = new class($repository, $auditService, 'expenses') extends BaseCrudService {};
    }

    public function index(Request $request): JsonResponse
    {
        return $this->success($this->service->list($request->all()));
    }

    public function categories(): JsonResponse
    {
        return $this->success(ExpenseCategory::where('is_active', true)->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'expense_date' => 'required|date',
            'truck_id' => 'nullable|exists:trucks,id',
            'driver_id' => 'nullable|exists:drivers,id',
            'trip_id' => 'nullable|exists:trips,id',
            'category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'bill' => 'nullable|file|max:5120',
        ]);

        if ($request->hasFile('bill')) {
            $data['bill_path'] = $request->file('bill')->store('bills', 'public');
        }
        unset($data['bill']);

        return $this->success($this->service->create($data)->load('category'), 'Expense created', 201);
    }

    public function show(Expense $expense): JsonResponse
    {
        return $this->success($expense->load(['category', 'truck', 'driver', 'trip']));
    }

    public function update(Request $request, Expense $expense): JsonResponse
    {
        $data = $request->validate([
            'expense_date' => 'sometimes|date',
            'truck_id' => 'nullable|exists:trucks,id',
            'driver_id' => 'nullable|exists:drivers,id',
            'trip_id' => 'nullable|exists:trips,id',
            'category_id' => 'sometimes|exists:expense_categories,id',
            'amount' => 'sometimes|numeric|min:0',
            'description' => 'nullable|string',
            'bill' => 'nullable|file|max:5120',
        ]);

        if ($request->hasFile('bill')) {
            if ($expense->bill_path) {
                Storage::disk('public')->delete($expense->bill_path);
            }
            $data['bill_path'] = $request->file('bill')->store('bills', 'public');
        }
        unset($data['bill']);

        return $this->success($this->service->update($expense, $data)->load('category'), 'Expense updated');
    }

    public function destroy(Expense $expense): JsonResponse
    {
        $this->service->delete($expense);

        return $this->success(null, 'Expense deleted');
    }
}
