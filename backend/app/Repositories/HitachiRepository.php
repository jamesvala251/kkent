<?php

namespace App\Repositories;

use App\Models\HitachiMachine;
use Illuminate\Database\Eloquent\Builder;

class HitachiRepository extends BaseRepository
{
    protected function model(): string
    {
        return HitachiMachine::class;
    }

    protected function applySearch(Builder $query, string $search): Builder
    {
        return $query->where(function ($q) use ($search) {
            $q->where('machine_number', 'like', "%{$search}%")
                ->orWhere('registration_number', 'like', "%{$search}%")
                ->orWhere('model', 'like', "%{$search}%");
        });
    }
}
