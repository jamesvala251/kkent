<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = [
        'company_name', 'logo', 'address', 'phone', 'email', 'gst_number',
        'pan_number', 'invoice_prefix', 'trip_prefix', 'diesel_default_price',
        'email_settings', 'sms_settings', 'whatsapp_settings',
    ];

    protected function casts(): array
    {
        return [
            'diesel_default_price' => 'decimal:2',
            'email_settings' => 'array',
            'sms_settings' => 'array',
            'whatsapp_settings' => 'array',
        ];
    }
}
