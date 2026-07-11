<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HitachiRentalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rental_number' => $this->rental_number,
            'hitachi_id' => $this->hitachi_id,
            'customer_id' => $this->customer_id,
            'site_location' => $this->site_location,
            'billing_type' => $this->billing_type,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'hours' => $this->hours,
            'days' => $this->days,
            'months' => $this->months,
            'rate' => $this->rate,
            'total_amount' => $this->total_amount,
            'advance_received' => $this->advance_received,
            'balance' => $this->balance,
            'operator_name' => $this->operator_name,
            'status' => $this->status,
            'notes' => $this->notes,
            'hitachi' => new HitachiMachineResource($this->whenLoaded('hitachi')),
            'customer' => new CustomerResource($this->whenLoaded('customer')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
