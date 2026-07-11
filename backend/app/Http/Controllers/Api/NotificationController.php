<?php

namespace App\Http\Controllers\Api;

use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $query = AppNotification::where('user_id', $request->user()->id)
            ->orWhereNull('user_id')
            ->latest();

        if ($request->unread_only) {
            $query->where('is_read', false);
        }

        return $this->success($query->paginate($request->get('per_page', 20)));
    }

    public function markAsRead(AppNotification $notification): JsonResponse
    {
        $notification->update(['is_read' => true, 'read_at' => now()]);

        return $this->success($notification);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        AppNotification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return $this->success(null, 'All notifications marked as read');
    }
}
