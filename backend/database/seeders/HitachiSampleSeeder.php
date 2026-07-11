<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\HitachiMachine;
use App\Models\HitachiRental;
use Illuminate\Database\Seeder;

class HitachiSampleSeeder extends Seeder
{
    public function run(): void
    {
        $machine = HitachiMachine::firstOrCreate(
            ['machine_number' => 'GJ-EX-001'],
            [
                'registration_number' => 'GJ01AB1234',
                'model' => 'Hitachi ZX210',
                'owner' => 'KK Enterprise',
                'engine_number' => 'ENG-210-001',
                'chassis_number' => 'CHS-210-001',
                'purchase_date' => '2024-01-15',
                'current_hours' => 1250,
                'current_km' => 0,
                'fuel_type' => 'diesel',
                'bucket_capacity' => '1.2 CUM',
                'hourly_rate' => 850,
                'daily_rate' => 6500,
                'monthly_rate' => 125000,
                'status' => 'active',
            ]
        );

        $customer = Customer::firstOrCreate(
            ['mobile' => '9876500001'],
            [
                'name' => 'Shree Construction',
                'company_name' => 'Shree Construction Pvt Ltd',
                'contact_person' => 'Rajesh Patel',
                'email' => 'rajesh@shreeconstruction.com',
                'address' => 'Ring Road, Surat',
                'city' => 'Surat',
                'state' => 'Gujarat',
                'status' => 'active',
            ]
        );

        HitachiRental::firstOrCreate(
            ['rental_number' => 'TRP-H-000001'],
            [
                'hitachi_id' => $machine->id,
                'customer_id' => $customer->id,
                'site_location' => 'Surat - Dumas Road Site',
                'billing_type' => 'daily',
                'start_date' => now()->subDays(3)->toDateString(),
                'end_date' => now()->addDays(4)->toDateString(),
                'days' => 8,
                'hours' => 0,
                'months' => 0,
                'rate' => 6500,
                'total_amount' => 52000,
                'advance_received' => 20000,
                'balance' => 32000,
                'operator_name' => 'Mahesh',
                'status' => 'running',
                'notes' => 'Sample daily rental for demo',
            ]
        );

        // Keep remaining stock aligned if purchase exists — rental is standalone
        $this->command?->info('Hitachi sample data seeded: 1 machine, 1 customer, 1 rental.');
    }
}
