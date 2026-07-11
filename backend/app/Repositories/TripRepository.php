<?php

namespace App\Repositories;

use App\Models\Trip;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class TripRepository extends BaseRepository
{
    protected function model(): string
    {
        return Trip::class;
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        $query = parent::applyFilters($query, $filters);

        if (! empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }
        if (! empty($filters['truck_id'])) {
            $query->where('truck_id', $filters['truck_id']);
        }
        if (! empty($filters['driver_id'])) {
            $query->where('driver_id', $filters['driver_id']);
        }
        if (! empty($filters['date_from'])) {
            $query->whereDate('start_date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('start_date', '<=', $filters['date_to']);
        }

        return $query;
    }

    protected function applySearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('trip_number', 'like', "%{$search}%")
                ->orWhere('from_location', 'like', "%{$search}%")
                ->orWhere('to_location', 'like', "%{$search}%");
        });
    }

    public function all(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->applyFilters($this->query()->with(['customer', 'truck', 'driver', 'hitachi']), $filters);
        $query->orderBy($filters['sort_by'] ?? 'created_at', $filters['sort_order'] ?? 'desc');

        return $query->paginate($filters['per_page'] ?? $perPage);
    }
}
