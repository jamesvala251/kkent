<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class HitachiRental extends Model
{
    use HasAuditColumns, HasFactory, SoftDeletes;

    protected $fillable = [
        'rental_number', 'hitachi_id', 'customer_id', 'site_location', 'billing_type',
        'start_date', 'end_date', 'hours', 'days', 'months', 'rate',
        'total_amount', 'advance_received', 'balance', 'operator_name', 'status', 'notes',
        'created_by', 'updated_by', 'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'hours' => 'decimal:2',
            'days' => 'decimal:2',
            'months' => 'decimal:2',
            'rate' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'advance_received' => 'decimal:2',
            'balance' => 'decimal:2',
        ];
    }

    public function hitachi(): BelongsTo
    {
        return $this->belongsTo(HitachiMachine::class, 'hitachi_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
