<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'permissions' => $this->whenLoaded('permissions', fn () => $this->permissions->pluck('name')->values()),
            'permissions_count' => $this->permissions_count ?? $this->permissions?->count(),
            'users_count' => $this->users_count ?? 0,
            'created_at' => $this->created_at,
        ];
    }
}
