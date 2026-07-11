<?php

namespace App\Http\Controllers\Api;

use App\Models\AppNotification;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Trip;
use App\Models\Truck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends ApiController
{
    public function global(Request $request): JsonResponse
    {
        $q = $request->get('q', '');
        if (strlen($q) < 2) {
            return $this->success([]);
        }

        return $this->success([
            'customers' => Customer::where('name', 'like', "%{$q}%")->orWhere('mobile', 'like', "%{$q}%")->limit(5)->get(['id', 'name', 'mobile']),
            'drivers' => Driver::where('name', 'like', "%{$q}%")->orWhere('mobile', 'like', "%{$q}%")->limit(5)->get(['id', 'name', 'mobile']),
            'trucks' => Truck::where('truck_number', 'like', "%{$q}%")->limit(5)->get(['id', 'truck_number']),
            'trips' => Trip::where('trip_number', 'like', "%{$q}%")->limit(5)->get(['id', 'trip_number', 'status']),
            'invoices' => Invoice::where('invoice_number', 'like', "%{$q}%")->limit(5)->get(['id', 'invoice_number', 'payment_status']),
        ]);
    }
}
