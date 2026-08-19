<?php

namespace App\Http\Controllers\Api;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends ApiController
{
    private const SUPER_ADMIN = 'Super Admin';

    public function index(Request $request): JsonResponse
    {
        $query = User::query()->with('roles')->orderBy('name');

        if ($search = trim((string) $request->get('search', ''))) {
            $query->where(function ($inner) use ($search) {
                $inner->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($role = $request->get('role')) {
            $query->role($role);
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return $this->success(UserResource::collection($query->get()));
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        if ($error = $this->guardSuperAdminRole($request->string('role')->toString())) {
            return $error;
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => $request->password,
            'status' => $request->input('status', 'active'),
        ]);

        $user->syncRoles([$request->role]);

        return $this->success(new UserResource($user->load('roles')), 'User created', 201);
    }

    public function show(User $user): JsonResponse
    {
        return $this->success(new UserResource($user->load('roles')));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        if ($error = $this->guardProtectedUser($user)) {
            return $error;
        }

        $role = $request->string('role')->toString();
        if ($error = $this->guardSuperAdminRole($role, $user)) {
            return $error;
        }

        $status = $request->input('status', $user->status);
        if ($user->id === $request->user()->id && $status === 'inactive') {
            return $this->error('You cannot deactivate your own account', 422);
        }

        if ($status === 'inactive' && $this->isLastSuperAdmin($user)) {
            return $this->error('Cannot deactivate the last Super Admin', 422);
        }

        if ($user->hasRole(self::SUPER_ADMIN) && $role !== self::SUPER_ADMIN && $this->isLastSuperAdmin($user)) {
            return $this->error('Cannot remove the last Super Admin role', 422);
        }

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'status' => $status,
        ];

        if ($request->filled('password')) {
            $data['password'] = $request->password;
        }

        $user->update($data);
        $user->syncRoles([$role]);

        if ($user->status === 'inactive') {
            $user->tokens()->delete();
        }

        return $this->success(new UserResource($user->fresh()->load('roles')), 'User updated');
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return $this->error('You cannot delete your own account', 422);
        }

        if ($error = $this->guardProtectedUser($user)) {
            return $error;
        }

        if ($this->isLastSuperAdmin($user)) {
            return $this->error('Cannot delete the last Super Admin', 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return $this->success(null, 'User deleted');
    }

    private function guardSuperAdminRole(string $role, ?User $target = null): ?JsonResponse
    {
        $actorIsSuperAdmin = request()->user()?->hasRole(self::SUPER_ADMIN);

        if ($role === self::SUPER_ADMIN && ! $actorIsSuperAdmin) {
            return $this->error('Only a Super Admin can assign the Super Admin role', 403);
        }

        if ($target?->hasRole(self::SUPER_ADMIN) && ! $actorIsSuperAdmin) {
            return $this->error('Only a Super Admin can change a Super Admin user', 403);
        }

        return null;
    }

    private function guardProtectedUser(User $user): ?JsonResponse
    {
        if ($user->hasRole(self::SUPER_ADMIN) && ! request()->user()?->hasRole(self::SUPER_ADMIN)) {
            return $this->error('Only a Super Admin can manage Super Admin users', 403);
        }

        return null;
    }

    private function isLastSuperAdmin(User $user): bool
    {
        if (! $user->hasRole(self::SUPER_ADMIN)) {
            return false;
        }

        return User::role(self::SUPER_ADMIN)->whereKeyNot($user->id)->doesntExist();
    }
}
