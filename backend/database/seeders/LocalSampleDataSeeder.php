<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Driver;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\HitachiMachine;
use App\Models\HitachiRental;
use App\Models\SalaryAdvance;
use App\Models\Trip;
use App\Models\Truck;
use Illuminate\Database\Seeder;

/**
 * Local/dev sample data only — safe to re-run (uses firstOrCreate keys).
 * Run: php artisan db:seed --class=LocalSampleDataSeeder
 */
class LocalSampleDataSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment('local')) {
            $this->command?->warn('LocalSampleDataSeeder skipped (APP_ENV is not local).');

            return;
        }

        $trucks = $this->seedTrucks();
        $drivers = $this->seedDrivers($trucks);
        $customers = $this->seedCustomers();
        $machines = $this->seedHitachiMachines();
        $this->seedTrips($customers, $trucks, $drivers);
        $this->seedHitachiRentals($customers, $machines);
        $this->seedExpenses($customers);
        $this->seedSalaryAdvances($drivers);

        $this->command?->info('Local sample data ready:');
        $this->command?->info('  Customers: '.Customer::count());
        $this->command?->info('  Trucks: '.Truck::count());
        $this->command?->info('  Drivers: '.Driver::count());
        $this->command?->info('  Trips: '.Trip::count());
        $this->command?->info('  Hitachi machines: '.HitachiMachine::count());
        $this->command?->info('  Hitachi rentals: '.HitachiRental::count());
        $this->command?->info('  Expenses: '.Expense::count());
        $this->command?->info('  Salary advances: '.SalaryAdvance::count());
        $this->command?->info('Use customers like "Shree Construction" / "Dwarka Logistics" to test invoice trip filtering.');
    }

    private function seedTrucks(): array
    {
        $defs = [
            ['truck_number' => 'GJ-01-KK-1111', 'model' => '407', 'brand' => 'Tata', 'capacity' => '10 Ton'],
            ['truck_number' => 'GJ-01-KK-2222', 'model' => '1613', 'brand' => 'Ashok Leyland', 'capacity' => '16 Ton'],
            ['truck_number' => 'GJ-01-KK-3333', 'model' => '2518', 'brand' => 'BharatBenz', 'capacity' => '25 Ton'],
        ];

        $trucks = [];
        foreach ($defs as $i => $def) {
            $trucks[] = Truck::firstOrCreate(
                ['truck_number' => $def['truck_number']],
                [
                    'rc_number' => 'RC'.(1001 + $i),
                    'model' => $def['model'],
                    'brand' => $def['brand'],
                    'year' => 2022 + $i,
                    'capacity' => $def['capacity'],
                    'owner' => 'KK Enterprise',
                    'fuel_type' => 'diesel',
                    'current_km' => 45000 + ($i * 12000),
                    'status' => 'active',
                    'insurance_expiry' => now()->addMonths(8)->toDateString(),
                    'fitness_expiry' => now()->addYear()->toDateString(),
                ]
            );
        }

        return $trucks;
    }

    private function seedDrivers(array $trucks): array
    {
        $defs = [
            ['name' => 'Ramesh Solanki', 'mobile' => '9800000001', 'license_number' => 'GJ0120210000001'],
            ['name' => 'Suresh Jadeja', 'mobile' => '9800000002', 'license_number' => 'GJ0120210000002'],
            ['name' => 'Vijay Parmar', 'mobile' => '9800000003', 'license_number' => 'GJ0120210000003'],
        ];

        $drivers = [];
        foreach ($defs as $i => $def) {
            $drivers[] = Driver::firstOrCreate(
                ['mobile' => $def['mobile']],
                [
                    'name' => $def['name'],
                    'address' => 'Dwarka, Gujarat',
                    'license_number' => $def['license_number'],
                    'license_expiry' => now()->addYears(2)->toDateString(),
                    'joining_date' => now()->subYears(2)->toDateString(),
                    'salary_type' => 'monthly',
                    'monthly_salary' => 18000 + ($i * 1000),
                    'assigned_truck_id' => $trucks[$i]->id ?? null,
                    'status' => 'active',
                ]
            );
        }

        return $drivers;
    }

    private function seedCustomers(): array
    {
        $defs = [
            [
                'mobile' => '9876500001',
                'name' => 'Shree Construction',
                'company_name' => 'Shree Construction Pvt Ltd',
                'contact_person' => 'Rajesh Patel',
                'email' => 'rajesh@shreeconstruction.com',
                'city' => 'Surat',
                'address' => 'Ring Road, Surat',
            ],
            [
                'mobile' => '9876500002',
                'name' => 'Dwarka Logistics',
                'company_name' => 'Dwarka Logistics LLP',
                'contact_person' => 'Amit Shah',
                'email' => 'amit@dwarkalogistics.com',
                'city' => 'Dwarka',
                'address' => 'Okha Highway, Dwarka',
            ],
            [
                'mobile' => '9876500003',
                'name' => 'Saurashtra Aggregates',
                'company_name' => 'Saurashtra Aggregates',
                'contact_person' => 'Kiran Mehta',
                'email' => 'kiran@saurashtraagg.com',
                'city' => 'Rajkot',
                'address' => 'Gondal Road, Rajkot',
            ],
            [
                'mobile' => '9876500004',
                'name' => 'Kutch Infra',
                'company_name' => 'Kutch Infra Projects',
                'contact_person' => 'Nilesh Joshi',
                'email' => 'nilesh@kutchinfra.com',
                'city' => 'Bhuj',
                'address' => 'Airport Road, Bhuj',
            ],
        ];

        $customers = [];
        foreach ($defs as $def) {
            $customers[] = Customer::firstOrCreate(
                ['mobile' => $def['mobile']],
                [
                    'name' => $def['name'],
                    'company_name' => $def['company_name'],
                    'contact_person' => $def['contact_person'],
                    'email' => $def['email'],
                    'address' => $def['address'],
                    'city' => $def['city'],
                    'state' => 'Gujarat',
                    'pincode' => '360001',
                    'gst_number' => '24AAAAA0000A1Z'.substr($def['mobile'], -1),
                    'credit_limit' => 500000,
                    'payment_terms' => '15 days',
                    'status' => 'active',
                ]
            );
        }

        return $customers;
    }

    private function seedHitachiMachines(): array
    {
        $defs = [
            [
                'machine_number' => 'GJ-EX-001',
                'registration_number' => 'GJ01AB1234',
                'model' => 'Hitachi ZX210',
                'hourly_rate' => 850,
                'daily_rate' => 6500,
                'monthly_rate' => 125000,
            ],
            [
                'machine_number' => 'GJ-EX-002',
                'registration_number' => 'GJ01AB5678',
                'model' => 'Hitachi ZX350',
                'hourly_rate' => 1100,
                'daily_rate' => 8500,
                'monthly_rate' => 160000,
            ],
        ];

        $machines = [];
        foreach ($defs as $i => $def) {
            $machines[] = HitachiMachine::firstOrCreate(
                ['machine_number' => $def['machine_number']],
                [
                    'registration_number' => $def['registration_number'],
                    'model' => $def['model'],
                    'owner' => 'KK Enterprise',
                    'engine_number' => 'ENG-'.(210 + $i).'-00'.($i + 1),
                    'chassis_number' => 'CHS-'.(210 + $i).'-00'.($i + 1),
                    'purchase_date' => now()->subYears(2 - $i)->toDateString(),
                    'current_hours' => 1000 + ($i * 400),
                    'current_km' => 0,
                    'fuel_type' => 'diesel',
                    'bucket_capacity' => $i === 0 ? '1.2 CUM' : '1.8 CUM',
                    'hourly_rate' => $def['hourly_rate'],
                    'daily_rate' => $def['daily_rate'],
                    'monthly_rate' => $def['monthly_rate'],
                    'status' => 'active',
                ]
            );
        }

        return $machines;
    }

    private function seedTrips(array $customers, array $trucks, array $drivers): void
    {
        $tripDefs = [
            // Shree Construction — 3 trips (good for invoice customer filter)
            [
                'trip_number' => 'TRP-SAMPLE-001',
                'customer' => 0,
                'from' => 'Surat',
                'to' => 'Ahmedabad',
                'material' => 'Sand',
                'weight' => 16,
                'freight' => 1200,
                'days_ago' => 12,
            ],
            [
                'trip_number' => 'TRP-SAMPLE-002',
                'customer' => 0,
                'from' => 'Surat',
                'to' => 'Vadodara',
                'material' => 'Aggregate',
                'weight' => 18,
                'freight' => 1100,
                'days_ago' => 7,
            ],
            [
                'trip_number' => 'TRP-SAMPLE-003',
                'customer' => 0,
                'from' => 'Bharuch',
                'to' => 'Surat',
                'material' => 'Cement',
                'weight' => 14,
                'freight' => 1300,
                'days_ago' => 1,
            ],
            // Dwarka Logistics — 2 trips
            [
                'trip_number' => 'TRP-SAMPLE-004',
                'customer' => 1,
                'from' => 'Dwarka',
                'to' => 'Rajkot',
                'material' => 'Stone',
                'weight' => 20,
                'freight' => 950,
                'days_ago' => 10,
            ],
            [
                'trip_number' => 'TRP-SAMPLE-005',
                'customer' => 1,
                'from' => 'Okha',
                'to' => 'Jamnagar',
                'material' => 'Salt',
                'weight' => 22,
                'freight' => 800,
                'days_ago' => 0,
            ],
            // Saurashtra Aggregates — 2 trips
            [
                'trip_number' => 'TRP-SAMPLE-006',
                'customer' => 2,
                'from' => 'Rajkot',
                'to' => 'Morbi',
                'material' => 'Clay',
                'weight' => 15,
                'freight' => 1000,
                'days_ago' => 5,
            ],
            [
                'trip_number' => 'TRP-SAMPLE-007',
                'customer' => 2,
                'from' => 'Gondal',
                'to' => 'Jetpur',
                'material' => 'Sand',
                'weight' => 12,
                'freight' => 900,
                'days_ago' => 3,
            ],
            // Kutch Infra — 1 trip
            [
                'trip_number' => 'TRP-SAMPLE-008',
                'customer' => 3,
                'from' => 'Bhuj',
                'to' => 'Gandhidham',
                'material' => 'Machinery',
                'weight' => 10,
                'freight' => 1500,
                'days_ago' => 4,
            ],
        ];

        foreach ($tripDefs as $i => $def) {
            $customer = $customers[$def['customer']];
            $truck = $trucks[$i % count($trucks)];
            $driver = $drivers[$i % count($drivers)];

            $dieselQty = 40 + ($i * 5);
            $dieselRate = 97;
            $dieselAmount = round($dieselQty * $dieselRate, 2);
            $toll = 500 + ($i * 50);
            $maintenance = $i % 2 === 0 ? 800 : 0;
            $other = 300;
            $salary = 1500;
            $totalExpense = round($dieselAmount + $toll + $maintenance + $other + $salary, 2);
            $totalFreight = round($def['freight'] * $def['weight'], 2);
            $advance = round($totalFreight * 0.3, 2);
            $startKm = 10000 + ($i * 500);
            $totalKm = 180 + ($i * 20);

            Trip::firstOrCreate(
                ['trip_number' => $def['trip_number']],
                [
                    'customer_id' => $customer->id,
                    'truck_id' => $truck->id,
                    'driver_id' => $driver->id,
                    'start_date' => now()->subDays($def['days_ago'])->toDateString(),
                    'end_date' => now()->subDays(max(0, $def['days_ago'] - 1))->toDateString(),
                    'from_location' => $def['from'],
                    'to_location' => $def['to'],
                    'material' => $def['material'],
                    'weight' => $def['weight'],
                    'start_km' => $startKm,
                    'end_km' => $startKm + $totalKm,
                    'total_km' => $totalKm,
                    'diesel_qty' => $dieselQty,
                    'diesel_rate' => $dieselRate,
                    'diesel_amount' => $dieselAmount,
                    'toll' => $toll,
                    'maintenance' => $maintenance,
                    'other_expense' => $other,
                    'driver_salary' => $salary,
                    'total_expense' => $totalExpense,
                    'freight' => $def['freight'],
                    'total_freight' => $totalFreight,
                    'advance_received' => $advance,
                    'balance' => round($totalFreight - $advance, 2),
                    'profit' => round($totalFreight - $totalExpense, 2),
                    'compressor' => false,
                    'remarks' => 'Local sample trip for testing',
                ]
            );
        }
    }

    private function seedHitachiRentals(array $customers, array $machines): void
    {
        $defs = [
            [
                'rental_number' => 'HRE-SAMPLE-001',
                'machine' => 0,
                'customer' => 0,
                'site' => 'Surat - Dumas Road Site',
                'billing_type' => 'daily',
                'days' => 8,
                'rate' => 6500,
                'status' => 'running',
                'operator' => 'Mahesh',
            ],
            [
                'rental_number' => 'HRE-SAMPLE-002',
                'machine' => 1,
                'customer' => 3,
                'site' => 'Bhuj Highway Project',
                'billing_type' => 'hourly',
                'hours' => 48,
                'rate' => 1100,
                'status' => 'completed',
                'operator' => 'Pravin',
            ],
            [
                'rental_number' => 'HRE-SAMPLE-003',
                'machine' => 0,
                'customer' => 1,
                'site' => 'Dwarka Temple Expansion',
                'billing_type' => 'daily',
                'days' => 5,
                'rate' => 6500,
                'status' => 'booked',
                'operator' => 'Ketan',
            ],
        ];

        foreach ($defs as $def) {
            $units = $def['billing_type'] === 'hourly' ? ($def['hours'] ?? 0) : ($def['days'] ?? 0);
            $total = round($units * $def['rate'], 2);
            $advance = round($total * 0.4, 2);

            HitachiRental::firstOrCreate(
                ['rental_number' => $def['rental_number']],
                [
                    'hitachi_id' => $machines[$def['machine']]->id,
                    'customer_id' => $customers[$def['customer']]->id,
                    'site_location' => $def['site'],
                    'billing_type' => $def['billing_type'],
                    'start_date' => now()->subDays(5)->toDateString(),
                    'end_date' => now()->addDays(3)->toDateString(),
                    'hours' => $def['hours'] ?? 0,
                    'days' => $def['days'] ?? 0,
                    'months' => 0,
                    'rate' => $def['rate'],
                    'total_amount' => $total,
                    'advance_received' => $advance,
                    'balance' => round($total - $advance, 2),
                    'operator_name' => $def['operator'],
                    'status' => $def['status'],
                    'notes' => 'Local sample Hitachi rental',
                ]
            );
        }
    }

    private function seedExpenses(array $customers): void
    {
        $dieselCat = ExpenseCategory::where('slug', 'diesel')->first();
        $tollCat = ExpenseCategory::where('slug', 'toll')->first();
        $miscCat = ExpenseCategory::where('slug', 'miscellaneous')->first();

        $shreeTrip = Trip::where('trip_number', 'TRP-SAMPLE-001')->first();
        $dwarkaTrip = Trip::where('trip_number', 'TRP-SAMPLE-004')->first();
        $hitachiRental = HitachiRental::where('rental_number', 'HRE-SAMPLE-001')->first();

        if ($dieselCat && $shreeTrip) {
            Expense::firstOrCreate(
                [
                    'expense_date' => $shreeTrip->start_date?->toDateString() ?? now()->toDateString(),
                    'trip_id' => $shreeTrip->id,
                    'category_id' => $dieselCat->id,
                    'amount' => 4500,
                ],
                [
                    'truck_id' => $shreeTrip->truck_id,
                    'driver_id' => $shreeTrip->driver_id,
                    'description' => 'Sample diesel expense linked to Shree Construction trip',
                ]
            );
        }

        if ($tollCat && $dwarkaTrip) {
            Expense::firstOrCreate(
                [
                    'expense_date' => $dwarkaTrip->start_date?->toDateString() ?? now()->toDateString(),
                    'trip_id' => $dwarkaTrip->id,
                    'category_id' => $tollCat->id,
                    'amount' => 680,
                ],
                [
                    'truck_id' => $dwarkaTrip->truck_id,
                    'driver_id' => $dwarkaTrip->driver_id,
                    'description' => 'Sample toll expense linked to Dwarka Logistics trip',
                ]
            );
        }

        if ($miscCat && $hitachiRental) {
            Expense::firstOrCreate(
                [
                    'expense_date' => $hitachiRental->start_date?->toDateString() ?? now()->toDateString(),
                    'hitachi_rental_id' => $hitachiRental->id,
                    'category_id' => $miscCat->id,
                    'amount' => 2500,
                ],
                [
                    'hitachi_id' => $hitachiRental->hitachi_id,
                    'description' => 'Sample site expense linked to Hitachi rental HRE-SAMPLE-001',
                ]
            );
        }
    }

    private function seedSalaryAdvances(array $drivers): void
    {
        $defs = [
            [0, 3, 3000, 'Gpay'],
            [0, 10, 6000, 'Cash'],
            [1, 2, 5000, 'Bank transfer'],
            [1, 18, 2500, 'Gpay'],
            [2, 5, 4000, 'Advance'],
        ];

        foreach ($defs as [$driverIndex, $daysAgo, $amount, $remarks]) {
            $driver = $drivers[$driverIndex] ?? $drivers[0];
            SalaryAdvance::firstOrCreate(
                [
                    'driver_id' => $driver->id,
                    'advance_date' => now()->subDays($daysAgo)->toDateString(),
                    'amount' => $amount,
                ],
                [
                    'remarks' => $remarks,
                    'status' => 'pending',
                ]
            );
        }
    }
}
