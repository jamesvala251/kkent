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
        $data = $request->validate([
            'date' => 'required|date',
            'consignee' => 'required|string|max:255',
            'consignee_gst' => 'nullable|string|max:50',
            'consignee_address' => 'nullable|string',
            'transporter' => 'required|string|max:255',
            'vendor' => 'required|string|max:255',
            'dispatched_from' => 'required|string|max:255',
            'lr_no' => 'required|string|max:100',
            'po_no' => 'required|string|max:100',
            'vehicle_no' => 'required|string|max:50',
            'e_way_bill_no' => 'required|string|max:100',
            'e_way_date' => 'required|date',
            'prepared_by' => 'required|string|max:255',
            'item_table' => 'required|array|min:1',
            'item_table.*.id' => 'nullable|integer',
            'item_table.*.name' => 'required|string',
            'item_table.*.unit' => 'required|string',
            'item_table.*.weight' => 'required|numeric|min:0',
            'item_table.*.rate' => 'required|numeric|min:0',
            'item_table.*.amount' => 'required|numeric|min:0',
            'item_table.*.hsn' => 'nullable|string',
        ]);

        $consignee = ChallanConsignee::where('name', $data['consignee'])->first();
        if ($consignee && empty($data['consignee_address'])) {
            $data['consignee_address'] = $consignee->address;
        }
        if ($consignee && empty($data['consignee_gst'])) {
            $data['consignee_gst'] = $consignee->gst;
        }

        $subtotal = collect($data['item_table'])->sum(fn ($line) => (float) $line['amount']);
        $cgst = round($subtotal * 0.09, 2);
        $sgst = round($subtotal * 0.09, 2);

        $challan = Challan::create([
            ...$data,
            'challan_no' => $this->generateChallanNo(),
            'subtotal' => $subtotal,
            'cgst' => $cgst,
            'sgst' => $sgst,
            'total' => round($subtotal + $cgst + $sgst, 2),
        ]);

        return $this->success($challan, 'Challan created', 201);
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
