<?php

namespace App\Http\Controllers\Api;

use App\Models\Customer;
use App\Models\Driver;
use App\Models\HitachiMachine;
use App\Models\Invoice;
use App\Models\Trip;
use App\Models\Truck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends ApiController
{
    public function global(Request $request): JsonResponse
    {
        $q = trim((string) $request->get('q', ''));
        if (strlen($q) < 2) {
            return $this->success([
                'customers' => [],
                'drivers' => [],
                'trucks' => [],
                'hitachi' => [],
                'trips' => [],
                'invoices' => [],
            ]);
        }

        $like = '%'.$q.'%';

        return $this->success([
            'customers' => Customer::query()
                ->where(function ($query) use ($like) {
                    $query->where('name', 'like', $like)
                        ->orWhere('company_name', 'like', $like)
                        ->orWhere('mobile', 'like', $like);
                })
                ->limit(8)
                ->get(['id', 'name', 'company_name', 'mobile']),
            'drivers' => Driver::query()
                ->where(function ($query) use ($like) {
                    $query->where('name', 'like', $like)
                        ->orWhere('mobile', 'like', $like);
                })
                ->limit(8)
                ->get(['id', 'name', 'mobile']),
            'trucks' => Truck::query()
                ->where('truck_number', 'like', $like)
                ->limit(8)
                ->get(['id', 'truck_number']),
            'hitachi' => HitachiMachine::query()
                ->where(function ($query) use ($like) {
                    $query->where('machine_number', 'like', $like)
                        ->orWhere('registration_number', 'like', $like);
                })
                ->limit(8)
                ->get(['id', 'machine_number']),
            'trips' => Trip::query()
                ->where('trip_number', 'like', $like)
                ->limit(8)
                ->get(['id', 'trip_number']),
            'invoices' => Invoice::query()
                ->where('invoice_number', 'like', $like)
                ->limit(8)
                ->get(['id', 'invoice_number', 'payment_status']),
        ]);
    }
}
