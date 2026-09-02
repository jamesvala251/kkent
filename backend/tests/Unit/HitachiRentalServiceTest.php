<?php

namespace Tests\Unit;

use App\Models\Customer;
use App\Models\HitachiMachine;
use App\Models\HitachiRental;
use App\Services\HitachiRentalService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HitachiRentalServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_monthly_rental_without_months_defaults_to_one_month(): void
    {
        $customer = Customer::factory()->create();

        $machine = HitachiMachine::create([
            'machine_number' => 'hyundai 215',
            'model' => '2026',
            'owner' => 'KK Enterprise',
            'hourly_rate' => 0,
            'daily_rate' => 0,
            'monthly_rate' => 170000,
            'status' => 'active',
        ]);

        $rental = HitachiRental::create([
            'rental_number' => 'TRP-H-TEST-001',
            'hitachi_id' => $machine->id,
            'customer_id' => $customer->id,
            'billing_type' => 'monthly',
            'start_date' => '2026-07-22',
            'end_date' => null,
            'months' => 0,
            'rate' => 170000,
            'total_amount' => 0,
            'advance_received' => 0,
            'balance' => 0,
            'status' => 'running',
        ]);

        $service = app(HitachiRentalService::class);

        $this->assertSame(170000.0, $service->billableAmount($rental));

        $updated = $service->recalculate($rental);

        $this->assertSame('1.00', (string) $updated->months);
        $this->assertSame('170000.00', (string) $updated->total_amount);
    }
}
