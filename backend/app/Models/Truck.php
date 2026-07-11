<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Truck extends Model
{
    use HasAuditColumns, HasFactory, SoftDeletes;

    protected $fillable = [
        'truck_number', 'rc_number', 'insurance_expiry', 'fitness_expiry',
        'permit_expiry', 'puc_expiry', 'tax_expiry', 'model', 'brand', 'year',
        'capacity', 'owner', 'fuel_type', 'gps_number', 'current_km', 'status',
        'created_by', 'updated_by', 'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'insurance_expiry' => 'date',
            'fitness_expiry' => 'date',
            'permit_expiry' => 'date',
            'puc_expiry' => 'date',
            'tax_expiry' => 'date',
            'current_km' => 'decimal:2',
        ];
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function assignedDriver(): HasMany
    {
        return $this->hasMany(Driver::class, 'assigned_truck_id');
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }

    public function maintenanceRecords(): HasMany
    {
        return $this->hasMany(MaintenanceRecord::class, 'vehicle_id')
            ->where('vehicle_type', 'truck');
    }
}
