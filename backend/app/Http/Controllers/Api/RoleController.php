<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class RoleController extends ApiController
{
    private const PROTECTED_ROLES = ['Super Admin'];

    public function index(): JsonResponse
    {
        $roles = Role::withCount('permissions')->orderBy('name')->get();
        $this->attachUserCounts($roles);

        return $this->success(RoleResource::collection($roles));
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = Role::create([
            'name' => $request->name,
            'guard_name' => 'web',
        ]);

        $role->syncPermissions($request->input('permissions', []));
        $role->load('permissions');
        $role->permissions_count = $role->permissions->count();
        $role->users_count = 0;

        return $this->success(new RoleResource($role), 'Role created', 201);
    }

    public function show(Role $role): JsonResponse
    {
        $role->load('permissions');
        $role->permissions_count = $role->permissions->count();
        $role->users_count = $this->userCountForRole($role->id);

        return $this->success(new RoleResource($role));
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        if (in_array($role->name, self::PROTECTED_ROLES, true) && $request->name !== $role->name) {
            return $this->error('Super Admin role name cannot be changed', 422);
        }

        $role->update(['name' => $request->name]);
        $role->syncPermissions($request->input('permissions', []));
        $role->load('permissions');
        $role->permissions_count = $role->permissions->count();
        $role->users_count = $this->userCountForRole($role->id);

        return $this->success(new RoleResource($role), 'Role updated');
    }

    public function destroy(Role $role): JsonResponse
    {
        if (in_array($role->name, self::PROTECTED_ROLES, true)) {
            return $this->error('Super Admin role cannot be deleted', 422);
        }

        if ($this->userCountForRole($role->id) > 0) {
            return $this->error('Cannot delete role assigned to users', 422);
        }

        $role->delete();

        return $this->success(null, 'Role deleted');
    }

    private function userCountForRole(int $roleId): int
    {
        return (int) DB::table('model_has_roles')->where('role_id', $roleId)->count();
    }

    private function attachUserCounts($roles): void
    {
        $counts = DB::table('model_has_roles')
            ->select('role_id', DB::raw('count(*) as total'))
            ->groupBy('role_id')
            ->pluck('total', 'role_id');

        $roles->each(function (Role $role) use ($counts) {
            $role->users_count = (int) ($counts[$role->id] ?? 0);
        });
    }
}
