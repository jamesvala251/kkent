<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class HitachiMachine extends Model
{
    use HasAuditColumns, HasFactory, SoftDeletes;

    protected $table = 'hitachi_machines';

    protected $fillable = [
        'machine_number', 'registration_number', 'model', 'owner', 'engine_number',
        'chassis_number', 'purchase_date', 'current_hours', 'current_km',
        'fuel_type', 'bucket_capacity', 'hourly_rate', 'daily_rate', 'monthly_rate', 'status',
        'created_by', 'updated_by', 'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'date',
            'current_hours' => 'decimal:2',
            'current_km' => 'decimal:2',
            'hourly_rate' => 'decimal:2',
            'daily_rate' => 'decimal:2',
            'monthly_rate' => 'decimal:2',
        ];
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class, 'hitachi_id');
    }

    public function rentals(): HasMany
    {
        return $this->hasMany(HitachiRental::class, 'hitachi_id');
    }

    public function activeRental(): HasMany
    {
        return $this->hasMany(HitachiRental::class, 'hitachi_id')
            ->whereIn('status', ['booked', 'running']);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(MaintenanceRecord::class, 'vehicle_id')
            ->where('vehicle_type', 'hitachi');
    }
}
