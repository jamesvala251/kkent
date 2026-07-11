<?php

namespace App\Repositories;

use App\Models\Truck;
use Illuminate\Database\Eloquent\Builder;

class TruckRepository extends BaseRepository
{
    protected function model(): string
    {
        return Truck::class;
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        $query = parent::applyFilters($query, $filters);

        if (! empty($filters['fuel_type'])) {
            $query->where('fuel_type', $filters['fuel_type']);
        }

        return $query;
    }

    protected function applySearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('truck_number', 'like', "%{$search}%")
                ->orWhere('rc_number', 'like', "%{$search}%")
                ->orWhere('brand', 'like', "%{$search}%")
                ->orWhere('model', 'like', "%{$search}%");
        });
    }
}
