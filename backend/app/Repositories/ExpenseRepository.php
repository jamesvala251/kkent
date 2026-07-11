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

        return $query;
    }

    protected function applySearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('description', 'like', "%{$search}%")
                ->orWhereHas('category', fn ($cat) => $cat->where('name', 'like', "%{$search}%"));
        });
    }

    public function all(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $this->applyFilters($this->query()->with(['category', 'truck', 'driver', 'trip']), $filters);
        $query->orderBy($filters['sort_by'] ?? 'expense_date', $filters['sort_order'] ?? 'desc');

        return $query->paginate($filters['per_page'] ?? $perPage);
    }
}
