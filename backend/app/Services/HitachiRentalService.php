<?php

namespace App\Services;

use App\Models\CompanySetting;
use App\Models\HitachiMachine;
use App\Models\HitachiRental;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class HitachiRentalService
{
    public function getSummary(): array
    {
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        return [
            'total_machines' => HitachiMachine::where('status', 'active')->count(),
            'on_rent' => HitachiRental::whereIn('status', ['booked', 'running'])->distinct('hitachi_id')->count('hitachi_id'),
            'active_rentals' => HitachiRental::whereIn('status', ['booked', 'running'])->count(),
            'monthly_revenue' => round(
                HitachiRental::where('status', 'completed')
                    ->whereBetween('end_date', [$monthStart, $monthEnd])
                    ->sum('total_amount'),
                2
            ),
            'pending_balance' => round(
                HitachiRental::whereIn('status', ['running', 'completed'])
                    ->sum('balance'),
                2
            ),
        ];
    }

    public function list(array $filters = [])
    {
        $query = HitachiRental::with(['hitachi', 'customer'])
            ->orderBy($filters['sort_by'] ?? 'start_date', $filters['sort_order'] ?? 'desc');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['hitachi_id'])) {
            $query->where('hitachi_id', $filters['hitachi_id']);
        }
        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }
        if (! empty($filters['billing_type'])) {
            $query->where('billing_type', $filters['billing_type']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function find(int $id): HitachiRental
    {
        return HitachiRental::with(['hitachi', 'customer'])->findOrFail($id);
    }

    public function create(array $data): HitachiRental
    {
        return DB::transaction(function () use ($data) {
            $this->assertMachineAvailable($data['hitachi_id'], $data['status'] ?? 'booked');
            $data = $this->calculateFields($data);
            $data['rental_number'] = $this->generateRentalNumber();

            return HitachiRental::create($data);
        });
    }

    public function update(HitachiRental $rental, array $data): HitachiRental
    {
        return DB::transaction(function () use ($rental, $data) {
            if (
                isset($data['hitachi_id'], $data['status'])
                && (int) $data['hitachi_id'] !== (int) $rental->hitachi_id
                && in_array($data['status'], ['booked', 'running'], true)
            ) {
                $this->assertMachineAvailable($data['hitachi_id'], $data['status'], $rental->id);
            } elseif (
                isset($data['status'])
                && in_array($data['status'], ['booked', 'running'], true)
                && ! in_array($rental->status, ['booked', 'running'], true)
            ) {
                $this->assertMachineAvailable($data['hitachi_id'] ?? $rental->hitachi_id, $data['status'], $rental->id);
            }

            $merged = array_merge($rental->toArray(), $data);
            $data = $this->calculateFields($merged, $rental);
            $rental->update($data);

            return $rental->fresh(['hitachi', 'customer']);
        });
    }

    public function delete(HitachiRental $rental): void
    {
        $rental->delete();
    }

    private function calculateFields(array $data, ?HitachiRental $existing = null): array
    {
        $billingType = $data['billing_type'] ?? $existing?->billing_type ?? 'hourly';
        $machine = HitachiMachine::find($data['hitachi_id'] ?? $existing?->hitachi_id);

        $rate = isset($data['rate']) && (float) $data['rate'] > 0
            ? (float) $data['rate']
            : $this->resolveRate($machine, $billingType);

        $units = $this->resolveUnits($data, $billingType);

        $totalAmount = round($units * $rate, 2);
        $advance = (float) ($data['advance_received'] ?? $existing?->advance_received ?? 0);

        $data['rate'] = $rate;
        $data['total_amount'] = $totalAmount;
        $data['balance'] = round($totalAmount - $advance, 2);

        if ($billingType === 'hourly') {
            $data['hours'] = $units;
        } elseif ($billingType === 'daily') {
            $data['days'] = $units;
        } else {
            $data['months'] = $units;
        }

        return $data;
    }

    private function resolveRate(?HitachiMachine $machine, string $billingType): float
    {
        if (! $machine) {
            return 0;
        }

        return match ($billingType) {
            'daily' => (float) $machine->daily_rate,
            'monthly' => (float) $machine->monthly_rate,
            default => (float) $machine->hourly_rate,
        };
    }

    private function resolveUnits(array $data, string $billingType): float
    {
        if ($billingType === 'hourly') {
            return max(0, (float) ($data['hours'] ?? 0));
        }

        if ($billingType === 'daily') {
            $days = (float) ($data['days'] ?? 0);
            if ($days > 0) {
                return $days;
            }
            if (! empty($data['start_date']) && ! empty($data['end_date'])) {
                return $this->inclusiveDays($data['start_date'], $data['end_date']);
            }

            return 0;
        }

        $months = (float) ($data['months'] ?? 0);
        if ($months > 0) {
            return $months;
        }
        if (! empty($data['start_date']) && ! empty($data['end_date'])) {
            $days = $this->inclusiveDays($data['start_date'], $data['end_date']);

            return round($days / 30, 2);
        }

        return 0;
    }

    private function inclusiveDays(string $start, string $end): float
    {
        $startDate = Carbon::parse($start);
        $endDate = Carbon::parse($end);

        return (float) max(1, $startDate->diffInDays($endDate) + 1);
    }

    private function assertMachineAvailable(int $hitachiId, string $status, ?int $exceptRentalId = null): void
    {
        if (! in_array($status, ['booked', 'running'], true)) {
            return;
        }

        $query = HitachiRental::where('hitachi_id', $hitachiId)
            ->whereIn('status', ['booked', 'running']);

        if ($exceptRentalId) {
            $query->where('id', '!=', $exceptRentalId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'hitachi_id' => ['This hitachi machine already has an active rental.'],
            ]);
        }
    }

    private function generateRentalNumber(): string
    {
        $settings = CompanySetting::first();
        $prefix = $settings?->trip_prefix ? $settings->trip_prefix.'-H' : 'HRE';
        $last = HitachiRental::withTrashed()->latest('id')->first();
        $next = ($last?->id ?? 0) + 1;

        return $prefix.'-'.str_pad((string) $next, 6, '0', STR_PAD_LEFT);
    }
}
