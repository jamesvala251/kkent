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
                'name' => "users.{$action}",
                'guard_name' => 'web',
            ]);
            $names[] = $permission->name;
        }

        foreach (['Super Admin', 'Admin'] as $roleName) {
            $role = Role::where('name', $roleName)->first();
            $role?->givePermissionTo($names);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function down(): void
    {
        Permission::query()->where('name', 'like', 'users.%')->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
};
