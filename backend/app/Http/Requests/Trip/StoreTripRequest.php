<?php

namespace App\Http\Requests\Trip;

use Illuminate\Foundation\Http\FormRequest;

class StoreTripRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => 'required|exists:customers,id',
            'truck_id' => 'required|exists:trucks,id',
            'driver_id' => 'required|exists:drivers,id',
            'hitachi_id' => 'nullable|exists:hitachi_machines,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'from_location' => 'required|string|max:255',
            'to_location' => 'required|string|max:255',
            'material' => 'nullable|string|max:255',
            'weight' => 'nullable|numeric|min:0',
            'start_km' => 'required|numeric|min:0',
            'end_km' => 'nullable|numeric|min:0',
            'diesel_qty' => 'nullable|numeric|min:0',
            'diesel_rate' => 'nullable|numeric|min:0',
            'toll' => 'nullable|numeric|min:0',
            'maintenance' => 'nullable|numeric|min:0',
            'other_expense' => 'nullable|numeric|min:0',
            'driver_salary' => 'nullable|numeric|min:0',
            'freight' => 'nullable|numeric|min:0',
            'advance_received' => 'nullable|numeric|min:0',
            'compressor' => 'nullable|boolean',
            'remarks' => 'nullable|string',
            'status' => 'nullable|in:pending,running,completed,cancelled',
        ];
    }
}
