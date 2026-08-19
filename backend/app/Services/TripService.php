<?php

namespace App\Services;

use App\Models\CompanySetting;
use App\Models\DieselIssue;
use App\Models\Trip;
use App\Repositories\TripRepository;
use App\Services\AuditService;

class TripService
{
    public function __construct(
        private TripRepository $repository,
        private AuditService $auditService
    ) {}

    public function list(array $filters = [])
    {
        return $this->repository->all($filters);
    }

    public function summary(array $filters = []): array
    {
        return $this->repository->summary($filters);
    }

    public function find(int $id): Trip
    {
        return $this->repository->findOrFail($id)->load(['customer', 'truck', 'driver', 'hitachi']);
    }

    public function create(array $data): Trip
    {
        unset($data['trip_number'], $data['status']);
        $data = $this->calculateFields($data);
        $data['trip_number'] = $this->generateTripNumber();

        $trip = $this->repository->create($data);
        $this->auditService->log('create', 'trips', $trip, null, $trip->toArray());

        return $trip->load(['customer', 'truck', 'driver', 'hitachi']);
    }

    public function update(Trip $trip, array $data): Trip
    {
        $old = $trip->toArray();
        unset($data['trip_number'], $data['status']);
        $data = $this->calculateFields($data);
        $data = $this->applyIssuedDiesel($data, $trip);
        $trip = $this->repository->update($trip, $data);
        $this->auditService->log('update', 'trips', $trip, $old, $trip->toArray());

        return $trip->load(['customer', 'truck', 'driver', 'hitachi']);
    }

    public function delete(Trip $trip): void
    {
        $this->auditService->log('delete', 'trips', $trip, $trip->toArray());
        $trip->invoices()->detach();
        $this->repository->delete($trip);
    }

    private function calculateFields(array $data): array
    {
        $data['from_location'] = trim((string) ($data['from_location'] ?? ''));
        $data['to_location'] = trim((string) ($data['to_location'] ?? ''));

        $startKm = (float) ($data['start_km'] ?? 0);
        $endKm = (float) ($data['end_km'] ?? 0);
        $data['total_km'] = max(0, $endKm - $startKm);

        $dieselQty = (float) ($data['diesel_qty'] ?? 0);
        $dieselRate = (float) ($data['diesel_rate'] ?? 0);
        $data['diesel_amount'] = round($dieselQty * $dieselRate, 2);

        $totalExpense = $data['diesel_amount']
            + (float) ($data['driver_salary'] ?? 0)
            + (float) ($data['maintenance'] ?? 0)
            + (float) ($data['toll'] ?? 0)
            + (float) ($data['other_expense'] ?? 0);
        $data['total_expense'] = round($totalExpense, 2);

        // freight = rate per ton/unit; total_freight = rate × weight
        $freightRate = (float) ($data['freight'] ?? 0);
        $weight = (float) ($data['weight'] ?? 0);
        $totalFreight = round($freightRate * $weight, 2);
        $advance = (float) ($data['advance_received'] ?? 0);

        $data['total_freight'] = $totalFreight;
        $data['balance'] = round($totalFreight - $advance, 2);
        $data['profit'] = round($totalFreight - $totalExpense, 2);

        return $data;
    }

    private function applyIssuedDiesel(array $data, Trip $trip): array
    {
        $issues = DieselIssue::where('trip_id', $trip->id)->get();
        if ($issues->isEmpty()) {
            return $data;
        }

        $qty = (float) $issues->sum('quantity');
        $amount = (float) $issues->sum('total_amount');
        $data['diesel_qty'] = round($qty, 2);
        $data['diesel_amount'] = round($amount, 2);
        $data['diesel_rate'] = $qty > 0 ? round($amount / $qty, 2) : 0;
        $data['total_expense'] = round(
            $amount
            + (float) ($data['driver_salary'] ?? $trip->driver_salary)
            + (float) ($data['maintenance'] ?? $trip->maintenance)
            + (float) ($data['toll'] ?? $trip->toll)
            + (float) ($data['other_expense'] ?? $trip->other_expense),
            2
        );
        $data['profit'] = round((float) ($data['total_freight'] ?? $trip->total_freight) - $data['total_expense'], 2);

        return $data;
    }

    private function generateTripNumber(): string
    {
        $settings = CompanySetting::first();
        $prefix = $settings?->trip_prefix ?? 'TRP';
        $lastTrip = Trip::withTrashed()->latest('id')->first();
        $next = ($lastTrip?->id ?? 0) + 1;

        return $prefix.'-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }

    public function previewNextTripNumber(): string
    {
        return $this->generateTripNumber();
    }
}
