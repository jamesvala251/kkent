<?php

namespace App\Http\Controllers\Api;

use App\Repositories\DriverRepository;
use App\Services\AuditService;
use App\Services\BaseCrudService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends ApiController
{
    private BaseCrudService $service;

    public function __construct(DriverRepository $repository, AuditService $auditService)
    {
        $this->service = new class($repository, $auditService, 'drivers') extends BaseCrudService {};
    }

    public function index(Request $request): JsonResponse
    {
        return $this->success($this->service->list($request->all()));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'photo' => 'nullable|string',
            'mobile' => 'required|string|max:20',
            'address' => 'nullable|string',
            'aadhaar' => 'nullable|string|max:20',
            'license_number' => 'nullable|string|max:50',
            'license_expiry' => 'nullable|date',
            'joining_date' => 'nullable|date',
            'salary_type' => 'nullable|in:monthly,per_trip,both',
            'monthly_salary' => 'nullable|numeric|min:0',
            'per_trip_salary' => 'nullable|numeric|min:0',
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string|max:50',
            'bank_ifsc' => 'nullable|string|max:20',
            'emergency_contact' => 'nullable|string|max:20',
            'assigned_truck_id' => 'nullable|exists:trucks,id',
            'status' => 'nullable|in:active,inactive,on_leave',
        ]);

        return $this->success($this->service->create($data), 'Driver created', 201);
    }

    public function show(int $driver): JsonResponse
    {
        return $this->success($this->service->find($driver)->load('assignedTruck', 'documents'));
    }

    public function update(Request $request, int $driver): JsonResponse
    {
        $model = $this->service->find($driver);
        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'photo' => 'nullable|string',
            'mobile' => 'sometimes|string|max:20',
            'address' => 'nullable|string',
            'aadhaar' => 'nullable|string|max:20',
            'license_number' => 'nullable|string|max:50',
            'license_expiry' => 'nullable|date',
            'joining_date' => 'nullable|date',
            'salary_type' => 'nullable|in:monthly,per_trip,both',
            'monthly_salary' => 'nullable|numeric|min:0',
            'per_trip_salary' => 'nullable|numeric|min:0',
            'bank_name' => 'nullable|string|max:255',
            'bank_account' => 'nullable|string|max:50',
            'bank_ifsc' => 'nullable|string|max:20',
            'emergency_contact' => 'nullable|string|max:20',
            'assigned_truck_id' => 'nullable|exists:trucks,id',
            'status' => 'nullable|in:active,inactive,on_leave',
        ]);

        return $this->success($this->service->update($model, $data), 'Driver updated');
    }

    public function destroy(int $driver): JsonResponse
    {
        $this->service->delete($this->service->find($driver));

        return $this->success(null, 'Driver deleted');
    }
}
