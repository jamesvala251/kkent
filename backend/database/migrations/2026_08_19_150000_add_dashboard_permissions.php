<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

return new class extends Migration
{
    public function up(): void
    {
        $names = [];
        foreach (['view', 'create', 'edit', 'delete', 'export', 'print'] as $action) {
            $permission = Permission::firstOrCreate([
                'name' => "dashboard.{$action}",
                'guard_name' => 'web',
            ]);
            $names[] = $permission->name;
        }

        foreach (Role::all() as $role) {
            if (in_array($role->name, ['Super Admin', 'Admin'], true)) {
                $role->givePermissionTo($names);
            } else {
                $role->givePermissionTo('dashboard.view');
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::query()->where('name', 'like', 'dashboard.%')->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
