<?php

namespace App\Http\Controllers\Api;

use App\Models\MaintenanceRecord;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MaintenanceController extends ApiController
{
    public function __construct(private AuditService $auditService) {}

    public function index(Request $request): JsonResponse
    {
        $query = MaintenanceRecord::latest();

        if ($request->vehicle_type) {
            $query->where('vehicle_type', $request->vehicle_type);
        }
        if ($request->status) {
            $query->where('status', $request->status);
        }

        return $this->success($query->paginate($request->get('per_page', 15)));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'vehicle_type' => 'required|in:truck,hitachi',
            'vehicle_id' => 'required|integer',
            'type' => 'required|in:service,repair,tyre,battery,oil_change,engine,other',
            'service_date' => 'required|date',
            'next_service_date' => 'nullable|date',
            'current_km' => 'nullable|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'vendor' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:scheduled,completed,overdue',
        ]);

        $record = MaintenanceRecord::create($data);
        $this->auditService->log('create', 'maintenance', $record);

        return $this->success($record, 'Maintenance record created', 201);
    }

    public function show(MaintenanceRecord $maintenance): JsonResponse
    {
        return $this->success($maintenance);
    }

    public function update(Request $request, MaintenanceRecord $maintenance): JsonResponse
    {
        $data = $request->validate([
            'service_date' => 'sometimes|date',
            'next_service_date' => 'nullable|date',
            'current_km' => 'nullable|numeric|min:0',
            'cost' => 'nullable|numeric|min:0',
            'vendor' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:scheduled,completed,overdue',
        ]);

        $old = $maintenance->toArray();
        $maintenance->update($data);
        $this->auditService->log('update', 'maintenance', $maintenance, $old, $maintenance->toArray());

        return $this->success($maintenance, 'Maintenance record updated');
    }

    public function destroy(MaintenanceRecord $maintenance): JsonResponse
    {
        $this->auditService->log('delete', 'maintenance', $maintenance, $maintenance->toArray());
        $maintenance->delete();

        return $this->success(null, 'Maintenance record deleted');
    }
}
