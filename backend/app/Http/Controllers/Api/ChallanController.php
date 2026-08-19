<?php

namespace App\Http\Controllers\Api;

use App\Models\Challan;
use App\Models\ChallanConsignee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChallanController extends ApiController
{
    public function index(): JsonResponse
    {
        $challans = Challan::query()->orderByDesc('id')->get();

        return $this->success($challans);
    }

    public function nextNumber(): JsonResponse
    {
        return $this->success(['challan_no' => $this->generateChallanNo()]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->rules());
        $data = $this->withConsigneeDefaults($data);
        $tax = $this->taxFrom($data);
        unset($data['cgst_rate'], $data['sgst_rate'], $data['igst_rate']);

        $challan = Challan::create([
            ...$data,
            'challan_no' => $this->generateChallanNo(),
            ...$tax,
        ]);

        return $this->success($challan, 'Challan created', 201);
    }

    public function update(Request $request, Challan $challan): JsonResponse
    {
        $data = $request->validate($this->rules(true));
        $data = $this->withConsigneeDefaults($data);
        $tax = $this->taxFrom($data);
        unset($data['cgst_rate'], $data['sgst_rate'], $data['igst_rate']);
        $challan->update([...$data, ...$tax]);

        return $this->success($challan->fresh(), 'Challan updated');
    }

    public function show(Challan $challan): JsonResponse
    {
        return $this->success($challan);
    }

    public function destroy(Challan $challan): JsonResponse
    {
        $challan->delete();

        return $this->success(null, 'Challan deleted');
    }

    private function rules(bool $updating = false): array
    {
        $required = $updating ? 'sometimes' : 'required';

        return [
            'date' => $required.'|date',
            'consignee' => $required.'|string|max:255',
            'consignee_gst' => 'nullable|string|max:50',
            'consignee_address' => 'nullable|string',
            'transporter' => $required.'|string|max:255',
            'vendor' => $required.'|string|max:255',
            'dispatched_from' => $required.'|string|max:255',
            'lr_no' => $required.'|string|max:100',
            'po_no' => $required.'|string|max:100',
            'vehicle_no' => $required.'|string|max:50',
            'e_way_bill_no' => $required.'|string|max:100',
            'e_way_date' => $required.'|date',
            'prepared_by' => $required.'|string|max:255',
            'item_table' => $required.'|array|min:1',
            'item_table.*.id' => 'nullable|integer',
            'item_table.*.name' => 'required_with:item_table|string',
            'item_table.*.unit' => 'required_with:item_table|string',
            'item_table.*.weight' => 'required_with:item_table|numeric|min:0',
            'item_table.*.rate' => 'required_with:item_table|numeric|min:0',
            'item_table.*.amount' => 'required_with:item_table|numeric|min:0',
            'item_table.*.hsn' => 'nullable|string',
            'cgst_rate' => 'nullable|numeric|min:0|max:100',
            'sgst_rate' => 'nullable|numeric|min:0|max:100',
            'igst_rate' => 'nullable|numeric|min:0|max:100',
        ];
    }

    private function withConsigneeDefaults(array $data): array
    {
        if (empty($data['consignee'])) {
            return $data;
        }
        $consignee = ChallanConsignee::where('name', $data['consignee'])->first();
        if ($consignee && empty($data['consignee_address'])) {
            $data['consignee_address'] = $consignee->address;
        }
        if ($consignee && empty($data['consignee_gst'])) {
            $data['consignee_gst'] = $consignee->gst;
        }

        return $data;
    }

    private function taxFrom(array $data): array
    {
        $subtotal = collect($data['item_table'] ?? [])->sum(fn ($line) => (float) $line['amount']);
        $cgstRate = (float) ($data['cgst_rate'] ?? 9);
        $sgstRate = (float) ($data['sgst_rate'] ?? 9);
        $igstRate = (float) ($data['igst_rate'] ?? 0);
        unset($data['cgst_rate'], $data['sgst_rate'], $data['igst_rate']);

        if ($igstRate > 0) {
            $cgstRate = 0;
            $sgstRate = 0;
        }

        $cgst = round($subtotal * $cgstRate / 100, 2);
        $sgst = round($subtotal * $sgstRate / 100, 2);
        $igst = round($subtotal * $igstRate / 100, 2);

        return [
            'subtotal' => $subtotal,
            'cgst' => $cgst + $igst,
            'sgst' => $sgst,
            'total' => round($subtotal + $cgst + $sgst + $igst, 2),
        ];
    }

    private function generateChallanNo(): string
    {
        $yy = now()->format('y');
        $mm = now()->format('m');
        $prefix = "CHL/{$yy}{$mm}/";

        $latest = Challan::withTrashed()
            ->where('challan_no', 'like', $prefix.'%')
            ->orderByDesc('challan_no')
            ->value('challan_no');

        $seq = 1;
        if ($latest && preg_match('/\/(\d+)$/', $latest, $m)) {
            $seq = ((int) $m[1]) + 1;
        }

        return $prefix.str_pad((string) $seq, 4, '0', STR_PAD_LEFT);
    }
}
