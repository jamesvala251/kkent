<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class DieselIssue extends Model
{
    use HasAuditColumns, HasFactory, SoftDeletes;

    protected $fillable = [
        'issue_date', 'quantity', 'rate_per_liter', 'total_amount',
        'truck_id', 'hitachi_id', 'trip_id', 'diesel_purchase_id',
        'purchase_allocations', 'notes',
        'created_by', 'updated_by', 'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'issue_date' => 'date',
            'quantity' => 'decimal:2',
            'rate_per_liter' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'purchase_allocations' => 'array',
        ];
    }

    public function truck(): BelongsTo
    {
        return $this->belongsTo(Truck::class);
    }

    public function hitachi(): BelongsTo
    {
        return $this->belongsTo(HitachiMachine::class, 'hitachi_id');
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function dieselPurchase(): BelongsTo
    {
        return $this->belongsTo(DieselPurchase::class);
    }
}
