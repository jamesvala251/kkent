<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\JsonResponse;
use Spatie\Permission\Models\Permission;

class PermissionController extends ApiController
{
    private const ACTIONS = [
        'view' => 'View',
        'create' => 'Create',
        'edit' => 'Edit',
        'delete' => 'Delete',
        'export' => 'Export',
        'print' => 'Print',
    ];

    private const MODULE_LABELS = [
        'dashboard' => 'Dashboard',
        'customers' => 'Customers',
        'drivers' => 'Drivers',
        'trucks' => 'Trucks',
        'hitachi' => 'Hitachi',
        'trips' => 'Trips',
        'expenses' => 'Expenses',
        'diesel' => 'Diesel',
        'salaries' => 'Salary',
        'invoices' => 'Invoices',
        'challans' => 'Challan',
        'reports' => 'Reports',
        'settings' => 'Settings',
        'users' => 'Users',
        'roles' => 'Roles & Permissions',
    ];

    public function index(): JsonResponse
    {
        $permissions = Permission::orderBy('name')->pluck('name');

        $order = array_flip(array_keys(self::MODULE_LABELS));

        $grouped = $permissions
            ->groupBy(fn (string $name) => explode('.', $name)[0])
            ->map(function ($items, $module) {
                $permissionMap = $items->mapWithKeys(function (string $name) {
                    $action = explode('.', $name)[1] ?? $name;

                    return [$action => $name];
                });

                return [
                    'module' => $module,
                    'label' => self::MODULE_LABELS[$module] ?? ucfirst(str_replace('_', ' ', $module)),
                    'permissions' => $permissionMap,
                ];
            })
            ->sortBy(fn (array $group) => $order[$group['module']] ?? 1000)
            ->values();

        return $this->success([
            'actions' => collect(self::ACTIONS)->map(fn ($label, $key) => ['key' => $key, 'label' => $label])->values(),
            'groups' => $grouped,
        ]);
    }
}
