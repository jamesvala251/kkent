<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DieselIssueResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'issue_date' => $this->issue_date?->format('Y-m-d'),
            'quantity' => $this->quantity,
            'rate_per_liter' => $this->rate_per_liter,
            'total_amount' => $this->total_amount,
            'truck_id' => $this->truck_id,
            'hitachi_id' => $this->hitachi_id,
            'trip_id' => $this->trip_id,
            'diesel_purchase_id' => $this->diesel_purchase_id,
            'purchase_allocations' => $this->purchase_allocations,
            'truck' => $this->whenLoaded('truck'),
            'hitachi' => $this->whenLoaded('hitachi'),
            'trip' => $this->whenLoaded('trip'),
            'diesel_purchase' => $this->whenLoaded('dieselPurchase'),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
