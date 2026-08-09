<?php

namespace App\Models;

use App\Traits\HasAuditColumns;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Challan extends Model
{
    use HasAuditColumns, HasFactory, SoftDeletes;

    protected $fillable = [
        'challan_no', 'date', 'consignee', 'consignee_gst', 'consignee_address',
        'transporter', 'vendor', 'dispatched_from', 'lr_no', 'po_no',
        'vehicle_no', 'e_way_bill_no', 'e_way_date', 'prepared_by',
        'item_table', 'subtotal', 'cgst', 'sgst', 'total',
        'created_by', 'updated_by', 'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'e_way_date' => 'date',
            'item_table' => 'array',
            'subtotal' => 'decimal:2',
            'cgst' => 'decimal:2',
            'sgst' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }
}
