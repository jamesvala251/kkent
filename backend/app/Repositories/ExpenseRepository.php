<?php

namespace App\Repositories;

use App\Models\Expense;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

class ExpenseRepository extends BaseRepository
{
    protected function model(): string
    {
        return Expense::class;
    }

    protected function applyFilters(Builder $query, array $filters): Builder
    {
        $query = parent::applyFilters($query, $filters);

        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (! empty($filters['truck_id'])) {
            $query->where('truck_id', $filters['truck_id']);
        }
        if (! empty($filters['date_from'])) {
            $query->whereDate('expense_date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('expense_date', '<=', $filters['date_to']);
        }

        if (! empty($filters['driver_id'])) {
            $query->where('driver_id', $filters['driver_id']);
        }
        if (! empty($filters['trip_id'])) {
            $query->where('trip_id', $filters['trip_id']);
        }
        if (! empty($filters['hitachi_id'])) {
            $query->where(function ($inner) use ($filters) {
                $inner->where('hitachi_id', $filters['hitachi_id'])
                    ->orWhereHas('hitachiRental', fn ($rental) => $rental->where('hitachi_id', $filters['hitachi_id']));
            });
        }
        if (! empty($filters['hitachi_rental_id'])) {
            $query->where('hitachi_rental_id', $filters['hitachi_rental_id']);
        }

        $scope = $filters['scope'] ?? '';
        if ($scope === 'hitachi') {
            $query->where(function ($inner) {
                $inner->whereNotNull('hitachi_id')->orWhereNotNull('hitachi_rental_id');
            });
        } elseif ($scope === 'truck') {
            $query->where(function ($inner) {
                $inner->whereNotNull('truck_id')->orWhereNotNull('trip_id')->orWhereNotNull('driver_id');
            })->whereNull('hitachi_id')->whereNull('hitachi_rental_id');
        } elseif ($scope === 'other') {
            $query->whereNull('truck_id')
                ->whereNull('driver_id')
                ->whereNull('trip_id')
                ->whereNull('hitachi_id')
                ->whereNull('hitachi_rental_id');
        }

        return $query;
    }

    protected function applySearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('description', 'like', "%{$search}%")
                ->orWhereHas('category', fn ($cat) => $cat->where('name', 'like', "%{$search}%"))
                ->orWhereHas('truck', fn ($truck) => $truck->where('truck_number', 'like', "%{$search}%"))
                ->orWhereHas('trip', fn ($trip) => $trip->where('trip_number', 'like', "%{$search}%"))
                ->orWhereHas('hitachi', fn ($machine) => $machine->where('machine_number', 'like', "%{$search}%"))
                ->orWhereHas('hitachiRental', fn ($rental) => $rental->where('rental_number', 'like', "%{$search}%"));
        });
    }

    public function all(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->applyFilters($this->query()->with(['category', 'truck', 'driver', 'trip', 'hitachi', 'hitachiRental.hitachi']), $filters);
        $query->orderBy($filters['sort_by'] ?? 'expense_date', $filters['sort_order'] ?? 'desc');

        return $query->paginate($filters['per_page'] ?? $perPage);
    }
}
