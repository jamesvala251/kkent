<?php

namespace App\Http\Controllers\Api;

use App\Repositories\TruckRepository;
use App\Services\AuditService;
use App\Services\BaseCrudService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TruckController extends ApiController
{
    private BaseCrudService $service;

    public function __construct(TruckRepository $repository, AuditService $auditService)
    {
        $this->service = new class($repository, $auditService, 'trucks') extends BaseCrudService {};
    }

    public function index(Request $request): JsonResponse
    {
        return $this->success($this->service->list($request->all()));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'truck_number' => 'required|string|unique:trucks,truck_number',
            'rc_number' => 'nullable|string|max:50',
            'insurance_expiry' => 'nullable|date',
            'fitness_expiry' => 'nullable|date',
            'permit_expiry' => 'nullable|date',
            'puc_expiry' => 'nullable|date',
            'tax_expiry' => 'nullable|date',
            'model' => 'nullable|string|max:100',
            'brand' => 'nullable|string|max:100',
            'year' => 'nullable|integer|min:1900|max:2100',
            'capacity' => 'nullable|string|max:50',
            'owner' => 'nullable|string|max:255',
            'fuel_type' => 'nullable|in:diesel,petrol,cng,electric',
            'gps_number' => 'nullable|string|max:50',
            'current_km' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive,maintenance,breakdown',
        ]);

        return $this->success($this->service->create($data), 'Truck created', 201);
    }

    public function show(int $truck): JsonResponse
    {
        return $this->success($this->service->find($truck)->load('documents'));
    }

    public function update(Request $request, int $truck): JsonResponse
    {
        $model = $this->service->find($truck);
        $data = $request->validate([
            'truck_number' => 'sometimes|string|unique:trucks,truck_number,'.$truck,
            'rc_number' => 'nullable|string|max:50',
            'insurance_expiry' => 'nullable|date',
            'fitness_expiry' => 'nullable|date',
            'permit_expiry' => 'nullable|date',
            'puc_expiry' => 'nullable|date',
            'tax_expiry' => 'nullable|date',
            'model' => 'nullable|string|max:100',
            'brand' => 'nullable|string|max:100',
            'year' => 'nullable|integer|min:1900|max:2100',
            'capacity' => 'nullable|string|max:50',
            'owner' => 'nullable|string|max:255',
            'fuel_type' => 'nullable|in:diesel,petrol,cng,electric',
            'gps_number' => 'nullable|string|max:50',
            'current_km' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive,maintenance,breakdown',
        ]);

        return $this->success($this->service->update($model, $data), 'Truck updated');
    }

    public function destroy(int $truck): JsonResponse
    {
        $this->service->delete($this->service->find($truck));

        return $this->success(null, 'Truck deleted');
    }
}
