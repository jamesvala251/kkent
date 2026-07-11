<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Salary extends Model
{
    use HasAuditColumns, HasFactory, SoftDeletes;

    protected $fillable = [
        'driver_id', 'month', 'year', 'salary_type', 'base_amount', 'bonus',
        'penalty', 'overtime', 'advance_deduction', 'net_amount',
        'payment_status', 'paid_date', 'remarks',
        'created_by', 'updated_by', 'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'base_amount' => 'decimal:2',
            'bonus' => 'decimal:2',
            'penalty' => 'decimal:2',
            'overtime' => 'decimal:2',
            'advance_deduction' => 'decimal:2',
            'net_amount' => 'decimal:2',
            'paid_date' => 'date',
        ];
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(Driver::class);
    }
}
