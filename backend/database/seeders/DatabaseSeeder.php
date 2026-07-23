<?php

namespace Database\Seeders;

use App\Models\CompanySetting;
use App\Models\ExpenseCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->seedRolesAndPermissions();
        $this->seedExpenseCategories();
        $this->seedCompanySettings();
        $this->seedAdminUser();
        $this->call(HitachiSampleSeeder::class);
    }

    private function seedRolesAndPermissions(): void
    {
        $roles = ['Super Admin', 'Admin', 'Manager', 'Accountant', 'Operator', 'Driver'];
        $modules = [
            'customers', 'drivers', 'trucks', 'hitachi', 'trips', 'expenses', 'diesel',
            'salaries', 'invoices', 'maintenance', 'reports', 'settings', 'roles',
        ];
        $actions = ['view', 'create', 'edit', 'delete', 'export', 'print'];

        foreach ($modules as $module) {
            foreach ($actions as $action) {
                Permission::firstOrCreate(['name' => "{$module}.{$action}"]);
            }
        }

        foreach ($roles as $roleName) {
            $role = Role::firstOrCreate(['name' => $roleName]);
            if ($roleName === 'Super Admin') {
                $role->givePermissionTo(Permission::all());
            }
        }
    }

    private function seedExpenseCategories(): void
    {
        $categories = [
            'Diesel', 'Toll', 'Driver Salary', 'Food', 'Repair', 'Service',
            'Insurance', 'Permit', 'Tax', 'EMI', 'Miscellaneous',
        ];

        foreach ($categories as $name) {
            ExpenseCategory::firstOrCreate(
                ['slug' => str($name)->slug()],
                ['name' => $name, 'is_active' => true]
            );
        }
    }

    private function seedCompanySettings(): void
    {
        CompanySetting::firstOrCreate([], [
            'company_name' => 'KK Enterprise',
            'address' => '1, Vadi Vistar, At. Mota Ashota, Ta. Kalyanpur, Dist. Devbhoomi Dwarka, Gujarat, 361305',
            'phone' => '9924427936 / 9924431627',
            'email' => 'info@kkenterprise.com',
            'gst_number' => '24BQCPV9444A1ZU',
            'invoice_prefix' => 'INV',
            'trip_prefix' => 'TRP',
            'diesel_default_price' => 97,
        ]);
    }

    private function seedAdminUser(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'admin@kkenterprise.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'phone' => '9876543210',
                'status' => 'active',
            ]
        );

        $admin->assignRole('Super Admin');
    }
}
