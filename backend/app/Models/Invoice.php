<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Invoice extends Model
{
    use HasAuditColumns, HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_number', 'customer_id', 'trip_id', 'hitachi_rental_id', 'invoice_date', 'due_date',
        'billing_month', 'subtotal', 'cgst_rate', 'sgst_rate', 'igst_rate', 'cgst', 'sgst', 'igst',
        'total_amount', 'payment_status', 'paid_amount', 'notes', 'extra_charges',
        'created_by', 'updated_by', 'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'invoice_date' => 'date',
            'due_date' => 'date',
            'subtotal' => 'decimal:2',
            'cgst_rate' => 'decimal:2',
            'sgst_rate' => 'decimal:2',
            'igst_rate' => 'decimal:2',
            'cgst' => 'decimal:2',
            'sgst' => 'decimal:2',
            'igst' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'extra_charges' => 'array',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function trip(): BelongsTo
    {
        return $this->belongsTo(Trip::class);
    }

    public function trips(): BelongsToMany
    {
        return $this->belongsToMany(Trip::class, 'invoice_trip')->withTimestamps();
    }

    public function hitachiRental(): BelongsTo
    {
        return $this->belongsTo(HitachiRental::class, 'hitachi_rental_id');
    }

    /**
     * @return list<array{description: string, amount: float}>
     */
    public function extraChargeLines(): array
    {
        $rows = $this->extra_charges ?? [];

        return collect(is_array($rows) ? $rows : [])
            ->map(fn ($row) => [
                'description' => trim((string) ($row['description'] ?? '')),
                'amount' => round((float) ($row['amount'] ?? 0), 2),
            ])
            ->filter(fn ($row) => $row['description'] !== '' && $row['amount'] > 0)
            ->values()
            ->all();
    }

    public function extraChargesTotal(): float
    {
        return round(collect($this->extraChargeLines())->sum('amount'), 2);
    }
}
