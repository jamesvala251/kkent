<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureModulePermission
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        if ($user->hasRole(['Super Admin', 'Admin'])) {
            return $next($request);
        }

        $permission = $this->permissionFor($request);
        if (! $permission || $user->can($permission)) {
            return $next($request);
        }

        return response()->json(['success' => false, 'message' => 'You do not have permission to perform this action'], 403);
    }

    private function permissionFor(Request $request): ?string
    {
        $path = trim($request->path(), '/');
        if (str_starts_with($path, 'api/')) {
            $path = substr($path, 4);
        }

        $module = $this->moduleFor($path);
        if (! $module) {
            return null;
        }

        $action = match ($request->method()) {
            'POST' => str_contains($path, 'export') || str_contains($path, 'download') ? 'export' : 'create',
            'PUT', 'PATCH' => 'edit',
            'DELETE' => 'delete',
            default => str_contains($path, 'export') || str_contains($path, 'download') ? 'export' : 'view',
        };

        if (str_contains($path, 'download') || str_contains($path, '/print')) {
            $action = 'print';
        }

        return "{$module}.{$action}";
    }

    private function moduleFor(string $path): ?string
    {
        $first = explode('/', $path)[0] ?? '';

        return match ($first) {
            'dashboard' => 'dashboard',
            'customers' => 'customers',
            'drivers' => 'drivers',
            'trucks' => 'trucks',
            'hitachi-machines', 'hitachi' => 'hitachi',
            'trips' => 'trips',
            'expenses', 'expense-categories' => 'expenses',
            'diesel' => 'diesel',
            'salaries', 'salary-advances' => 'salaries',
            'invoices' => 'invoices',
            'challan' => 'challans',
            'reports' => 'reports',
            'settings' => 'settings',
            'users' => 'users',
            'roles', 'permissions' => 'roles',
            'documents' => 'settings',
            default => null,
        };
    }
}
