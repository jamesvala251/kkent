<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MaintenanceRecord extends Model
{
    use HasAuditColumns, SoftDeletes;

    protected $fillable = [
        'vehicle_type', 'vehicle_id', 'type', 'service_date', 'next_service_date',
        'current_km', 'cost', 'vendor', 'description', 'status',
        'created_by', 'updated_by', 'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'service_date' => 'date',
            'next_service_date' => 'date',
            'current_km' => 'decimal:2',
            'cost' => 'decimal:2',
        ];
    }

    public function vehicle(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'vehicle_type', 'vehicle_id');
    }
}
