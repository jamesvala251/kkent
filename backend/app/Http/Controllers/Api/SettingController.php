<?php

namespace App\Http\Controllers\Api;

use App\Models\CompanySetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends ApiController
{
    public function show(): JsonResponse
    {
        $settings = CompanySetting::first() ?? CompanySetting::create([
            'company_name' => 'KK Enterprise',
        ]);

        return $this->success($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'logo' => 'nullable|string',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'gst_number' => 'nullable|string|max:20',
            'pan_number' => 'nullable|string|max:20',
            'invoice_prefix' => 'nullable|string|max:10',
            'trip_prefix' => 'nullable|string|max:10',
            'diesel_default_price' => 'nullable|numeric|min:0',
            'email_settings' => 'nullable|array',
            'sms_settings' => 'nullable|array',
            'whatsapp_settings' => 'nullable|array',
        ]);

        $settings = CompanySetting::first() ?? new CompanySetting;
        $settings->fill($data);
        $settings->save();

        return $this->success($settings, 'Settings updated');
    }
}
