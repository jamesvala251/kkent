<?php

namespace App\Http\Controllers\Api;

use App\Models\ChallanConsignee;
use App\Models\ChallanItem;
use App\Models\ChallanTransporter;
use App\Models\ChallanVendor;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChallanMasterController extends ApiController
{
    /** @return class-string<Model> */
    private function modelFor(string $type): string
    {
        return match ($type) {
            'consignees' => ChallanConsignee::class,
            'transporters' => ChallanTransporter::class,
            'vendors' => ChallanVendor::class,
            'items' => ChallanItem::class,
            default => abort(404),
        };
    }

    public function index(string $type): JsonResponse
    {
        $model = $this->modelFor($type);
        $rows = $model::query()->orderBy('name')->get();

        return $this->success($rows);
    }

    public function store(Request $request, string $type): JsonResponse
    {
        if ($type === 'items') {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'unit' => 'required|string|max:50',
                'weight' => 'required|numeric|min:0',
                'rate' => 'required|numeric|min:0',
                'hsn' => 'nullable|string|max:50',
            ]);
            $data['amount'] = round((float) $data['weight'] * (float) $data['rate'], 2);
            $data['hsn'] = $data['hsn'] ?? '1234567';
        } else {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'gst' => 'required|string|max:50',
                'address' => 'nullable|string',
                'contact' => 'nullable|string|max:50',
            ]);
        }

        $model = $this->modelFor($type);
        $row = $model::create($data);

        return $this->success($row, ucfirst(rtrim($type, 's')).' created', 201);
    }

    public function update(Request $request, string $type, int $id): JsonResponse
    {
        $model = $this->modelFor($type);
        $row = $model::findOrFail($id);

        if ($type === 'items') {
            $data = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'unit' => 'sometimes|required|string|max:50',
                'weight' => 'sometimes|required|numeric|min:0',
                'rate' => 'sometimes|required|numeric|min:0',
                'hsn' => 'nullable|string|max:50',
            ]);
            $weight = (float) ($data['weight'] ?? $row->weight);
            $rate = (float) ($data['rate'] ?? $row->rate);
            $data['amount'] = round($weight * $rate, 2);
        } else {
            $data = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'gst' => 'sometimes|required|string|max:50',
                'address' => 'nullable|string',
                'contact' => 'nullable|string|max:50',
            ]);
        }

        $row->update($data);

        return $this->success($row->fresh(), 'Updated');
    }

    public function destroy(string $type, int $id): JsonResponse
    {
        $model = $this->modelFor($type);
        $row = $model::findOrFail($id);
        $row->delete();

        return $this->success(null, 'Deleted');
    }
}
