<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Trip\StoreTripRequest;
use App\Http\Requests\Trip\UpdateTripRequest;
use App\Http\Resources\TripResource;
use App\Models\Trip;
use App\Services\TripService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TripController extends ApiController
{
    public function __construct(private TripService $tripService) {}

    public function index(Request $request): JsonResponse
    {
        $trips = $this->tripService->list($request->all());

        return $this->success(TripResource::collection($trips)->response()->getData(true));
    }

    public function nextNumber(): JsonResponse
    {
        return $this->success([
            'trip_number' => $this->tripService->previewNextTripNumber(),
        ]);
    }

    public function store(StoreTripRequest $request): JsonResponse
    {
        $trip = $this->tripService->create($request->validated());

        return $this->success(new TripResource($trip), 'Trip created', 201);
    }

    public function show(Trip $trip): JsonResponse
    {
        return $this->success(new TripResource($this->tripService->find($trip->id)));
    }

    public function update(UpdateTripRequest $request, Trip $trip): JsonResponse
    {
        $trip = $this->tripService->update($trip, $request->validated());

        return $this->success(new TripResource($trip), 'Trip updated');
    }

    public function destroy(Trip $trip): JsonResponse
    {
        $this->tripService->delete($trip);

        return $this->success(null, 'Trip deleted');
    }
}
