<?php

namespace App\Services;

use App\Models\CompanySetting;
use App\Models\User;
use App\Models\UserActivityLog;
use App\Services\AuditService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthService
{
    public function __construct(private AuditService $auditService) {}

    public function login(array $credentials): array
    {
        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Your account is inactive.'],
            ]);
        }

        $token = $user->createToken('api-token')->plainTextToken;

        $this->auditService->logUserActivity('login', 'User logged in');

        return [
            'user' => $user->load('roles', 'permissions'),
            'token' => $token,
        ];
    }

    public function logout(User $user): void
    {
        $this->auditService->logUserActivity('logout', 'User logged out');
        $user->currentAccessToken()?->delete();
    }

    public function updateProfile(User $user, array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return $user->fresh()->load('roles', 'permissions');
    }

    public function changePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update(['password' => Hash::make($newPassword)]);
        $this->auditService->logUserActivity('change_password', 'Password changed');
    }

    public function sendResetLink(string $email): string
    {
        return Password::sendResetLink(['email' => $email]);
    }

    public function resetPassword(array $data): string
    {
        return Password::reset($data, function (User $user, string $password) {
            $user->update(['password' => Hash::make($password)]);
            $this->auditService->logUserActivity('reset_password', 'Password reset via email');
        });
    }

    public function getActivityLogs(User $user, int $perPage = 15)
    {
        return UserActivityLog::where('user_id', $user->id)
            ->latest()
            ->paginate($perPage);
    }
}
