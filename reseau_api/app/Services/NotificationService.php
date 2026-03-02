<?php

namespace App\Services;

use App\Models\Notification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class NotificationService
{
    /**
     * List notifications for a user with optional filters and pagination.
     */
    public function list(int $userId, Request $request): LengthAwarePaginator
    {
        $query = Notification::where('user_id', $userId)
            ->orderBy('created_at', 'desc');

        if ($request->has('read')) {
            $query->where('read', filter_var($request->read, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $perPage = $request->get('per_page', 15);

        return $query->paginate($perPage);
    }

    /**
     * Get the count of unread notifications for a user.
     */
    public function unreadCount(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('read', false)
            ->count();
    }

    /**
     * Get unread notifications for a user, limited to 10.
     */
    public function unread(int $userId): Collection
    {
        return Notification::where('user_id', $userId)
            ->where('read', false)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
    }

    /**
     * Mark a specific notification as read.
     */
    public function markAsRead(int $userId, int $notificationId): Notification
    {
        $notification = Notification::where('user_id', $userId)
            ->findOrFail($notificationId);

        $notification->markAsRead();

        return $notification;
    }

    /**
     * Mark all notifications as read for a user.
     */
    public function markAllAsRead(int $userId): void
    {
        Notification::where('user_id', $userId)
            ->where('read', false)
            ->update([
                'read' => true,
                'read_at' => now(),
            ]);
    }

    /**
     * Show a specific notification and mark it as read.
     */
    public function show(int $userId, int $notificationId): Notification
    {
        $notification = Notification::where('user_id', $userId)
            ->findOrFail($notificationId);

        if (! $notification->read) {
            $notification->markAsRead();
        }

        return $notification;
    }

    /**
     * Delete a specific notification.
     */
    public function delete(int $userId, int $notificationId): void
    {
        $notification = Notification::where('user_id', $userId)
            ->findOrFail($notificationId);

        $notification->delete();
    }
}
