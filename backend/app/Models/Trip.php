<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Trip extends Model
{
    use HasAuditColumns, HasFactory, SoftDeletes;

    protected $fillable = [
        'trip_number', 'customer_id', 'truck_id', 'driver_id', 'hitachi_id',
        'start_date', 'end_date', 'from_location', 'to_location', 'material',
        'weight', 'start_km', 'end_km', 'total_km', 'diesel_qty', 'diesel_rate',
        'diesel_amount', 'toll', 'maintenance', 'other_expense', 'driver_salary',
        'total_expense', 'freight', 'total_freight', 'advance_received', 'balance', 'profit',
        'compressor', 'remarks', 'status',
        'created_by', 'updated_by', 'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'weight' => 'decimal:2',
            'start_km' => 'decimal:2',
            'end_km' => 'decimal:2',
            'total_km' => 'decimal:2',
            'diesel_qty' => 'decimal:2',
            'diesel_rate' => 'decimal:2',
            'diesel_amount' => 'decimal:2',
            'toll' => 'decimal:2',
            'maintenance' => 'decimal:2',
            'other_expense' => 'decimal:2',
            'driver_salary' => 'decimal:2',
            'total_expense' => 'decimal:2',
            'freight' => 'decimal:2',
            'total_freight' => 'decimal:2',
            'advance_received' => 'decimal:2',
            'balance' => 'decimal:2',
            'profit' => 'decimal:2',
            'compressor' => 'boolean',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }

    public function hitachi(): BelongsTo
    {
        return $this->belongsTo(HitachiMachine::class, 'hitachi_id');
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function invoice(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Invoice::class);
    }
}
