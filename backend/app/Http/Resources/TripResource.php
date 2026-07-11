<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TripResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'trip_number' => $this->trip_number,
            'customer_id' => $this->customer_id,
            'truck_id' => $this->truck_id,
            'driver_id' => $this->driver_id,
            'hitachi_id' => $this->hitachi_id,
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'truck' => $this->whenLoaded('truck'),
            'driver' => $this->whenLoaded('driver'),
            'hitachi' => $this->whenLoaded('hitachi'),
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'from_location' => $this->from_location,
            'to_location' => $this->to_location,
            'material' => $this->material,
            'weight' => $this->weight,
            'start_km' => $this->start_km,
            'end_km' => $this->end_km,
            'total_km' => $this->total_km,
            'diesel_qty' => $this->diesel_qty,
            'diesel_rate' => $this->diesel_rate,
            'diesel_amount' => $this->diesel_amount,
            'toll' => $this->toll,
            'maintenance' => $this->maintenance,
            'other_expense' => $this->other_expense,
            'driver_salary' => $this->driver_salary,
            'total_expense' => $this->total_expense,
            'freight' => $this->freight,
            'total_freight' => $this->total_freight,
            'advance_received' => $this->advance_received,
            'balance' => $this->balance,
            'profit' => $this->profit,
            'compressor' => $this->compressor,
            'remarks' => $this->remarks,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
