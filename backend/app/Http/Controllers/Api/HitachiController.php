<?php

namespace App\Http\Controllers\Api;

use App\Http\Resources\HitachiMachineResource;
use App\Http\Resources\HitachiRentalResource;
use App\Models\HitachiRental;
use App\Repositories\HitachiRepository;
use App\Services\AuditService;
use App\Services\BaseCrudService;
use App\Services\HitachiRentalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HitachiController extends ApiController
{
    private BaseCrudService $service;

    public function __construct(
        HitachiRepository $repository,
        AuditService $auditService,
        private HitachiRentalService $rentalService
    ) {
        $this->service = new class($repository, $auditService, 'hitachi') extends BaseCrudService {};
    }

    public function index(Request $request): JsonResponse
    {
        $machines = $this->service->list($request->all());
        $machines->load(['activeRental.customer']);

        return $this->success(HitachiMachineResource::collection($machines)->response()->getData(true));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'machine_number' => 'required|string|unique:hitachi_machines,machine_number',
            'registration_number' => 'nullable|string|max:50',
            'model' => 'nullable|string|max:100',
            'owner' => 'nullable|string|max:255',
            'engine_number' => 'nullable|string|max:100',
            'chassis_number' => 'nullable|string|max:100',
            'purchase_date' => 'nullable|date',
            'current_hours' => 'nullable|numeric|min:0',
            'current_km' => 'nullable|numeric|min:0',
            'fuel_type' => 'nullable|in:diesel,petrol,cng,electric',
            'bucket_capacity' => 'nullable|string|max:50',
            'hourly_rate' => 'nullable|numeric|min:0',
            'daily_rate' => 'nullable|numeric|min:0',
            'monthly_rate' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive,maintenance,breakdown',
        ]);

        $machine = $this->service->create($data);

        return $this->success(new HitachiMachineResource($machine), 'Hitachi machine created', 201);
    }

    public function show(int $hitachi_machine): JsonResponse
    {
        $machine = $this->service->find($hitachi_machine)->load(['documents', 'rentals.customer']);

        return $this->success(new HitachiMachineResource($machine));
    }

    public function update(Request $request, int $hitachi_machine): JsonResponse
    {
        $model = $this->service->find($hitachi_machine);
        $data = $request->validate([
            'machine_number' => 'sometimes|string|unique:hitachi_machines,machine_number,'.$hitachi_machine,
            'registration_number' => 'nullable|string|max:50',
            'model' => 'nullable|string|max:100',
            'owner' => 'nullable|string|max:255',
            'engine_number' => 'nullable|string|max:100',
            'chassis_number' => 'nullable|string|max:100',
            'purchase_date' => 'nullable|date',
            'current_hours' => 'nullable|numeric|min:0',
            'current_km' => 'nullable|numeric|min:0',
            'fuel_type' => 'nullable|in:diesel,petrol,cng,electric',
            'bucket_capacity' => 'nullable|string|max:50',
            'hourly_rate' => 'nullable|numeric|min:0',
            'daily_rate' => 'nullable|numeric|min:0',
            'monthly_rate' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive,maintenance,breakdown',
        ]);

        $machine = $this->service->update($model, $data);

        return $this->success(new HitachiMachineResource($machine), 'Hitachi machine updated');
    }

    public function destroy(int $hitachi_machine): JsonResponse
    {
        $this->service->delete($this->service->find($hitachi_machine));

        return $this->success(null, 'Hitachi machine deleted');
    }

    public function rentalSummary(): JsonResponse
    {
        return $this->success($this->rentalService->getSummary());
    }

    public function indexRentals(Request $request): JsonResponse
    {
        $rentals = $this->rentalService->list($request->all());

        return $this->success(HitachiRentalResource::collection($rentals)->response()->getData(true));
    }

    public function storeRental(Request $request): JsonResponse
    {
        $data = $request->validate([
            'hitachi_id' => 'required|exists:hitachi_machines,id',
            'customer_id' => 'required|exists:customers,id',
            'site_location' => 'nullable|string|max:255',
            'billing_type' => 'required|in:hourly,daily,monthly',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'hours' => 'nullable|numeric|min:0',
            'days' => 'nullable|numeric|min:0',
            'months' => 'nullable|numeric|min:0',
            'rate' => 'nullable|numeric|min:0',
            'advance_received' => 'nullable|numeric|min:0',
            'operator_name' => 'nullable|string|max:255',
            'status' => 'nullable|in:booked,running,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $rental = $this->rentalService->create($data);

        return $this->success(new HitachiRentalResource($rental->load(['hitachi', 'customer'])), 'Hitachi rental created', 201);
    }

    public function showRental(HitachiRental $hitachiRental): JsonResponse
    {
        return $this->success(new HitachiRentalResource($this->rentalService->find($hitachiRental->id)));
    }

    public function updateRental(Request $request, HitachiRental $hitachiRental): JsonResponse
    {
        $data = $request->validate([
            'hitachi_id' => 'sometimes|exists:hitachi_machines,id',
            'customer_id' => 'sometimes|exists:customers,id',
            'site_location' => 'nullable|string|max:255',
            'billing_type' => 'sometimes|in:hourly,daily,monthly',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'hours' => 'nullable|numeric|min:0',
            'days' => 'nullable|numeric|min:0',
            'months' => 'nullable|numeric|min:0',
            'rate' => 'nullable|numeric|min:0',
            'advance_received' => 'nullable|numeric|min:0',
            'operator_name' => 'nullable|string|max:255',
            'status' => 'nullable|in:booked,running,completed,cancelled',
            'notes' => 'nullable|string',
        ]);

        $rental = $this->rentalService->update($hitachiRental, $data);

        return $this->success(new HitachiRentalResource($rental), 'Hitachi rental updated');
    }

    public function destroyRental(HitachiRental $hitachiRental): JsonResponse
    {
        $this->rentalService->delete($hitachiRental);

        return $this->success(null, 'Hitachi rental deleted');
    }
}
