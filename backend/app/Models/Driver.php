<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Driver extends Model
{
    use HasAuditColumns, HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'photo', 'mobile', 'address', 'aadhaar', 'license_number',
        'license_expiry', 'joining_date', 'salary_type', 'monthly_salary',
        'per_trip_salary', 'bank_name', 'bank_account', 'bank_ifsc',
        'emergency_contact', 'assigned_truck_id', 'status',
        'created_by', 'updated_by', 'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'license_expiry' => 'date',
            'joining_date' => 'date',
            'monthly_salary' => 'decimal:2',
            'per_trip_salary' => 'decimal:2',
        ];
    }

    public function assignedTruck(): BelongsTo
    {
        return $this->belongsTo(Truck::class, 'assigned_truck_id');
    }

    public function trips(): HasMany
    {
        return $this->hasMany(Trip::class);
    }

    public function salaries(): HasMany
    {
        return $this->hasMany(Salary::class);
    }

    public function advances(): HasMany
    {
        return $this->hasMany(SalaryAdvance::class);
    }

    public function leaves(): HasMany
    {
        return $this->hasMany(DriverLeave::class);
    }

    public function documents(): MorphMany
    {
        return $this->morphMany(Document::class, 'documentable');
    }
}
