<?php

namespace App\Http\Controllers\Api;

use App\Models\AppNotification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class NotificationController extends ApiController
{
    public function __construct(private NotificationService $notifications) {}

    public function index(Request $request): JsonResponse
    {
        if (Cache::add('notifications:generate', 1, now()->addMinutes(10))) {
            $this->notifications->generate();
        }

        $query = AppNotification::query()
            ->where(function ($inner) use ($request) {
                $inner->where('user_id', $request->user()->id)
                    ->orWhereNull('user_id');
            })
            ->latest();

        if ($request->unread_only) {
            $query->where('is_read', false);
        }

        return $this->success($query->paginate($request->get('per_page', 20)));
    }

    public function markAsRead(Request $request, AppNotification $notification): JsonResponse
    {
        $belongsToUser = $notification->user_id === $request->user()->id || $notification->user_id === null;
        if (! $belongsToUser) {
            return $this->error('Notification not found', 404);
        }

        $notification->update(['is_read' => true, 'read_at' => now()]);

        return $this->success($notification);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        AppNotification::query()
            ->where(function ($query) use ($request) {
                $query->where('user_id', $request->user()->id)
                    ->orWhereNull('user_id');
            })
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return $this->success(null, 'All notifications marked as read');
    }
}
