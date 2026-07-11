<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DieselPurchaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'supplier' => $this->supplier,
            'bill_number' => $this->bill_number,
            'quantity' => $this->quantity,
            'remaining_quantity' => $this->remaining_quantity,
            'rate_per_liter' => $this->rate_per_liter,
            'total_amount' => $this->total_amount,
            'expense_id' => $this->expense_id,
            'expense' => $this->whenLoaded('expense'),
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
