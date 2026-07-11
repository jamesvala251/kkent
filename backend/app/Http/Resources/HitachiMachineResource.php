<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HitachiMachineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'machine_number' => $this->machine_number,
            'registration_number' => $this->registration_number,
            'model' => $this->model,
            'owner' => $this->owner,
            'engine_number' => $this->engine_number,
            'chassis_number' => $this->chassis_number,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'current_hours' => $this->current_hours,
            'current_km' => $this->current_km,
            'fuel_type' => $this->fuel_type,
            'bucket_capacity' => $this->bucket_capacity,
            'hourly_rate' => $this->hourly_rate,
            'daily_rate' => $this->daily_rate,
            'monthly_rate' => $this->monthly_rate,
            'status' => $this->status,
            'active_rental' => $this->whenLoaded('activeRental', fn () => $this->activeRental->first()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
